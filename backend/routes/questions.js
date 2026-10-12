const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Question = require('../models/Question');
const Student = require('../models/Student');

// Helper to extract authenticated caller info from Authorization header or cookie
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

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'algolearn_jwt_secret_2026'
    );
    return decoded;
  } catch (e) {
    return null;
  }
};

// -------------------------------------------------------------
// GET /api/questions - Fetch conversations
// Strict Student Isolation:
// - Students receive ONLY their own conversations (studentId === authenticated student's unique ID)
// - Administrators receive all questions for administrative review & answering
// - Unauthenticated visitors receive []
// -------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const caller = getAuthenticatedCaller(req);

    if (!caller) {
      // Unauthenticated visitors do not receive private student conversations
      return res.json({ questions: [] });
    }

    if (caller.role === 'admin') {
      // Admin dashboard view: return all conversations
      const questions = await Question.find({}).sort({ updatedAt: -1 });
      return res.json({ questions });
    }

    // Authenticated student: Strictly return only questions matching student's unique ID
    const questions = await Question.find({ studentId: caller.id }).sort({ updatedAt: -1 });
    return res.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ error: 'Failed to retrieve questions.' });
  }
});

// -------------------------------------------------------------
// POST /api/questions - Create or append to a question thread
// Uses authenticated student ID as the authoritative owner
// -------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const caller = getAuthenticatedCaller(req);
    if (!caller) {
      return res.status(401).json({ error: 'Please sign in to ask a teacher.' });
    }

    const {
      questionId,
      id,
      teacherId,
      teacherName,
      teacherSubject,
      topicTitle,
      message,
      studentAvatar,
    } = req.body;

    if (!message || !teacherId) {
      return res.status(400).json({ error: 'Missing required question parameters.' });
    }

    // Resolve student's authoritative identity from database / verified token
    let authoritativeStudentId = caller.id;
    let authoritativeStudentName = caller.name || 'Student';

    if (caller.role !== 'admin') {
      const student = await Student.findById(caller.id).select('name');
      if (student) {
        authoritativeStudentId = student._id.toString();
        authoritativeStudentName = student.name;
      }
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const targetQId = questionId || id;

    // If appending to an existing conversation thread:
    if (targetQId) {
      const existing = await Question.findOne({ id: targetQId });
      if (existing) {
        // Enforce ownership: student can ONLY append to their own conversation
        if (caller.role !== 'admin' && existing.studentId !== authoritativeStudentId) {
          return res.status(403).json({
            error: 'Unauthorized: you do not have permission to append to this conversation.',
          });
        }

        const studentMsg = {
          messageId: 'msg-' + Date.now(),
          conversationId: existing.id,
          senderId: authoritativeStudentId,
          senderRole: 'student',
          senderName: authoritativeStudentName,
          message,
          createdAt: timeStr,
        };

        existing.messages.push(studentMsg);
        existing.status = 'Pending';
        existing.updatedAt = 'Today, ' + timeStr;
        await existing.save();

        return res.status(200).json({ question: existing });
      }
    }

    // New conversation creation
    const newQuestionId = 'q-' + Date.now();
    const newQuestion = new Question({
      id: newQuestionId,
      studentId: authoritativeStudentId,
      studentName: authoritativeStudentName,
      studentAvatar: studentAvatar || '',
      teacherId,
      teacherName: teacherName || 'Teacher',
      teacherSubject: teacherSubject || 'DSA Expert',
      topicTitle: topicTitle || 'Data Structures',
      status: 'Pending',
      createdAt: 'Today, ' + timeStr,
      updatedAt: 'Today, ' + timeStr,
      messages: [
        {
          messageId: 'msg-' + Date.now(),
          conversationId: newQuestionId,
          senderId: authoritativeStudentId,
          senderRole: 'student',
          senderName: authoritativeStudentName,
          message,
          createdAt: timeStr,
        },
      ],
    });

    await newQuestion.save();
    return res.status(201).json({ question: newQuestion });
  } catch (error) {
    console.error('Error posting question:', error);
    return res.status(500).json({ error: 'Failed to submit question.' });
  }
});

// -------------------------------------------------------------
// POST /api/questions/:id/reply - Reply to a question thread
// -------------------------------------------------------------
router.post('/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { answer, teacherName, teacherId } = req.body;
    if (!answer) {
      return res.status(400).json({ error: 'Reply message cannot be empty.' });
    }

    const question = await Question.findOne({ id });
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const replyMessage = {
      messageId: 'msg-reply-' + Date.now(),
      conversationId: id,
      senderId: teacherId || question.teacherId,
      senderRole: 'teacher',
      senderName: teacherName || question.teacherName,
      message: answer,
      createdAt: timeStr,
    };

    question.messages.push(replyMessage);
    question.status = 'Answered';
    question.updatedAt = 'Today, ' + timeStr;
    await question.save();

    return res.json({ question });
  } catch (error) {
    console.error('Error replying to question:', error);
    return res.status(500).json({ error: 'Failed to submit reply.' });
  }
});

// -------------------------------------------------------------
// DELETE /api/questions/:id - Delete a question thread
// Ownership verification: Caller must own the conversation or be admin
// -------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const caller = getAuthenticatedCaller(req);
    const { id } = req.params;

    const question = await Question.findOne({ id });
    if (!question) {
      return res.json({ success: true, message: 'Conversation already deleted.' });
    }

    if (!caller) {
      return res.status(401).json({ error: 'Authentication required to delete conversation.' });
    }

    const isOwner = caller.role === 'admin' || question.studentId === caller.id;
    if (!isOwner) {
      return res.status(403).json({
        error: 'Unauthorized: you can only clear your own conversations.',
      });
    }

    await Question.deleteOne({ id });
    return res.json({ success: true, message: 'Conversation cleared successfully.' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ error: 'Failed to delete conversation.' });
  }
});

module.exports = router;
