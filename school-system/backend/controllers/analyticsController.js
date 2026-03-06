const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { Attendance, Assignment } = require('../models/AcademicModels');
const { Announcement, DocumentRequest } = require('../models/ContentModels');

// @route GET /api/analytics/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [totalStudents, totalTeachers, totalTeacherUsers, pendingDocs, urgentAnnouncements] = await Promise.all([
      Student.countDocuments({ isArchived: false }),
      Teacher.countDocuments(),
      User.countDocuments({ role: 'teacher', isActive: true }),
      DocumentRequest.countDocuments({ status: 'pending' }),
      Announcement.countDocuments({ isUrgent: true, isActive: true })
    ]);

    // Attendance for this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [presentCount, totalAttendance] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: monthStart }, status: 'present' }),
      Attendance.countDocuments({ date: { $gte: monthStart } })
    ]);
    const attendancePercentage = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : 0;

    // Recent activities (last 10 announcements)
    const recentActivities = await Announcement.find().sort('-createdAt').limit(10)
      .populate('author', 'name role');

    // Monthly attendance trend (last 6 months)
    const attendanceTrend = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const present = await Attendance.countDocuments({ date: { $gte: start, $lte: end }, status: 'present' });
      const total = await Attendance.countDocuments({ date: { $gte: start, $lte: end } });
      attendanceTrend.push({
        month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
        percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0
      });
    }

    res.status(200).json({
      success: true,
      data: {
        stats: { totalStudents, totalTeachers, attendancePercentage, pendingDocs, urgentAnnouncements },
        attendanceTrend,
        recentActivities
      }
    });
  } catch (err) { next(err); }
};

// @route GET /api/analytics/attendance-report
exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { classId, month, year } = req.query;
    const start = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);

    const query = { date: { $gte: start, $lte: end } };
    if (classId) query.class = classId;

    const attendance = await Attendance.find(query)
      .populate('student', 'rollNumber')
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } });

    res.status(200).json({ success: true, data: attendance });
  } catch (err) { next(err); }
};
