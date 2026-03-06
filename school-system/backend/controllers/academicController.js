const { Attendance, Assignment, Submission } = require('../models/AcademicModels');
const { Marks, News, DocumentRequest, Announcement } = require('../models/ContentModels');
const StudyMaterial = require('../models/StudyMaterial');
const Student = require('../models/Student');

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════════

exports.markAttendance = async (req, res, next) => {
  try {
    const { classId, date, records } = req.body;
    const bulkOps = records.map(r => ({
      updateOne: {
        filter: { student: r.studentId, date: new Date(date) },
        update: { $set: { student: r.studentId, class: classId, date: new Date(date), status: r.status, remarks: r.remarks || '', markedBy: req.user._id } },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(bulkOps);
    res.status(200).json({ success: true, message: 'Attendance marked successfully.' });
  } catch (err) { next(err); }
};

exports.getClassAttendance = async (req, res, next) => {
  try {
    const { classId, date } = req.query;
    const query = { class: classId };
    if (date) query.date = new Date(date);
    const records = await Attendance.find(query)
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } });
    res.status(200).json({ success: true, data: records });
  } catch (err) { next(err); }
};

exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const query = { class: classId };
    if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    const records = await Attendance.find(query)
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
      .sort('date');
    const summary = {};
    records.forEach(r => {
      const sid = r.student?._id?.toString();
      if (!sid) return;
      if (!summary[sid]) summary[sid] = { student: r.student, total: 0, present: 0, absent: 0, late: 0 };
      summary[sid].total++;
      if (r.status === 'present') summary[sid].present++;
      else if (r.status === 'absent') summary[sid].absent++;
      else if (r.status === 'late') summary[sid].late++;
    });
    const result = Object.values(summary).map(s => ({
      ...s, percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : '0.0'
    }));
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MARKS
// ═══════════════════════════════════════════════════════════════════════════════

exports.addMarks = async (req, res, next) => {
  try {
    const { studentId, subjectId, examType, marksObtained, maxMarks, academicYear, remarks } = req.body;
    const marks = await Marks.findOneAndUpdate(
      { student: studentId, subject: subjectId, examType },
      { marksObtained, maxMarks, academicYear, remarks, enteredBy: req.user.teacherProfile },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: marks });
  } catch (err) { next(err); }
};

exports.getClassMarks = async (req, res, next) => {
  try {
    const { classId, subjectId, examType } = req.query;
    const query = {};

    // If subjectId given, filter by subject
    if (subjectId) query.subject = subjectId;
    // If examType given, filter by examType
    if (examType) query.examType = examType;

    // If classId given, restrict marks to only students in that class
    if (classId) {
      const { Class } = require('../models/AcademicModels');
      const cls = await Class.findById(classId).select('students');
      if (cls && cls.students?.length) {
        query.student = { $in: cls.students };
      }
    }

    const marks = await Marks.find(query)
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
      .populate('subject', 'name code')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: marks });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════════════════

exports.createAssignment = async (req, res, next) => {
  try {
    const { title, description, subjectId, classId, deadline, maxMarks } = req.body;
    const attachments = req.files ? req.files.map(f => f.path) : [];
    const assignment = await Assignment.create({
      title, description, subject: subjectId, class: classId,
      teacher: req.user.teacherProfile, deadline: new Date(deadline), maxMarks, attachments
    });
    res.status(201).json({ success: true, data: assignment });
  } catch (err) { next(err); }
};

exports.getAssignments = async (req, res, next) => {
  try {
    const { classId, subjectId } = req.query;
    const query = {};
    if (classId) query.class = classId;
    if (subjectId) query.subject = subjectId;
    const assignments = await Assignment.find(query)
      .populate('subject', 'name').populate('class', 'name section').sort('-createdAt');
    res.status(200).json({ success: true, data: assignments });
  } catch (err) { next(err); }
};

exports.submitAssignment = async (req, res, next) => {
  try {
    const { assignmentId, remarks } = req.body;
    const student = await Student.findOne({ user: req.user._id });
    const assignment = await Assignment.findById(assignmentId);
    const isLate = new Date() > new Date(assignment.deadline);
    const files = req.files ? req.files.map(f => f.path) : [];
    const submission = await Submission.findOneAndUpdate(
      { assignment: assignmentId, student: student._id },
      { files, remarks, submittedAt: new Date(), isLate, status: 'submitted' },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, data: submission, message: isLate ? 'Submitted (Late)' : 'Submitted!' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// STUDY MATERIALS
// ═══════════════════════════════════════════════════════════════════════════════

exports.uploadMaterial = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const { title, description, subjectId, classId } = req.body;
    const material = await StudyMaterial.create({
      title, description, subject: subjectId, class: classId,
      uploadedBy: req.user.teacherProfile,
      filePath: req.file.path, fileName: req.file.originalname,
      fileSize: req.file.size, fileType: req.file.mimetype
    });
    res.status(201).json({ success: true, data: material });
  } catch (err) { next(err); }
};

exports.getMaterials = async (req, res, next) => {
  try {
    const { classId, subjectId } = req.query;
    const query = { isActive: true };
    if (classId) query.class = classId;
    if (subjectId) query.subject = subjectId;
    const materials = await StudyMaterial.find(query)
      .populate('subject', 'name').populate('class', 'name section').sort('-createdAt');
    res.status(200).json({ success: true, data: materials });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// NEWS
// ═══════════════════════════════════════════════════════════════════════════════

exports.createNews = async (req, res, next) => {
  try {
    const { title, content, summary, category, source, sourceUrl, imageUrl, isTopNews } = req.body;
    const existing = await News.findOne({ title: { $regex: `^${title.trim()}$`, $options: 'i' } });
    if (existing) return res.status(400).json({ success: false, message: 'Duplicate news entry with same title.' });
    const news = await News.create({
      title: title.trim(), content, summary, category,
      source, sourceUrl, imageUrl, isTopNews: isTopNews || false,
      postedBy: req.user._id, isManual: true
    });
    const populated = await News.findById(news._id).populate('postedBy', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

exports.updateNews = async (req, res, next) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('postedBy', 'name');
    if (!news) return res.status(404).json({ success: false, message: 'News not found.' });
    res.status(200).json({ success: true, data: news });
  } catch (err) { next(err); }
};

exports.deleteNews = async (req, res, next) => {
  try {
    await News.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'News removed.' });
  } catch (err) { next(err); }
};

exports.getNews = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 10, topOnly } = req.query;
    const query = { isActive: true };
    if (category && category !== 'all') query.category = category;
    if (topOnly === 'true') query.isTopNews = true;
    if (search) query.$text = { $search: search };
    const total = await News.countDocuments(query);
    const news = await News.find(query)
      .populate('postedBy', 'name')
      .sort('-publishedAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.status(200).json({ success: true, total, data: news });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, targetRoles, targetClasses, isUrgent, expiresAt } = req.body;
    const announcement = await Announcement.create({
      title, content, author: req.user._id,
      targetRoles: targetRoles || ['all'], targetClasses, isUrgent, expiresAt
    });
    const populated = await Announcement.findById(announcement._id).populate('author', 'name role');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

exports.updateAnnouncement = async (req, res, next) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('author', 'name role');
    if (!ann) return res.status(404).json({ success: false, message: 'Announcement not found.' });
    res.status(200).json({ success: true, data: ann });
  } catch (err) { next(err); }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Announcement removed.' });
  } catch (err) { next(err); }
};

exports.getAnnouncements = async (req, res, next) => {
  try {
    const query = { isActive: true };
    if (req.user.role !== 'admin') {
      query.$or = [{ targetRoles: 'all' }, { targetRoles: req.user.role }];
    }
    const announcements = await Announcement.find(query)
      .populate('author', 'name role').sort('-createdAt');
    res.status(200).json({ success: true, data: announcements });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT REQUESTS
// ═══════════════════════════════════════════════════════════════════════════════

exports.createDocumentRequest = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const { type, reason } = req.body;
    const uploadedDocuments = req.files ? req.files.map(f => f.path) : [];
    const request = await DocumentRequest.create({ student: student._id, type, reason, uploadedDocuments });
    res.status(201).json({ success: true, data: request, message: 'Request submitted successfully.' });
  } catch (err) { next(err); }
};

exports.getDocumentRequests = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const query = {};
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student) return res.status(200).json({ success: true, data: [] });
      query.student = student._id;
    }
    if (status) query.status = status;
    if (type) query.type = type;
    const requests = await DocumentRequest.find(query)
      .populate({ path: 'student', populate: [{ path: 'user', select: 'name email' }, { path: 'class', select: 'name section' }] })
      .populate('reviewedBy', 'name')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: requests });
  } catch (err) { next(err); }
};

exports.updateDocumentRequest = async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body;
    const request = await DocumentRequest.findById(req.params.id)
      .populate({ path: 'student', populate: [{ path: 'user' }, { path: 'class', select: 'name' }] });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    request.status = status;
    request.adminRemarks = adminRemarks;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    if (status === 'approved') {
      try {
        const { generateBonafideCertificate, generateTCCertificate } = require('../utils/pdfGenerator');
        const gen = request.type === 'bonafide' ? generateBonafideCertificate : generateTCCertificate;
        const { fileName } = await gen(request.student, request);
        request.generatedCertificate = `uploads/documents/${fileName}`;
      } catch (pdfErr) {
        console.error('PDF generation error:', pdfErr.message);
      }
      if (request.type === 'tc') {
        await Student.findByIdAndUpdate(request.student._id, { isArchived: true, archivedAt: new Date() });
      }
    }

    await request.save();
    const updated = await DocumentRequest.findById(request._id)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('reviewedBy', 'name');
    res.status(200).json({ success: true, data: updated, message: `Request ${status}.` });
  } catch (err) { next(err); }
};
