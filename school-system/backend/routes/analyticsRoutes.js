const express = require('express');
const r = express.Router();
const { getDashboard, getAttendanceReport } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');
r.use(protect);
r.get('/dashboard', authorize('admin'), getDashboard);
r.get('/attendance', authorize('admin', 'teacher'), getAttendanceReport);
module.exports = r;
