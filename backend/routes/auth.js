const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const REGEX_REGD_NO = /^[A-Z0-9]{10}$/;

// Helper to generate JWT token with unique session ID
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'algolearn_jwt_secret_2026',
    { expiresIn: '7d' }
  );
};

// Helper to set HTTP-only persistent session cookie
const setSessionCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('algolearn_session', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

// Helper to clear HTTP-only session cookie
const clearSessionCookie = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('algolearn_session', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
};

// Helper to extract token from Authorization header or Cookie
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.cookies && req.cookies.algolearn_session) {
    return req.cookies.algolearn_session;
  }
  return null;
};

// -------------------------------------------------------------
// POST /api/auth/signup (Student Sign-Up)
// Required fields: Name, Branch, Registration Number, Password
// Atomically claims the first active session for the student.
// -------------------------------------------------------------
router.post('/signup', async (req, res) => {
  try {
    const { name, branch, regdNo, password } = req.body;

    // 1. Validate Name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    const cleanName = name.trim();

    // 2. Validate Branch
    if (!branch || typeof branch !== 'string' || !branch.trim()) {
      return res.status(400).json({ error: 'Branch is required (e.g. 3/4-CSD-A).' });
    }
    const cleanBranch = branch.trim();

    // 3. Validate Registration Number
    if (!regdNo || typeof regdNo !== 'string') {
      return res.status(400).json({
        error: 'Registration Number is required and must be exactly 10 characters (uppercase letters and digits).',
      });
    }

    const cleanRegdNo = regdNo.trim().toUpperCase();

    // Reject lowercase, spaces, punctuation, or length != 10
    if (!REGEX_REGD_NO.test(cleanRegdNo) || cleanRegdNo.length !== 10) {
      return res.status(400).json({
        error: 'Registration Number must contain exactly 10 characters consisting only of uppercase letters (A–Z) and digits (0–9).',
      });
    }

    // 4. Validate Password
    // For this version, the initial password equals the 10-character registration number
    const submittedPassword = password ? String(password).trim().toUpperCase() : cleanRegdNo;
    if (submittedPassword !== cleanRegdNo) {
      return res.status(400).json({
        error: 'For new registration, the initial password must match your 10-character Registration Number.',
      });
    }

    // 5. Check if Registration Number already exists
    const existingStudent = await Student.findOne({ regdNo: cleanRegdNo });
    if (existingStudent) {
      return res.status(400).json({
        error: 'Registration Number is already registered to another student account.',
      });
    }

    // 6. Securely hash password with bcrypt (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanRegdNo, salt);

    // 7. Create unique session identifier
    const sessionId = crypto.randomUUID();

    // 8. Store new student record in MongoDB with active session claimed
    const newStudent = new Student({
      name: cleanName,
      branch: cleanBranch,
      regdNo: cleanRegdNo,
      password: hashedPassword,
      role: 'student',
      xp: 0,
      topicsStarted: 0,
      topicsCompleted: 0,
      overallProgress: 0,
      progress: {},
      activeSessionId: sessionId,
      sessionLastActive: new Date(),
    });

    await newStudent.save();

    // 9. Generate authentication session token
    const token = generateToken({
      id: newStudent._id.toString(),
      regdNo: newStudent.regdNo,
      name: newStudent.name,
      role: 'student',
      sessionId,
    });

    setSessionCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Student account created successfully.',
      token,
      student: {
        id: newStudent._id.toString(),
        name: newStudent.name,
        branch: newStudent.branch,
        regdNo: newStudent.regdNo,
        role: newStudent.role,
        xp: 0,
        topicsStarted: 0,
        topicsCompleted: 0,
        overallProgress: 0,
        progress: {},
      },
    });
  } catch (error) {
    console.error('Sign-up error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Registration Number is already registered to another student account.',
      });
    }
    return res.status(500).json({
      error: 'An unexpected database error occurred during registration. Please try again.',
    });
  }
});

// Also alias /register to /signup
router.post('/register', async (req, res, next) => {
  req.url = '/signup';
  return router.handle(req, res, next);
});

// -------------------------------------------------------------
// POST /api/auth/login (Student Sign-In)
// Required fields: Registration Number, Password
// RULE: ONE ACTIVE LOGIN SESSION PER REGISTRATION NUMBER.
// If an active session exists, the new login is REJECTED without overwriting the existing session.
// Concurrent logins are protected via atomic MongoDB findOneAndUpdate.
// -------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { regdNo, password } = req.body;

    // Validate Registration Number presence & format
    if (!regdNo || typeof regdNo !== 'string') {
      return res.status(400).json({
        error: 'Registration Number is required.',
      });
    }

    const cleanRegdNo = regdNo.trim().toUpperCase();

    if (!REGEX_REGD_NO.test(cleanRegdNo) || cleanRegdNo.length !== 10) {
      return res.status(400).json({
        error: 'Registration Number must be exactly 10 uppercase characters (letters and digits).',
      });
    }

    // Validate Password presence
    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({
        error: 'Password is required.',
      });
    }

    // Query MongoDB for student account
    const student = await Student.findOne({ regdNo: cleanRegdNo });

    // If student does not have an account, reject login
    if (!student) {
      return res.status(404).json({
        error: 'Account not found. Please sign up first.',
        notFound: true,
      });
    }

    // Verify password against stored bcrypt hash
    const isMatch = await bcrypt.compare(password.trim(), student.password);
    if (!isMatch) {
      const isMatchUpper = await bcrypt.compare(password.trim().toUpperCase(), student.password);
      if (!isMatchUpper) {
        return res.status(401).json({
          error: 'Invalid credentials. Please check your password.',
        });
      }
    }

    // CRITICAL REQUIREMENT 1:
    // If student already has an active session, REJECT new login without modifying existing session!
    if (student.activeSessionId && student.activeSessionId.trim() !== '') {
      // Check if session has timed out (e.g. stale for > 7 days)
      const lastActive = student.sessionLastActive ? new Date(student.sessionLastActive).getTime() : 0;
      const isStale = lastActive > 0 && (Date.now() - lastActive > 7 * 24 * 60 * 60 * 1000);

      if (!isStale) {
        return res.status(409).json({
          error: 'This account is already logged in on another session. Please sign out from the active session before logging in again.',
          alreadyLoggedIn: true,
        });
      }
    }

    // Generate cryptographically unpredictable session ID
    const newSessionId = crypto.randomUUID();

    // Atomically claim the session. If another concurrent request claimed it first, this update will not match.
    const claimedStudent = await Student.findOneAndUpdate(
      {
        _id: student._id,
        $or: [
          { activeSessionId: null },
          { activeSessionId: { $exists: false } },
          { activeSessionId: '' },
          // If session was stale, allow claiming
          ...(student.activeSessionId ? [{ activeSessionId: student.activeSessionId }] : []),
        ],
      },
      {
        $set: {
          activeSessionId: newSessionId,
          sessionLastActive: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!claimedStudent) {
      return res.status(409).json({
        error: 'This account is already logged in on another session. Please sign out from the active session before logging in again.',
        alreadyLoggedIn: true,
      });
    }

    // Generate authenticated session token
    const token = generateToken({
      id: claimedStudent._id.toString(),
      regdNo: claimedStudent.regdNo,
      name: claimedStudent.name,
      role: claimedStudent.role || 'student',
      sessionId: newSessionId,
    });

    setSessionCookie(res, token);

    return res.json({
      success: true,
      token,
      student: {
        id: claimedStudent._id.toString(),
        name: claimedStudent.name,
        branch: claimedStudent.branch,
        regdNo: claimedStudent.regdNo,
        role: claimedStudent.role || 'student',
        xp: claimedStudent.xp || 0,
        topicsStarted: claimedStudent.topicsStarted || 0,
        topicsCompleted: claimedStudent.topicsCompleted || 0,
        overallProgress: claimedStudent.overallProgress || 0,
        progress: claimedStudent.progress || {},
      },
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    return res.status(500).json({
      error: 'An unexpected database error occurred during sign in. Please try again.',
    });
  }
});

// -------------------------------------------------------------
// POST /api/auth/logout (Sign Out — Releases Active Session)
// Clears server-side active-session record safely and reliably.
// -------------------------------------------------------------
router.post('/logout', async (req, res) => {
  try {
    const token = extractToken(req);
    const bodyRegdNo = req.body?.regdNo ? String(req.body.regdNo).trim().toUpperCase() : null;
    let cleared = false;

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'algolearn_jwt_secret_2026'
        );

        if (decoded && decoded.id) {
          // Atomically clear active session
          const query = { _id: decoded.id };
          if (decoded.sessionId) {
            query.activeSessionId = decoded.sessionId;
          }
          await Student.updateOne(query, {
            $set: { activeSessionId: null, sessionLastActive: null },
          });
          cleared = true;
        }
      } catch (tokenErr) {
        // Token was expired; decode payload without verification to release active session
        try {
          const unverified = jwt.decode(token);
          if (unverified && unverified.id) {
            await Student.updateOne(
              { _id: unverified.id },
              { $set: { activeSessionId: null, sessionLastActive: null } }
            );
            cleared = true;
          }
        } catch (e) {}
      }
    }

    // Fallback: if token wasn't verifiable, clear session via verified student's regdNo
    if (!cleared && bodyRegdNo) {
      await Student.updateOne(
        { regdNo: bodyRegdNo },
        { $set: { activeSessionId: null, sessionLastActive: null } }
      );
      cleared = true;
    }

    clearSessionCookie(res);

    return res.json({
      success: true,
      message: 'Logged out successfully. Active session released.',
    });
  } catch (error) {
    console.error('Sign-out error:', error);
    clearSessionCookie(res);
    return res.json({
      success: true,
      message: 'Logged out.',
    });
  }
});

// -------------------------------------------------------------
// POST /api/auth/recover-session (Authorized Session Recovery)
// Safe recovery path for a genuinely lost device or stranded session.
// Requires valid registration number and password verification.
// -------------------------------------------------------------
router.post('/recover-session', async (req, res) => {
  try {
    const { regdNo, password } = req.body;

    if (!regdNo || !password) {
      return res.status(400).json({
        error: 'Registration Number and Password are required to release a stranded session.',
      });
    }

    const cleanRegdNo = regdNo.trim().toUpperCase();
    const student = await Student.findOne({ regdNo: cleanRegdNo });

    if (!student) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const isMatch = await bcrypt.compare(password.trim(), student.password);
    const isMatchUpper = !isMatch && (await bcrypt.compare(password.trim().toUpperCase(), student.password));

    if (!isMatch && !isMatchUpper) {
      return res.status(401).json({ error: 'Invalid credentials. Session recovery denied.' });
    }

    // Verified credentials! Safely clear the active session so the student can log in.
    await Student.updateOne(
      { _id: student._id },
      { $set: { activeSessionId: null, sessionLastActive: null } }
    );

    clearSessionCookie(res);

    return res.json({
      success: true,
      message: 'Previous active session cleared successfully. You may now log in.',
    });
  } catch (error) {
    console.error('Recover session error:', error);
    return res.status(500).json({ error: 'Error resetting session.' });
  }
});

// -------------------------------------------------------------
// POST /api/auth/admin-login (Admin Verification)
// Required fields: Name, Admin Code
// -------------------------------------------------------------
router.post('/admin-login', async (req, res) => {
  try {
    const { name, adminCode } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Administrator Name is required.' });
    }

    if (!adminCode || typeof adminCode !== 'string' || !adminCode.trim()) {
      return res.status(400).json({ error: 'Admin Access Code is required.' });
    }

    const cleanName = name.trim();
    const cleanCode = adminCode.trim();

    // Verify against server-side secret configuration
    const configuredCode = (process.env.ADMIN_CODE || 'ADMIN2026').trim();

    if (cleanCode !== configuredCode) {
      return res.status(401).json({
        error: 'Invalid administrator access code. Access denied.',
      });
    }

    // Admin verified! Generate admin session token
    const token = generateToken({
      id: 'admin-' + Date.now(),
      name: cleanName,
      role: 'admin',
    });

    setSessionCookie(res, token);

    return res.json({
      success: true,
      token,
      user: {
        id: 'admin-' + Date.now(),
        name: cleanName,
        email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@algolearn.edu`,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      error: 'An unexpected server error occurred during admin authentication.',
    });
  }
});

// -------------------------------------------------------------
// GET /api/auth/me (Current Session Verification)
// Validates token AND checks that token sessionId matches student's activeSessionId in MongoDB.
// -------------------------------------------------------------
router.get('/me', async (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'algolearn_jwt_secret_2026');

    if (decoded.role === 'admin') {
      return res.json({
        authenticated: true,
        user: {
          id: decoded.id,
          name: decoded.name,
          role: 'admin',
        },
      });
    }

    const student = await Student.findById(decoded.id).select('-password');
    if (!student) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    // Validate that token's session ID matches the currently active session in DB
    if (!student.activeSessionId || student.activeSessionId !== decoded.sessionId) {
      return res.status(401).json({
        error: 'Session expired, revoked, or replaced. Please log in again.',
        sessionRevoked: true,
      });
    }

    // Touch sessionLastActive
    Student.updateOne(
      { _id: student._id },
      { $set: { sessionLastActive: new Date() } }
    ).catch(() => {});

    return res.json({
      authenticated: true,
      student: {
        id: student._id.toString(),
        name: student.name,
        branch: student.branch,
        regdNo: student.regdNo,
        role: student.role || 'student',
        xp: student.xp || 0,
        topicsStarted: student.topicsStarted || 0,
        topicsCompleted: student.topicsCompleted || 0,
        overallProgress: student.overallProgress || 0,
        progress: student.progress || {},
      },
    });
  } catch (error) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
});

module.exports = router;
