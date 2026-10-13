const express = require('express');
const router = express.Router();
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
    const { xp, progress, topicsStarted, topicsCompleted, overallProgress } = req.body;

    const student = await Student.findOne({ regdNo: cleanRegdNo });
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    if (progress !== undefined && typeof progress === 'object') {
      student.progress = { ...(student.progress || {}), ...progress };
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
