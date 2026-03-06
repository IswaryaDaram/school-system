const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const sendEmail = require('../utils/sendEmail');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  const userObj = user.toObject();
  delete userObj.password;
  res.status(statusCode).json({ success: true, token, user: userObj });
};

// @route POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const user = await User.create({ name, email, password, role, phone });

    // Auto-create role profile
    if (role === 'student') {
      const rollNumber = `STU${Date.now()}`;
      const student = await Student.create({ user: user._id, rollNumber, admissionNumber: rollNumber });
      user.studentProfile = student._id;
      await user.save({ validateBeforeSave: false });
    } else if (role === 'teacher') {
      const employeeId = `EMP${Date.now()}`;
      const teacher = await Teacher.create({ user: user._id, employeeId });
      user.teacherProfile = teacher._id;
      await user.save({ validateBeforeSave: false });
    }

    sendTokenResponse(user, 201, res);
  } catch (err) { next(err); }
};

// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });

    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// @route GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('studentProfile')
      .populate('teacherProfile');
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with that email.' });

    const resetToken = user.getPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - School System',
      html: `<p>You requested a password reset. Click below:</p><a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">Reset Password</a><p>Link expires in 30 minutes.</p>`
    });

    res.status(200).json({ success: true, message: 'Password reset email sent.' });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpire: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// @route PUT /api/auth/update-password
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword)))
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    user.password = req.body.newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// @route PUT /api/auth/preferences
exports.updatePreferences = async (req, res, next) => {
  try {
    const { language, darkMode } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { language, darkMode }, { new: true });
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};
