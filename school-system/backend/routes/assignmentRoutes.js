const express  = require('express');
const r        = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createAssignment, getAssignments } = require('../controllers/academicController');
const { Assignment } = require('../models/AcademicModels');
const { uploadAssignment, handleUploadError } = require('../middleware/upload');

r.use(protect);
r.get('/',    getAssignments);
r.post('/',   authorize('teacher', 'admin'), uploadAssignment, handleUploadError, createAssignment);
r.delete('/:id', authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Assignment deleted.' });
  } catch (e) { next(e); }
});
module.exports = r;

// GET submissions for a specific assignment (teacher/admin)
r.get('/:id/submissions', authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const { Submission } = require('../models/AcademicModels');
    const subs = await Submission.find({ assignment: req.params.id })
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .sort('-submittedAt');
    res.json({ success: true, data: subs });
  } catch (e) { next(e); }
});
