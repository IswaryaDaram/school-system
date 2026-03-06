const express  = require('express');
const r        = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Subject } = require('../models/AcademicModels');
const Teacher   = require('../models/Teacher');

r.use(protect);

// GET /subjects?classId=xxx  — filtered by class if provided
// If teacher: only their assigned subjects
r.get('/', async (req, res, next) => {
  try {
    const { classId } = req.query;
    let query = {};

    if (classId) query.class = classId;

    // If teacher, filter to only their assigned subjects
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher?.subjects?.length > 0) {
        query._id = { $in: teacher.subjects };
      }
    }

    const subjects = await Subject.find(query)
      .populate({ path: 'teacher', populate: { path: 'user', select: 'name' } })
      .populate('class', 'name section')
      .sort('name');
    res.json({ success: true, data: subjects });
  } catch (e) { next(e); }
});

r.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const s = await Subject.create(req.body);
    res.status(201).json({ success: true, data: s });
  } catch (e) { next(e); }
});

r.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Subject deleted.' });
  } catch (e) { next(e); }
});

module.exports = r;
