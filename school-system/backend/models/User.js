const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'] },
  password: { type: String, required: [true, 'Password is required'], minlength: [6, 'Password must be at least 6 characters'], select: false },
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  phone: { type: String, trim: true },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  language: { type: String, enum: ['en', 'te'], default: 'en' },
  darkMode: { type: Boolean, default: false },
  lastLogin: { type: Date },
  passwordResetToken: String,
  passwordResetExpire: Date,
  emailVerificationToken: String,
  isEmailVerified: { type: Boolean, default: false },
  // Role-specific references
  studentProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  teacherProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token
userSchema.methods.getPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpire = Date.now() + 30 * 60 * 1000; // 30 mins
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
