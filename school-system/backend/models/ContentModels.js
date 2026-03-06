const mongoose = require('mongoose');

// ─── Marks ────────────────────────────────────────────────────────────────────
const marksSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  examType: { type: String, enum: ['unit1', 'unit2', 'midterm', 'final', 'assignment', 'practical'], required: true },
  marksObtained: { type: Number, required: true, min: 0 },
  maxMarks: { type: Number, required: true },
  academicYear: String,
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  remarks: String
}, { timestamps: true });

marksSchema.virtual('percentage').get(function() {
  return ((this.marksObtained / this.maxMarks) * 100).toFixed(2);
});

marksSchema.virtual('grade').get(function() {
  const pct = (this.marksObtained / this.maxMarks) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 35) return 'D';
  return 'F';
});

marksSchema.set('toJSON', { virtuals: true });

// ─── Announcement ─────────────────────────────────────────────────────────────
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetRoles: [{ type: String, enum: ['admin', 'teacher', 'student', 'all'] }],
  targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  isUrgent: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  expiresAt: Date,
  attachments: [String]
}, { timestamps: true });

// ─── News ─────────────────────────────────────────────────────────────────────
const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: String,
  category: { type: String, enum: ['national', 'international', 'education', 'science_technology', 'sports', 'local'], required: true },
  source: String,
  sourceUrl: String,
  imageUrl: String,
  isTopNews: { type: Boolean, default: false },
  isManual: { type: Boolean, default: true }, // admin posted vs API
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  externalId: { type: String, unique: true, sparse: true } // for dedup from news API
}, { timestamps: true });

newsSchema.index({ title: 'text', content: 'text', summary: 'text' });

// ─── DocumentRequest ──────────────────────────────────────────────────────────
const documentRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  type: { type: String, enum: ['bonafide', 'tc'], required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  uploadedDocuments: [String],
  generatedCertificate: String, // path to generated PDF
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  adminRemarks: String,
  requestNumber: { type: String, unique: true }
}, { timestamps: true });

// Auto-generate request number
documentRequestSchema.pre('save', async function(next) {
  if (!this.requestNumber) {
    const count = await mongoose.model('DocumentRequest').countDocuments();
    this.requestNumber = `REQ${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = {
  Marks: mongoose.model('Marks', marksSchema),
  Announcement: mongoose.model('Announcement', announcementSchema),
  News: mongoose.model('News', newsSchema),
  DocumentRequest: mongoose.model('DocumentRequest', documentRequestSchema)
};
