const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');

// Helper to extract caller info
const getAuthenticatedCaller = (req) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.algolearn_session) {
      token = req.cookies.algolearn_session;
    }
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET || 'algolearn_jwt_secret_2026');
  } catch (e) {
    return null;
  }
};

// Middleware: Teachers and students must NOT perform admin operations
const enforceAdminRole = (req, res, next) => {
  const caller = getAuthenticatedCaller(req);
  if (caller && caller.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
  }
  next();
};

// -------------------------------------------------------------
// GET /api/teachers - List all active teachers
// -------------------------------------------------------------
router.get('/', async (_req, res) => {
  try {
    const teachers = await Teacher.find({}).sort({ createdAt: -1 });
    return res.json({ teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return res.status(500).json({ error: 'Failed to retrieve teachers.' });
  }
});

// -------------------------------------------------------------
// POST /api/teachers - Create a new teacher profile
// Generates or validates unique Teacher ID. Prevents duplicates.
// -------------------------------------------------------------
router.post('/', enforceAdminRole, async (req, res) => {
  try {
    const { name, teacherId, id, email, subject, description, avatarUrl, avatarInitials, avatarGradient } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Teacher name is required.' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required.' });
    }

    // Determine or generate unique Teacher ID
    let finalTeacherId = (teacherId || id || '').trim().toUpperCase();
    if (!finalTeacherId) {
      finalTeacherId = 'TEA-' + Math.floor(1000 + Math.random() * 9000);
    }

    // Prevent duplicate Teacher IDs
    const existing = await Teacher.findOne({
      $or: [{ id: finalTeacherId }, { teacherId: finalTeacherId }],
    });
    if (existing) {
      return res.status(400).json({
        error: `Teacher ID "${finalTeacherId}" already exists. Please provide a unique Teacher ID.`,
      });
    }

    const initials =
      avatarInitials ||
      name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const newTeacher = new Teacher({
      id: finalTeacherId,
      teacherId: finalTeacherId,
      name: name.trim(),
      email: email?.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@algolearn.edu`,
      subject: subject.trim(),
      description: description?.trim() || '',
      avatarInitials: initials,
      avatarGradient: avatarGradient || 'from-blue-600 via-indigo-600 to-violet-600',
      avatarUrl: avatarUrl?.trim() || '',
      createdAt: 'Just now',
    });

    await newTeacher.save();
    return res.status(201).json({ teacher: newTeacher });
  } catch (error) {
    console.error('Error creating teacher:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Teacher ID already exists. Please choose a different ID.' });
    }
    return res.status(500).json({ error: 'Failed to create teacher profile.' });
  }
});

// -------------------------------------------------------------
// PUT /api/teachers/:id - Update an existing teacher
// -------------------------------------------------------------
router.put('/:id', enforceAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const query = [{ id }, { teacherId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id });
    }
    const updated = await Teacher.findOneAndUpdate(
      { $or: query },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }
    return res.json({ teacher: updated });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return res.status(500).json({ error: 'Failed to update teacher profile.' });
  }
});

// -------------------------------------------------------------
// DELETE /api/teachers/:id - Delete a teacher profile
// -------------------------------------------------------------
router.delete('/:id', enforceAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const query = [{ id }, { teacherId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id });
    }
    const deleted = await Teacher.findOneAndDelete({ $or: query });
    if (!deleted) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }
    return res.json({ success: true, message: 'Teacher removed successfully.' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return res.status(500).json({ error: 'Failed to delete teacher profile.' });
  }
});

module.exports = router;
