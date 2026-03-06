const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// ─── Trust proxy (fixes X-Forwarded-For rate-limit warning in dev) ────────────
app.set('trust proxy', 1);

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── Static Files (Uploads) ───────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Database Connection ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => { console.error('❌ MongoDB Connection Error:', err.message); process.exit(1); });

// ─── Auth Routes (per-route rate limiting) ────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' }
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many registrations from this IP.' }
});
const { register, login, getMe, forgotPassword, resetPassword, updatePassword, updatePreferences } = require('./controllers/authController');
const { protect } = require('./middleware/auth');
const { body } = require('express-validator');
const authRouter = require('express').Router();
authRouter.post('/login',    loginLimiter,    login);
authRouter.post('/register', registerLimiter, [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'teacher', 'student'])
], register);
authRouter.get('/me', protect, getMe);
authRouter.post('/forgot-password', forgotPassword);
authRouter.put('/reset-password/:token', resetPassword);
authRouter.put('/update-password', protect, updatePassword);
authRouter.put('/preferences', protect, updatePreferences);
app.use('/api/auth', authRouter);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/marks', require('./routes/marksRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/news', require('./routes/newsRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  success: true,
  message: 'School System API is running',
  timestamp: new Date(),
  env: process.env.NODE_ENV
}));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use('*', (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);

  // Auto-fetch news on startup + every 6 hours (only if API key is set)
  const { fetchAndSaveAllNews } = require('./utils/newsService');
  const runNewsFetch = () => {
    if (!process.env.NEWS_API_KEY || process.env.NEWS_API_KEY === 'your_news_api_key_here') return;
    console.log('📰 Fetching latest news...');
    fetchAndSaveAllNews()
      .then(r => console.log(`📰 News: ${r.saved || 0} new articles saved`))
      .catch(e => console.error('📰 News fetch error:', e.message));
  };
  setTimeout(runNewsFetch, 8000);                   // 8s after startup
  setInterval(runNewsFetch, 6 * 60 * 60 * 1000);   // then every 6 hours
});

module.exports = app;
