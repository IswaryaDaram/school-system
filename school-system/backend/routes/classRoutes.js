const express  = require('express');
const r        = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Class } = require('../models/AcademicModels');
const Teacher   = require('../models/Teacher');

r.use(protect);

// GET /classes
// Admin → all classes
// Teacher → their assigned classes (or all as fallback if none assigned)
r.get('/', async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });

      if (teacher) {
        // Collect assigned class IDs
        let assignedIds = (teacher.assignedClasses || []).map(id => String(id));

        // Also include classes where this teacher is set as classTeacher
        const byRole = await Class.find({ classTeacher: teacher._id }).select('_id');
        byRole.forEach(c => {
          const s = String(c._id);
          if (!assignedIds.includes(s)) assignedIds.push(s);
        });

        // If specific classes found, filter; else return all (new teacher fallback)
        if (assignedIds.length > 0) {
          query = { _id: { $in: assignedIds } };
        }
      }
      // teacher profile not found → query = {} → return all
    }

    const classes = await Class.find(query)
      .populate({ path: 'classTeacher', populate: { path: 'user', select: 'name email' } })
      .populate({ path: 'students',     populate: { path: 'user', select: 'name email' } })
      .populate('subjects', 'name code')
      .sort('name');

    res.json({ success: true, data: classes });
  } catch (e) { next(e); }
});

r.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const c = await Class.create(req.body);
    const populated = await Class.findById(c._id)
      .populate({ path: 'students', populate: { path: 'user', select: 'name email' } })
      .populate('subjects', 'name code')
      .populate({ path: 'classTeacher', populate: { path: 'user', select: 'name email' } });
    res.status(201).json({ success: true, data: populated });
  } catch (e) { next(e); }
});

r.put('/:id', authorize('admin'), async (req, res, next) => {
  try {
    // If classTeacher is being changed, sync Teacher.assignedClasses
    if (req.body.classTeacher !== undefined) {
      const existing = await Class.findById(req.params.id).select('classTeacher');
      const oldTeacherId = existing?.classTeacher ? String(existing.classTeacher) : null;
      const newTeacherId = req.body.classTeacher ? String(req.body.classTeacher) : null;

      if (oldTeacherId && oldTeacherId !== newTeacherId) {
        // Remove this class from old teacher's assignedClasses
        await Teacher.findByIdAndUpdate(oldTeacherId, { $pull: { assignedClasses: req.params.id }, classTeacherOf: null, isClassTeacher: false });
      }
      if (newTeacherId && newTeacherId !== oldTeacherId) {
        // Add this class to new teacher's assignedClasses
        await Teacher.findByIdAndUpdate(newTeacherId, {
          $addToSet: { assignedClasses: req.params.id },
          classTeacherOf: req.params.id,
          isClassTeacher: true
        });
      }
    }

    const c = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate({ path: 'students', populate: { path: 'user', select: 'name email' } })
      .populate({ path: 'classTeacher', populate: { path: 'user', select: 'name email' } })
      .populate('subjects', 'name code');
    res.json({ success: true, data: c });
  } catch (e) { next(e); }
});

module.exports = r;

// POST /classes/sync — repair Class.students from Student.class field (one-time fix for existing data)
r.post('/sync', authorize('admin'), async (req, res, next) => {
  try {
    const Student = require('../models/Student');

    // Clear all students arrays first
    await Class.updateMany({}, { $set: { students: [] } });

    // Re-populate from Student records
    const allStudents = await Student.find({ isArchived: false, class: { $exists: true, $ne: null } });
    let synced = 0;
    for (const s of allStudents) {
      await Class.findByIdAndUpdate(s.class, { $addToSet: { students: s._id } });
      synced++;
    }

    res.json({ success: true, message: `Synced ${synced} students into their classes.` });
  } catch (e) { next(e); }
});
