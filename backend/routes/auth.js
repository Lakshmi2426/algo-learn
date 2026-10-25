const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { resetAuthRateLimit } = require('../middleware/auth');

const REGEX_REGD_NO = /^[A-Z0-9]{10}$/;

const TOPIC_IDS = [
  'stack', 'hashing', 'linear-search', 'binary-search', 'sorting', 'sll', 'dll',
  'cll', 'queue', 'bfs', 'trees', 'bst', 'dsa-types',
];

const sumTopicPoints = (progressMap) => {
  if (!progressMap || typeof progressMap !== 'object') return 0;
  return TOPIC_IDS.reduce((sum, key) => {
    const val = progressMap[key];
    if (typeof val === 'number') {
      return sum + val;
    } else if (val && typeof val.points === 'number') {
      return sum + val.points;
    } else if (val && typeof val.score === 'number') {
      return sum + val.score;
    }
    return sum;
  }, 0);
};

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

    // Reject invalid format or length != 10
    if (!REGEX_REGD_NO.test(cleanRegdNo) || cleanRegdNo.length !== 10) {
      return res.status(400).json({
        error: 'Registration Number must contain exactly 10 characters consisting only of uppercase letters (A–Z) and digits (0–9).',
      });
    }

    // 4. Validate Password
    if (!password || typeof password !== 'string' || password.trim().length < 6) {
      return res.status(400).json({
        error: 'Password is required and must be at least 6 characters long.',
      });
    }

    const cleanPassword = password.trim();

    // 5. Check if Registration Number already exists (exact or case-insensitive)
    const existingStudent = await Student.findOne({
      $or: [
        { regdNo: cleanRegdNo },
        { regdNo: new RegExp('^' + cleanRegdNo + '$', 'i') },
      ],
    });
    if (existingStudent) {
      return res.status(400).json({
        error: 'Registration Number is already registered to another student account.',
      });
    }

    // 6. Securely hash password with bcrypt (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    // 7. Create unique session identifier
    const sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

    // 8. Default progress initialized across all 13 DSA topics
    const defaultProgress = {
      stack: 0,
      hashing: 0,
      'linear-search': 0,
      'binary-search': 0,
      sorting: 0,
      sll: 0,
      dll: 0,
      cll: 0,
      queue: 0,
      bfs: 0,
      trees: 0,
      bst: 0,
      'dsa-types': 0,
    };

    // 9. Store new student record in MongoDB with active session claimed
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
      progress: defaultProgress,
      topicCompletions: Object.fromEntries(Object.keys(defaultProgress).map((topic) => [topic, 0])),
      moduleState: {},
      activeSessionId: sessionId,
      sessionLastActive: new Date(),
    });

    await newStudent.save();

    // 10. Generate authentication session token
    const token = generateToken({
      id: newStudent._id.toString(),
      regdNo: newStudent.regdNo,
      name: newStudent.name,
      role: 'student',
      sessionId,
    });

    try {
      setSessionCookie(res, token);
    } catch (cookieErr) {
      console.warn('Warning: Could not set session cookie:', cookieErr.message);
    }

    resetAuthRateLimit(req);

    return res.status(201).json({
      success: true,
      message: 'Student account created successfully.',
      token,
      student: {
        id: newStudent._id.toString(),
        name: newStudent.name,
        branch: newStudent.branch,
        regdNo: newStudent.regdNo,
        role: newStudent.role || 'student',
        xp: 0,
        topicsStarted: 0,
        topicsCompleted: 0,
        overallProgress: 0,
        progress: defaultProgress,
        topicCompletions: newStudent.topicCompletions || {},
        moduleState: newStudent.moduleState || {},
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
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
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
// POLICY: Single active session per student with automatic takeover.
// When a user enters valid credentials, sign-in succeeds immediately
// regardless of whether another session exists. The new device receives
// an authenticated session and the prior session is replaced atomically.
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

    const cleanPassword = password.trim();

    // Query MongoDB for student account (with case-insensitive fallback)
    let student = await Student.findOne({ regdNo: cleanRegdNo });
    if (!student) {
      student = await Student.findOne({
        regdNo: new RegExp('^' + cleanRegdNo + '$', 'i'),
      });
    }

    // If student does not have an account, reject login with 404
    if (!student) {
      return res.status(404).json({
        error: 'Account not found. Please sign up first.',
        notFound: true,
      });
    }

    // Guard against malformed records missing a password hash
    if (!student.password) {
      console.error(`Student record ${cleanRegdNo} has no password hash stored.`);
      return res.status(401).json({
        error: 'Account password not configured. Please contact administrator or sign up.',
      });
    }

    // Verify password against stored bcrypt hash
    const isMatch = await bcrypt.compare(cleanPassword, student.password);
    if (!isMatch) {
      const isMatchUpper = await bcrypt.compare(cleanPassword.toUpperCase(), student.password);
      if (!isMatchUpper) {
        return res.status(401).json({
          error: 'Invalid credentials. Please check your password.',
        });
      }
    }

    // Single Active Session Takeover:
    // Generate new unique session ID and atomically update the student record.
    // This replaces any previous activeSessionId without blocking the user.
    const newSessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

    let claimedStudent = await Student.findByIdAndUpdate(
      student._id,
      {
        $set: {
          activeSessionId: newSessionId,
          sessionLastActive: new Date(),
          regdNo: cleanRegdNo, // Ensure canonical uppercase format
        },
      },
      { returnDocument: 'after' }
    );

    if (!claimedStudent) {
      await Student.updateOne(
        { _id: student._id },
        {
          $set: {
            activeSessionId: newSessionId,
            sessionLastActive: new Date(),
            regdNo: cleanRegdNo,
          },
        }
      );
      claimedStudent = await Student.findById(student._id);
    }

    if (!claimedStudent) {
      return res.status(500).json({
        error: 'Failed to establish student session.',
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

    try {
      setSessionCookie(res, token);
    } catch (cookieErr) {
      console.warn('Warning: Could not set session cookie:', cookieErr.message);
    }

    const studentProgress = (claimedStudent.progress && typeof claimedStudent.progress === 'object')
      ? claimedStudent.progress
      : {};

    resetAuthRateLimit(req);

    return res.json({
      success: true,
      token,
      student: {
        id: claimedStudent._id.toString(),
        name: claimedStudent.name || 'Student',
        branch: claimedStudent.branch || '',
        regdNo: claimedStudent.regdNo,
        role: claimedStudent.role || 'student',
        xp: sumTopicPoints(studentProgress),
        topicsStarted: typeof claimedStudent.topicsStarted === 'number' ? claimedStudent.topicsStarted : 0,
        topicsCompleted: typeof claimedStudent.topicsCompleted === 'number' ? claimedStudent.topicsCompleted : 0,
        overallProgress: typeof claimedStudent.overallProgress === 'number' ? claimedStudent.overallProgress : 0,
        progress: studentProgress,
        topicCompletions: claimedStudent.topicCompletions || {},
        moduleState: claimedStudent.moduleState || {},
      },
    });
  } catch (error) {
    console.error('Sign-in error for regdNo:', req.body?.regdNo ? String(req.body.regdNo).trim().toUpperCase() : 'unknown', error);
    const isDbError =
      error.name === 'MongoServerSelectionError' ||
      error.name === 'MongoNetworkError' ||
      error.name === 'MongoTimeoutError' ||
      error.name === 'MongooseServerSelectionError';

    return res.status(500).json({
      error: isDbError
        ? 'Database connection timeout. Please check your network and try again.'
        : 'An unexpected database error occurred during sign in. Please try again.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
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

    if (token) {
      let decodedSessionId = null;
      let studentId = null;

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'algolearn_jwt_secret_2026'
        );
        if (decoded && decoded.id) {
          studentId = decoded.id;
          decodedSessionId = decoded.sessionId;
        }
      } catch (tokenErr) {
        try {
          const unverified = jwt.decode(token);
          if (unverified && unverified.id) {
            studentId = unverified.id;
            decodedSessionId = unverified.sessionId;
          }
        } catch (e) { }
      }

      // ONLY clear activeSessionId in MongoDB if the session being logged out
      // is STILL the student's active session! If another device has already logged in
      // (activeSessionId replaced), NEVER clear the new session.
      if (studentId && decodedSessionId) {
        await Student.updateOne(
          { _id: studentId, activeSessionId: decodedSessionId },
          { $set: { activeSessionId: null, sessionLastActive: null } }
        );
      }
    }

    clearSessionCookie(res);

    return res.json({
      success: true,
      message: 'Logged out successfully.',
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
    let student = await Student.findOne({ regdNo: cleanRegdNo });
    if (!student) {
      student = await Student.findOne({
        regdNo: new RegExp('^' + cleanRegdNo + '$', 'i'),
      });
    }

    if (!student) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (!student.password) {
      return res.status(401).json({ error: 'Password not set for account.' });
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

    try {
      clearSessionCookie(res);
    } catch (e) { }

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
// POST /api/auth/admin-login (Admin & Teacher Verification)
// Required fields: Name, Admin Code or Teacher ID
// -------------------------------------------------------------
router.post('/admin-login', async (req, res) => {
  try {
    const { name, adminCode } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    if (!adminCode || typeof adminCode !== 'string' || !adminCode.trim()) {
      return res.status(400).json({ error: 'Admin Access Code or Teacher ID is required.' });
    }

    const cleanName = name.trim();
    const cleanCode = adminCode.trim();

    // Verify against server-side secret configuration for Administrator
    const configuredCode = (process.env.ADMIN_CODE || 'ADMIN2026').trim();

    if (cleanCode === configuredCode) {
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
    }

    // Check if Teacher ID matches a registered teacher in MongoDB
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({
      $or: [
        { id: cleanCode },
        { id: cleanCode.toUpperCase() },
        { id: cleanCode.toLowerCase() },
        { teacherId: cleanCode },
        { teacherId: cleanCode.toUpperCase() },
      ],
    });

    if (teacher) {
      // Authenticate strictly as a teacher, NOT an administrator
      const token = generateToken({
        id: teacher.id,
        teacherId: teacher.teacherId || teacher.id,
        name: teacher.name,
        role: 'teacher',
      });

      setSessionCookie(res, token);

      return res.json({
        success: true,
        token,
        user: {
          id: teacher.id,
          teacherId: teacher.teacherId || teacher.id,
          name: teacher.name,
          subject: teacher.subject,
          email: teacher.email || `${teacher.name.toLowerCase().replace(/\s+/g, '.')}@algolearn.edu`,
          role: 'teacher',
        },
      });
    }

    return res.status(401).json({
      error: 'Invalid administrator access code or Teacher ID. Access denied.',
    });
  } catch (error) {
    console.error('Admin/Teacher login error:', error);
    return res.status(500).json({
      error: 'An unexpected server error occurred during authentication.',
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

    if (decoded.role === 'teacher') {
      return res.json({
        authenticated: true,
        user: {
          id: decoded.id,
          teacherId: decoded.teacherId || decoded.id,
          name: decoded.name,
          role: 'teacher',
        },
      });
    }

    const student = await Student.findById(decoded.id).select('-password');
    if (!student) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    if (!decoded.sessionId || decoded.sessionId !== student.activeSessionId) {
      return res.status(401).json({
        error: 'This session is no longer active. Please sign in again.',
        sessionRevoked: true,
        authenticated: false,
      });
    }

    // Touch sessionLastActive
    Student.updateOne(
      { _id: student._id },
      { $set: { sessionLastActive: new Date() } }
    ).catch(() => { });

    return res.json({
      authenticated: true,
      student: {
        id: student._id.toString(),
        name: student.name,
        branch: student.branch,
        regdNo: student.regdNo,
        role: student.role || 'student',
        xp: sumTopicPoints(student.progress),
        topicsStarted: student.topicsStarted || 0,
        topicsCompleted: student.topicsCompleted || 0,
        overallProgress: student.overallProgress || 0,
        progress: student.progress || {},
        topicCompletions: student.topicCompletions || {},
        moduleState: student.moduleState || {},
      },
    });
  } catch (error) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
});

module.exports = router;
