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

    // Check if the session identifier in the token matches the active session in MongoDB
    if (!student.activeSessionId || student.activeSessionId !== decoded.sessionId) {
      return res.status(401).json({
        error: 'Session expired, revoked, or active elsewhere. Please log in again.',
        sessionRevoked: true,
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

module.exports = {
  verifyAuth,
};
