const mongoose = require('mongoose');

// ─── Subject ──────────────────────────────────────────────────────────────────
const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  description: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  maxMarks: { type: Number, default: 100 },
  passingMarks: { type: Number, default: 35 }
}, { timestamps: true });

// ─── Class ────────────────────────────────────────────────────────────────────
const classSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Class 10"
  section: { type: String, default: 'A' },
  academicYear: String,
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  room: String
}, { timestamps: true });

// ─── Attendance ───────────────────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: String
}, { timestamps: true });

attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// ─── Assignment ───────────────────────────────────────────────────────────────
const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  deadline: { type: Date, required: true },
  maxMarks: { type: Number, default: 10 },
  attachments: [String], // file paths
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ─── Submission ───────────────────────────────────────────────────────────────
const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  files: [String],
  remarks: String,
  submittedAt: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
  marksObtained: Number,
  feedback: String,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' }
}, { timestamps: true });

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = {
  Subject: mongoose.model('Subject', subjectSchema),
  Class: mongoose.model('Class', classSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Assignment: mongoose.model('Assignment', assignmentSchema),
  Submission: mongoose.model('Submission', submissionSchema)
};
