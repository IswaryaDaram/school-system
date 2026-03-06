// ─── authRoutes.js ───────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, updatePassword, updatePreferences } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

router.post('/register', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'teacher', 'student'])
], register);

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/update-password', protect, updatePassword);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
