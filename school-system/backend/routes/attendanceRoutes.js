const express = require('express');
const r = express.Router();
const { markAttendance, getClassAttendance, getAttendanceSummary } = require('../controllers/academicController');
const { protect, authorize } = require('../middleware/auth');
r.use(protect);
r.post('/mark', authorize('teacher', 'admin'), markAttendance);
r.get('/class', getClassAttendance);
r.get('/summary', async (req, res, next) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const Attendance = require('../models/AcademicModels').Attendance;
    const { Class } = require('../models/AcademicModels');
    const cls = await Class.findById(classId).populate({ path: 'students', populate: { path: 'user', select: 'name' } });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate)   dateFilter.$lte = new Date(endDate);
    const summary = await Promise.all((cls.students || []).map(async (s) => {
      const records = await Attendance.find({ student: s._id, ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}) });
      const total   = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const absent  = records.filter(r => r.status === 'absent').length;
      const late    = records.filter(r => r.status === 'late').length;
      return { student: s, total, present, absent, late, percentage: total > 0 ? ((present / total) * 100).toFixed(1) : '0' };
    }));
    res.json({ success: true, data: summary });
  } catch (e) { next(e); }
});
r.get('/summary', authorize('teacher', 'admin'), getAttendanceSummary);
module.exports = r;
