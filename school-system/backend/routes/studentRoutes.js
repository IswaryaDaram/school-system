// studentRoutes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
r.use(protect);
r.get('/', authorize('admin', 'teacher'), c.getAllStudents);
r.post('/', authorize('admin'), c.createStudent);
r.get('/:id', c.getStudent);
r.put('/:id', authorize('admin'), c.updateStudent);
r.delete('/:id', authorize('admin'), c.deleteStudent);
r.get('/:id/attendance', c.getStudentAttendance);
r.get('/:id/marks', c.getStudentMarks);
r.post('/bookmark/:newsId', authorize('student'), c.toggleBookmark);
module.exports = r;
