const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

/**
 * Helper to compute division tier from XP
 */
const getTier = (xp = 0) => {
  if (xp >= 2000) return 'Grandmaster';
  if (xp >= 1200) return 'Master';
  if (xp >= 800) return 'Diamond';
  if (xp >= 400) return 'Platinum';
  return 'Gold';
};

/**
 * GET /api/leaderboard
 * Returns real eligible student rankings aggregated from MongoDB.
 * Starts completely EMPTY if no students have earned progress yet.
 */
router.get('/', async (_req, res) => {
  try {
    const students = await Student.find({}, '-password');

    // All registered students appear on the leaderboard ranked by XP
    const eligible = [...students];

    // Sort strictly by XP descending, with topicsCompleted as tie-breaker, then name
    eligible.sort((a, b) => (b.xp || 0) - (a.xp || 0) || (b.topicsCompleted || 0) - (a.topicsCompleted || 0) || a.name.localeCompare(b.name));

    const leaderboard = eligible.map((s, idx) => ({
      rank: idx + 1,
      id: s._id.toString(),
      name: s.name,
      username: s.regdNo ? s.regdNo.toLowerCase() : s.name.toLowerCase().replace(/\s+/g, '_'),
      regdNo: s.regdNo,
      branch: s.branch,
      avatar: '',
      xp: s.xp || 0,
      streak: 1,
      level: Math.floor((s.xp || 0) / 350) + 1,
      tier: getTier(s.xp || 0),
      countryCode: '🌐',
      solvedCount: s.topicsCompleted || 0,
      topicsCompleted: s.topicsCompleted || 0,
      topicsMastered: s.topicsCompleted || 0,
      topicsStarted: s.topicsStarted || 0,
      overallProgress: s.overallProgress || 0,
      badgeTitle: 'Algo Scholar',
    }));

    return res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Failed to retrieve leaderboard records.' });
  }
});

/**
 * POST /api/leaderboard/sync
 * Syncs real student score updates directly to MongoDB.
 */
router.post('/sync', async (req, res) => {
  try {
    const { regdNo, studentName, xp, topicsCompleted, topicsStarted, overallProgress, progress } = req.body;

    if (regdNo) {
      const cleanRegdNo = regdNo.trim().toUpperCase();
      const student = await Student.findOne({ regdNo: cleanRegdNo });

      if (student) {
        if (xp !== undefined && typeof xp === 'number') {
          student.xp = Math.max(student.xp || 0, xp);
        }
        if (topicsCompleted !== undefined && typeof topicsCompleted === 'number') {
          student.topicsCompleted = Math.max(student.topicsCompleted || 0, topicsCompleted);
        }
        if (topicsStarted !== undefined && typeof topicsStarted === 'number') {
          student.topicsStarted = Math.max(student.topicsStarted || 0, topicsStarted);
        }
        if (overallProgress !== undefined && typeof overallProgress === 'number') {
          student.overallProgress = Math.max(student.overallProgress || 0, overallProgress);
        }
        if (progress && typeof progress === 'object') {
          student.progress = { ...(student.progress || {}), ...progress };
        }

        await student.save();
      }
    } else if (studentName && studentName !== 'Guest Learner' && studentName !== 'Student') {
      const student = await Student.findOne({ name: studentName.trim() });
      if (student) {
        if (xp !== undefined && typeof xp === 'number') {
          student.xp = Math.max(student.xp || 0, xp);
        }
        if (topicsCompleted !== undefined && typeof topicsCompleted === 'number') {
          student.topicsCompleted = Math.max(student.topicsCompleted || 0, topicsCompleted);
        }
        await student.save();
      }
    }

    // Re-fetch sorted eligible leaderboard
    const allStudents = await Student.find({}, '-password');
    const eligible = allStudents.filter(
      (s) => (s.xp && s.xp > 0) || (s.topicsCompleted && s.topicsCompleted > 0)
    );
    eligible.sort((a, b) => (b.xp || 0) - (a.xp || 0) || (b.topicsCompleted || 0) - (a.topicsCompleted || 0));

    const leaderboard = eligible.map((s, idx) => ({
      rank: idx + 1,
      id: s._id.toString(),
      name: s.name,
      username: s.regdNo ? s.regdNo.toLowerCase() : s.name.toLowerCase().replace(/\s+/g, '_'),
      regdNo: s.regdNo,
      branch: s.branch,
      avatar: '',
      xp: s.xp || 0,
      streak: 1,
      level: Math.floor((s.xp || 0) / 350) + 1,
      tier: getTier(s.xp || 0),
      countryCode: '🌐',
      solvedCount: s.topicsCompleted || 0,
      topicsCompleted: s.topicsCompleted || 0,
      topicsMastered: s.topicsCompleted || 0,
      topicsStarted: s.topicsStarted || 0,
      overallProgress: s.overallProgress || 0,
      badgeTitle: 'Algo Scholar',
    }));

    return res.json({ leaderboard });
  } catch (error) {
    console.error('Error syncing leaderboard:', error);
    return res.status(500).json({ error: 'Failed to sync leaderboard record.' });
  }
});

module.exports = router;
