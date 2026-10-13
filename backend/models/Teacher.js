const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    teacherId: { type: String, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    subject: { type: String, required: true, trim: true },
    avatarInitials: { type: String, default: '' },
    avatarGradient: { type: String, default: 'from-blue-600 via-indigo-600 to-violet-600' },
    avatarUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    createdAt: { type: String, default: 'Just now' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', teacherSchema);
