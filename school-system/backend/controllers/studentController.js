const User = require('../models/User');
const Student = require('../models/Student');
const { Attendance, Marks } = require('../models/AcademicModels');

// @route GET /api/students
exports.getAllStudents = async (req, res, next) => {
  try {
    const { classId, search, page = 1, limit = 20 } = req.query;
    const query = { isArchived: false };
    if (classId) query.class = classId;

    let students = Student.find(query).populate('user', 'name email phone avatar').populate('class', 'name section');

    if (search) {
      const users = await User.find({ name: { $regex: search, $options: 'i' }, role: 'student' }).select('_id');
      students = Student.find({ ...query, user: { $in: users.map(u => u._id) } })
        .populate('user', 'name email phone avatar').populate('class', 'name section');
    }

    const total = await Student.countDocuments(query);
    const result = await students.skip((page - 1) * limit).limit(parseInt(limit)).sort('-createdAt');

    res.status(200).json({ success: true, total, page: parseInt(page), data: result });
  } catch (err) { next(err); }
};

// @route GET /api/students/:id
exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', '-password')
      .populate('class')
      .populate('bookmarks');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.status(200).json({ success: true, data: student });
  } catch (err) { next(err); }
};

// @route POST /api/students (Admin only)
exports.createStudent = async (req, res, next) => {
  try {
    const { name, email, password, phone, rollNumber, classId, section, dateOfBirth, gender, parentName, parentPhone, forceReuseEmail } = req.body;
    const { Class } = require('../models/AcademicModels');

    // Check for existing user with this email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Case 1: Active user exists (teacher, admin, or active student) — block always
      if (existingUser.isActive) {
        return res.status(400).json({
          success: false,
          code: 'EMAIL_ACTIVE',
          message: 'This email belongs to an active account and cannot be reused.'
        });
      }

      // Case 2: Inactive/deleted user exists — ask admin to confirm reuse unless forceReuseEmail sent
      if (!forceReuseEmail) {
        // Check if there's an archived student record linked
        const prevStudent = await Student.findOne({ user: existingUser._id });
        const prevName = existingUser.name;
        return res.status(409).json({
          success: false,
          code: 'EMAIL_REUSE_CONFIRM',
          message: `This email was previously used by "${prevName}"${prevStudent?.isArchived ? ' (archived/TC issued)' : ' (deleted)'}. Do you want to reuse it for the new student?`,
          previousName: prevName,
          previousArchived: prevStudent?.isArchived || false
        });
      }

      // Admin confirmed reuse — reactivate the user with new details
      existingUser.name     = name;
      existingUser.phone    = phone || existingUser.phone;
      existingUser.isActive = true;
      existingUser.role     = 'student';
      if (password) existingUser.password = password;
      await existingUser.save();

      // Remove old student profile link if it exists (old student was deleted/archived)
      const oldStudentId = existingUser.studentProfile;
      if (oldStudentId) {
        const oldStudent = await Student.findById(oldStudentId);
        if (oldStudent?.class) {
          await Class.findByIdAndUpdate(oldStudent.class, { $pull: { students: oldStudentId } });
        }
        await Student.findByIdAndDelete(oldStudentId);
      }

      // Create new student profile
      const student = await Student.create({
        user: existingUser._id, rollNumber, class: classId, section, dateOfBirth, gender,
        parentName, parentPhone, admissionNumber: rollNumber, academicYear: new Date().getFullYear().toString()
      });

      existingUser.studentProfile = student._id;
      await existingUser.save({ validateBeforeSave: false });

      if (classId) {
        await Class.findByIdAndUpdate(classId, { $addToSet: { students: student._id } });
      }

      const populated = await Student.findById(student._id)
        .populate('user', 'name email phone')
        .populate('class', 'name section');

      return res.status(201).json({ success: true, data: populated, message: `Email reused and new student "${name}" created successfully.` });
    }

    // Normal creation — no email conflict
    const user = await User.create({ name, email, password: password || 'School@123', role: 'student', phone });
    const student = await Student.create({
      user: user._id, rollNumber, class: classId, section, dateOfBirth, gender,
      parentName, parentPhone, admissionNumber: rollNumber, academicYear: new Date().getFullYear().toString()
    });

    user.studentProfile = student._id;
    await user.save({ validateBeforeSave: false });

    if (classId) {
      await Class.findByIdAndUpdate(classId, { $addToSet: { students: student._id } });
    }

    const populated = await Student.findById(student._id)
      .populate('user', 'name email phone')
      .populate('class', 'name section');

    res.status(201).json({ success: true, data: populated, message: 'Student created. Default password: School@123' });
  } catch (err) { next(err); }
};

// @route PUT /api/students/:id
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const { name, phone, rollNumber, classId, section, dateOfBirth, gender, parentName, parentPhone, bloodGroup, address } = req.body;

    if (name || phone) await User.findByIdAndUpdate(student.user, { name, phone });

    const updateData = {};
    if (rollNumber   !== undefined) updateData.rollNumber   = rollNumber;
    if (classId      !== undefined) updateData.class        = classId || null;
    if (section      !== undefined) updateData.section      = section;
    if (dateOfBirth  !== undefined) updateData.dateOfBirth  = dateOfBirth;
    if (gender       !== undefined) updateData.gender       = gender;
    if (parentName   !== undefined) updateData.parentName   = parentName;
    if (parentPhone  !== undefined) updateData.parentPhone  = parentPhone;
    if (bloodGroup   !== undefined) updateData.bloodGroup   = bloodGroup;
    if (address      !== undefined) updateData.address      = address;

    await Student.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    // Sync Class.students: remove from old class, add to new class
    const { Class } = require('../models/AcademicModels');
    const oldClassId = student.class ? String(student.class) : null;
    const newClassId = classId ? String(classId) : null;

    if (oldClassId && oldClassId !== newClassId) {
      await Class.findByIdAndUpdate(oldClassId, { $pull: { students: student._id } });
    }
    if (newClassId && newClassId !== oldClassId) {
      await Class.findByIdAndUpdate(newClassId, { $addToSet: { students: student._id } });
    }

    const updated = await Student.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('class', 'name section');
    res.status(200).json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// @route DELETE /api/students/:id
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Remove from Class.students array
    if (student.class) {
      const { Class } = require('../models/AcademicModels');
      await Class.findByIdAndUpdate(student.class, { $pull: { students: student._id } });
    }

    // Hard-delete the User record so the email is truly freed
    await User.findByIdAndDelete(student.user);
    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Student deleted. Their email can now be reused.' });
  } catch (err) { next(err); }
};

// @route GET /api/students/:id/attendance
exports.getStudentAttendance = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const query = { student: req.params.id };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      query.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query).sort('date');
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    res.status(200).json({ success: true, data: { records, summary: { total, present, absent: total - present, percentage } } });
  } catch (err) { next(err); }
};

// @route GET /api/students/:id/marks
exports.getStudentMarks = async (req, res, next) => {
  try {
    const { Marks } = require('../models/ContentModels');
    const marks = await Marks.find({ student: req.params.id }).populate('subject', 'name code');
    res.status(200).json({ success: true, data: marks });
  } catch (err) { next(err); }
};

// @route POST /api/students/:id/bookmark/:newsId
exports.toggleBookmark = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    const newsId = req.params.newsId;
    const idx = student.bookmarks.indexOf(newsId);
    if (idx > -1) student.bookmarks.splice(idx, 1);
    else student.bookmarks.push(newsId);
    await student.save();

    res.status(200).json({ success: true, bookmarks: student.bookmarks, message: idx > -1 ? 'Bookmark removed.' : 'Bookmarked!' });
  } catch (err) { next(err); }
};
