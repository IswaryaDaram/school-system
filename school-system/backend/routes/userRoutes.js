const express = require('express');
const r = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
r.use(protect);
r.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch(e) { next(e); }
});
r.put('/:id/toggle-status', authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.` });
  } catch(e) { next(e); }
});
module.exports = r;
