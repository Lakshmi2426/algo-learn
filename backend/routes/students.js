const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// -------------------------------------------------------------
// GET /api/students - List all registered students (passwords omitted)
// -------------------------------------------------------------
router.get('/', async (_req, res) => {
  try {
    const students = await Student.find({}, '-password').sort({ createdAt: -1 });
    const formatted = students.map((s) => {
      const topicSum = sumTopicPoints(s.progress);
      const totalPoints = Math.max(s.xp || 0, topicSum);
      return {
        id: s._id.toString(),
        name: s.name,
        branch: s.branch,
        regdNo: s.regdNo,
        email: `${s.regdNo.toLowerCase()}@algolearn.edu`,
        avatar: '',
        role: s.role || 'student',
        xp: totalPoints,
        topicsStarted: s.topicsStarted || 0,
        topicsCompleted: s.topicsCompleted || 0,
        overallProgress: totalPoints,
        progress: s.progress || {},
        topicCompletions: s.topicCompletions || {},
        streak: 1,
        lastActive: 'Active recently',
        currentStage: totalPoints > 400 ? 'Phase 2: Data Structures' : 'Phase 1: Foundations',
        createdAt: s.createdAt,
      };
    });
    return res.json({ students: formatted });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ error: 'Failed to retrieve student records.' });
  }
});

// -------------------------------------------------------------
// GET /api/students/:regdNo - Get single student by registration number
// -------------------------------------------------------------
router.get('/:regdNo', async (req, res) => {
  try {
    const cleanRegdNo = req.params.regdNo.trim().toUpperCase();
    const student = await Student.findOne({ regdNo: cleanRegdNo }).select('-password');
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    return res.json({ student });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching student record.' });
  }
});

// Helper to calculate total XP by summing points across all topics
function sumTopicPoints(progressMap) {
  if (!progressMap || typeof progressMap !== 'object') return 0;
  let sum = 0;
  for (const [key, val] of Object.entries(progressMap)) {
    if (typeof val === 'number') {
      sum += Math.round(val);
    } else if (val && typeof val.points === 'number') {
      sum += Math.round(val.points);
    } else if (val && typeof val.score === 'number') {
      sum += Math.round(val.score);
    }
  }
  return sum;
}

// -------------------------------------------------------------
// PUT/POST /api/students/:regdNo/progress - Update student progress and XP
// -------------------------------------------------------------
const handleProgressUpdate = async (req, res) => {
  try {
    const cleanRegdNo = req.params.regdNo.trim().toUpperCase();
    const { progress, topicCompletions, moduleState, topicsStarted, topicsCompleted } = req.body;

    const student = await Student.findOne({ regdNo: cleanRegdNo });
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // Progress is private account data: require an authenticated owner for every write.
    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token && req.cookies) token = req.cookies.algolearn_session || null;
    if (!token) return res.status(401).json({ error: 'Authentication is required to save progress.' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'algolearn_jwt_secret_2026');
    } catch {
      return res.status(401).json({ error: 'Session expired or invalid token.' });
    }
    if (decoded.role !== 'admin' && String(decoded.id) !== student._id.toString()) {
      return res.status(403).json({ error: 'Access denied: Cannot update progress for another student.' });
    }
    if (decoded.role !== 'admin' && (!decoded.sessionId || decoded.sessionId !== student.activeSessionId)) {
      return res.status(401).json({ error: 'This session is no longer active.', sessionRevoked: true });
    }

    if (progress !== undefined && typeof progress === 'object') {
      student.progress = { ...(student.progress || {}), ...progress };
    }
    if (topicCompletions !== undefined && typeof topicCompletions === 'object') {
      student.topicCompletions = { ...(student.topicCompletions || {}), ...topicCompletions };
    }
    if (moduleState !== undefined && typeof moduleState === 'object') {
      student.moduleState = { ...(student.moduleState || {}), ...moduleState };
    }

    // Leaderboard XP & Overall Progress = exact sum of points across all topics
    const calculatedSum = sumTopicPoints(student.progress);
    student.xp = calculatedSum;
    student.overallProgress = calculatedSum;

    if (topicsStarted !== undefined) student.topicsStarted = topicsStarted;
    if (topicsCompleted !== undefined) student.topicsCompleted = topicsCompleted;

    await student.save();
    return res.json({
      success: true,
      student: {
        regdNo: student.regdNo,
        xp: student.xp,
        topicsStarted: student.topicsStarted,
        topicsCompleted: student.topicsCompleted,
        overallProgress: student.overallProgress,
        progress: student.progress,
        topicCompletions: student.topicCompletions || {},
        moduleState: student.moduleState || {},
      },
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    return res.status(500).json({ error: 'Error saving student progress to database.' });
  }
};

router.put('/:regdNo/progress', handleProgressUpdate);
router.post('/:regdNo/progress', handleProgressUpdate);

module.exports = router;
