const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollNumber: { type: String, required: true, unique: true },
  admissionNumber: { type: String, unique: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  section: { type: String, default: 'A' },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  parentName: String,
  parentPhone: String,
  parentEmail: String,
  admissionDate: { type: Date, default: Date.now },
  academicYear: String,
  isArchived: { type: Boolean, default: false }, // TC approved
  archivedAt: Date,
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'News' }]
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
