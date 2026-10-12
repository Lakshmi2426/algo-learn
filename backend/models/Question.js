const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: { type: String, required: true },
  conversationId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ['student', 'teacher'], required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: String, required: true },
});

const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    studentAvatar: { type: String, default: '' },
    teacherId: { type: String, required: true },
    teacherName: { type: String, required: true },
    teacherSubject: { type: String, required: true },
    topicId: { type: String, default: '' },
    topicTitle: { type: String, default: 'Data Structures' },
    status: { type: String, enum: ['Pending', 'Answered'], default: 'Pending' },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
