const express = require('express');
const r = express.Router();
const { addMarks, getClassMarks } = require('../controllers/academicController');
const { protect, authorize } = require('../middleware/auth');
r.use(protect);
r.post('/', authorize('teacher', 'admin'), addMarks);
r.get('/', getClassMarks);
module.exports = r;
