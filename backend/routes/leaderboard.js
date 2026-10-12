const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

/**
 * Helper to compute division tier from XP
 */
const getTier = (xp = 0) => {
  if (xp >= 800) return 'Diamond';
  if (xp >= 400) return 'Platinum';
  return 'Gold';
};

/**
 * Helper to sum points across all topics in student progress
 */
const sumTopicPoints = (progressMap) => {
  if (!progressMap || typeof progressMap !== 'object') return 0;
  let sum = 0;
  for (const [key, val] of Object.entries(progressMap)) {
    if (typeof val === 'number') {
      sum += Math.max(0, Math.round(val));
    } else if (val && typeof val.points === 'number') {
      sum += Math.max(0, Math.round(val.points));
    } else if (val && typeof val.score === 'number') {
      sum += Math.max(0, Math.round(val.score));
    }
  }
  return sum;
};

/**
 * Deterministic sort comparator for students:
 * 1. XP descending
 * 2. topicsCompleted descending
 * 3. createdAt ascending (earlier account first)
 * 4. regdNo ascending
 */
const compareStudents = (a, b) => {
  const xpDiff = (b.xp || 0) - (a.xp || 0);
  if (xpDiff !== 0) return xpDiff;

  const compDiff = (b.topicsCompleted || 0) - (a.topicsCompleted || 0);
  if (compDiff !== 0) return compDiff;

  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  if (dateA !== dateB) return dateA - dateB;

  return (a.regdNo || '').localeCompare(b.regdNo || '');
};

/**
 * Format student into public leaderboard entry (passwords and secrets omitted)
 */
const formatLeaderboardEntry = (s, idx) => ({
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
  topicsStarted: s.topicsStarted || (s.xp > 0 ? 1 : 0),
  overallProgress: s.overallProgress || 0,
  badgeTitle: 'Algo Scholar',
  createdAt: s.createdAt,
});

/**
 * GET /api/leaderboard
 * Returns real eligible student rankings aggregated from MongoDB.
 * Every registered student appears on the leaderboard, starting at 0 XP if no points earned yet.
 * Returns empty array [] if no students registered yet.
 */
router.get('/', async (_req, res) => {
  try {
    const students = await Student.find({})
      .select('name regdNo branch xp topicsCompleted topicsStarted overallProgress createdAt')
      .sort({ xp: -1, topicsCompleted: -1, createdAt: 1, regdNo: 1 })
      .lean();

    students.sort(compareStudents);

    const leaderboard = students.map((s, idx) => formatLeaderboardEntry(s, idx));

    return res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Failed to retrieve leaderboard records.' });
  }
});

/**
 * POST /api/leaderboard/sync
 * Syncs real student score updates directly to MongoDB.
 * Leaderboard XP = sum of points across all topics.
 */
router.post('/sync', async (req, res) => {
  try {
    const { regdNo, studentName, xp, topicsCompleted, topicsStarted, overallProgress, progress } = req.body;

    if (regdNo) {
      const cleanRegdNo = regdNo.trim().toUpperCase();
      const student = await Student.findOne({ regdNo: cleanRegdNo });

      if (student) {
        if (progress && typeof progress === 'object') {
          student.progress = { ...(student.progress || {}), ...progress };
        }

        const calculatedSum = sumTopicPoints(student.progress);
        if (xp !== undefined && typeof xp === 'number') {
          student.xp = Math.max(xp, calculatedSum);
        } else if (calculatedSum > 0) {
          student.xp = calculatedSum;
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

    // Re-fetch sorted leaderboard including ALL students (even 0 XP)
    const allStudents = await Student.find({}, '-password');
    allStudents.sort(compareStudents);

    const leaderboard = allStudents.map((s, idx) => formatLeaderboardEntry(s, idx));

    return res.json({ leaderboard });
  } catch (error) {
    console.error('Error syncing leaderboard:', error);
    return res.status(500).json({ error: 'Failed to sync leaderboard record.' });
  }
});

module.exports = router;
