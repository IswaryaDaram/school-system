const express = require('express');
const r = express.Router();
const { createNews, getNews } = require('../controllers/academicController');
const { protect, authorize } = require('../middleware/auth');
const { News } = require('../models/ContentModels');
const { fetchAndSaveAllNews, fetchCategory } = require('../utils/newsService');

r.use(protect);

// Public (authenticated) — read news
r.get('/', getNews);

// Admin — manual fetch from NewsAPI
r.post('/fetch', authorize('admin'), async (req, res, next) => {
  try {
    const { category } = req.body;
    let result;
    if (category && category !== 'all') {
      result = await fetchCategory(category);
    } else {
      result = await fetchAndSaveAllNews();
    }
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, message: `Fetched news: ${result.saved} saved, ${result.skipped} skipped`, data: result });
  } catch (e) { next(e); }
});

// Admin — create manual news article
r.post('/', authorize('admin'), createNews);

// Admin — update
r.put('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!news) return res.status(404).json({ success: false, message: 'News not found' });
    res.json({ success: true, data: news });
  } catch(e) { next(e); }
});

// Admin — delete (soft)
r.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    await News.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'News removed.' });
  } catch(e) { next(e); }
});

module.exports = r;
