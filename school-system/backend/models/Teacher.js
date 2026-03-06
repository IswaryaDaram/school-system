const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: String, required: true, unique: true },
  qualification: String,
  specialization: String,
  experience: Number, // years
  joiningDate: { type: Date, default: Date.now },
  assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  isClassTeacher: { type: Boolean, default: false },
  classTeacherOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
