const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    regdNo: {
      type: String,
      required: [true, 'Registration Number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[A-Z0-9]{10}$/.test(v);
        },
        message: 'Registration Number must be exactly 10 characters and contain only uppercase letters and digits.',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    xp: {
      type: Number,
      default: 0,
    },
    topicsStarted: {
      type: Number,
      default: 0,
    },
    topicsCompleted: {
      type: Number,
      default: 0,
    },
    overallProgress: {
      type: Number,
      default: 0,
    },
    progress: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    activeSessionId: {
      type: String,
      default: null,
    },
    sessionLastActive: {
      type: Date,
      default: null,
    },
    sessionDevice: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// High-Performance Indexes for 500+ Students Scalability
StudentSchema.index({ xp: -1, topicsCompleted: -1, createdAt: 1, regdNo: 1 });
StudentSchema.index({ activeSessionId: 1 });
StudentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Student', StudentSchema);
