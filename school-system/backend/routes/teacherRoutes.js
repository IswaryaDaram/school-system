const express  = require('express');
const r        = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Teacher  = require('../models/Teacher');
const { Class } = require('../models/AcademicModels');

r.use(protect);

// GET all teachers (admin only)
r.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', 'name email phone isActive')
      .populate('subjects', 'name code')
      .populate('assignedClasses', 'name section');
    res.json({ success: true, data: teachers });
  } catch(e) { next(e); }
});

// GET single teacher
r.get('/:id', async (req, res, next) => {
  try {
    const t = await Teacher.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('subjects', 'name code')
      .populate('assignedClasses', 'name section');
    if (!t) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, data: t });
  } catch(e) { next(e); }
});

// PUT /teachers/:id — update teacher profile (admin: can set assignedClasses, subjects, etc.)
r.put('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { assignedClasses, subjects, qualification, specialization, experience, isClassTeacher, classTeacherOf } = req.body;

    const update = {};
    if (assignedClasses  !== undefined) update.assignedClasses  = assignedClasses;
    if (subjects         !== undefined) update.subjects         = subjects;
    if (qualification    !== undefined) update.qualification    = qualification;
    if (specialization   !== undefined) update.specialization   = specialization;
    if (experience       !== undefined) update.experience       = experience;
    if (isClassTeacher   !== undefined) update.isClassTeacher   = isClassTeacher;
    if (classTeacherOf   !== undefined) update.classTeacherOf   = classTeacherOf || null;

    const teacher = await Teacher.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name email phone isActive')
      .populate('subjects', 'name code')
      .populate('assignedClasses', 'name section');

    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    // If classTeacherOf changed, also update Class.classTeacher
    if (classTeacherOf !== undefined) {
      // Remove this teacher as classTeacher from old class
      await Class.updateMany({ classTeacher: teacher._id }, { $unset: { classTeacher: 1 } });
      // Set on new class
      if (classTeacherOf) {
        await Class.findByIdAndUpdate(classTeacherOf, { classTeacher: teacher._id });
      }
    }

    // Keep Class.classTeacher in sync with assignedClasses if teacher is classTeacher
    if (assignedClasses !== undefined && isClassTeacher && classTeacherOf) {
      await Class.findByIdAndUpdate(classTeacherOf, { classTeacher: teacher._id });
    }

    res.json({ success: true, data: teacher });
  } catch(e) { next(e); }
});

module.exports = r;
