const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  filePath: { type: String, required: true },
  fileName: String,
  fileSize: Number,
  fileType: String,
  downloadCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
