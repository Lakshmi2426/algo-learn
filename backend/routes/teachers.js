const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');

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
// -------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, description, avatarUrl, avatarInitials, avatarGradient } = req.body;
    if (!name || !subject) {
      return res.status(400).json({ error: 'Teacher name and subject are required.' });
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
      id: req.body.id || 'teacher-' + Date.now(),
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
    return res.status(500).json({ error: 'Failed to create teacher profile.' });
  }
});

// -------------------------------------------------------------
// PUT /api/teachers/:id - Update an existing teacher
// -------------------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Teacher.findOneAndUpdate(
      { id },
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
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Teacher.findOneAndDelete({ id });
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
