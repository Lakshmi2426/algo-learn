const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

/**
 * Reusable Authentication and Single-Session Verification Middleware
 * Validates token signature AND verifies that the presented session identifier
 * matches the student's currently active server session in MongoDB.
 */
const verifyAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.algolearn_session) {
      token = req.cookies.algolearn_session;
    }

    if (!token) {
      return res.status(401).json({
        error: 'No authentication token provided.',
        authenticated: false,
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'algolearn_jwt_secret_2026'
    );

    // Admin role bypasses single-student session constraints
    if (decoded.role === 'admin') {
      req.user = decoded;
      return next();
    }

    // Verify student active session in MongoDB
    const student = await Student.findById(decoded.id).select('-password');
    if (!student) {
      return res.status(401).json({
        error: 'Student account not found.',
        authenticated: false,
      });
    }

    // Update sessionLastActive timestamp
    Student.updateOne(
      { _id: student._id },
      { $set: { sessionLastActive: new Date() } }
    ).catch(() => {});

    req.user = decoded;
    req.student = student;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Session token has expired. Please log in again.',
        sessionExpired: true,
        authenticated: false,
      });
    }
    return res.status(401).json({
      error: 'Invalid or revoked authentication token.',
      authenticated: false,
    });
  }
};

// In-memory rate limiter specifically for login and signup brute-force protection
const authRateLimitMap = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return req.headers['x-real-ip'] || req.ip || req.connection?.remoteAddress || 'unknown';
}

function getRateLimitKey(req) {
  const clientIp = getClientIp(req);
  const regdNo = (req.body?.regdNo || req.body?.username || req.body?.name || '')
    .toString()
    .trim()
    .toUpperCase();
  return regdNo ? `${clientIp}:${regdNo}` : clientIp;
}

const authRateLimiter = (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  const key = getRateLimitKey(req);
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 120; // 120 requests per minute per key

  const record = authRateLimitMap.get(key);
  if (!record || now - record.startTime > windowMs) {
    authRateLimitMap.set(key, { count: 1, startTime: now });
    return next();
  }

  record.count += 1;
  if (record.count > maxRequests) {
    const retrySecs = Math.max(1, Math.ceil((windowMs - (now - record.startTime)) / 1000));
    res.setHeader('Retry-After', retrySecs);
    return res.status(429).json({
      error: 'Too many attempts. Try again later.',
      isRateLimited: true,
      retryAfter: retrySecs,
    });
  }

  next();
};

function resetAuthRateLimit(req) {
  try {
    const key = getRateLimitKey(req);
    authRateLimitMap.delete(key);
  } catch (e) {}
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of authRateLimitMap.entries()) {
    if (now - record.startTime > 60000) {
      authRateLimitMap.delete(key);
    }
  }
}, 120000).unref();

module.exports = {
  verifyAuth,
  authRateLimiter,
  resetAuthRateLimit,
};
