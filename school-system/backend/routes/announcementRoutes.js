const express = require('express');
const r = express.Router();
const { createAnnouncement, getAnnouncements } = require('../controllers/academicController');
const { protect, authorize } = require('../middleware/auth');
const { Announcement } = require('../models/ContentModels');
r.use(protect);
r.post('/', authorize('admin', 'teacher'), createAnnouncement);
r.get('/', getAnnouncements);
r.put('/:id', authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const a = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: a });
  } catch(e) { next(e); }
});
r.delete('/:id', authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Announcement removed.' });
  } catch(e) { next(e); }
});
module.exports = r;
