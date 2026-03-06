/**
 * newsService.js — NewsAPI integration (free plan compatible)
 * 
 * Free plan limits:
 *  - Only /top-headlines endpoint works reliably on localhost
 *  - /everything works but limited — we use it only for education + local AP news
 *  - 100 requests/day total
 *  - No future-dated articles
 */
const axios = require('axios');
const { News } = require('../models/ContentModels');
const User  = require('../models/User');

const BASE = 'https://newsapi.org/v2';

const FETCH_PLANS = [
  // National India — top headlines
  {
    category: 'national', isTopNews: true,
    url: `${BASE}/top-headlines`,
    params: { country: 'in', pageSize: 10 }
  },
  // International — top headlines (US + UK)
  {
    category: 'international', isTopNews: false,
    url: `${BASE}/top-headlines`,
    params: { country: 'us', pageSize: 8 }
  },
  // Sports — India sports headlines
  {
    category: 'sports', isTopNews: false,
    url: `${BASE}/top-headlines`,
    params: { country: 'in', category: 'sports', pageSize: 8 }
  },
  // Science & Tech
  {
    category: 'science_technology', isTopNews: false,
    url: `${BASE}/top-headlines`,
    params: { country: 'in', category: 'technology', pageSize: 8 }
  },
  // Education — keyword search
  {
    category: 'education', isTopNews: false,
    url: `${BASE}/everything`,
    params: { q: 'school education students India', language: 'en', sortBy: 'publishedAt', pageSize: 8 }
  },
  // Local — Andhra Pradesh, Krishna district
  {
    category: 'local', isTopNews: false,
    url: `${BASE}/everything`,
    params: { q: 'Andhra Pradesh OR "Krishna district" OR Vijayawada OR Machilipatnam', language: 'en', sortBy: 'publishedAt', pageSize: 10 }
  }
];

async function saveArticles(articles, plan, admin) {
  let saved = 0, skipped = 0;
  for (const article of articles) {
    if (!article.title || article.title === '[Removed]' || !article.url) { skipped++; continue; }
    const exists = await News.findOne({ sourceUrl: article.url });
    if (exists) { skipped++; continue; }
    await News.create({
      title:       article.title,
      content:     article.content || article.description || article.title,
      summary:     article.description || '',
      category:    plan.category,
      source:      article.source?.name || 'NewsAPI',
      sourceUrl:   article.url,
      imageUrl:    article.urlToImage || '',
      isTopNews:   plan.isTopNews,
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
      postedBy:    admin._id,
      isActive:    true
    });
    saved++;
  }
  return { saved, skipped };
}

async function fetchAndSaveAllNews() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey || apiKey === 'your_news_api_key_here') {
    return { error: 'NEWS_API_KEY not set in .env. Get free key at https://newsapi.org/register' };
  }
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) return { error: 'No admin user found. Run seeder first.' };

  let totalSaved = 0, totalSkipped = 0, errors = 0;
  const results = [];

  for (const plan of FETCH_PLANS) {
    try {
      const { data } = await axios.get(plan.url, {
        params: { ...plan.params, apiKey },
        timeout: 12000
      });
      if (data.status !== 'ok') throw new Error(data.message || 'API error');
      const { saved, skipped } = await saveArticles(data.articles || [], plan, admin);
      totalSaved   += saved;
      totalSkipped += skipped;
      results.push({ category: plan.category, fetched: data.articles?.length || 0, saved, skipped });
      // Slight delay between requests to avoid rate limit
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error(`NewsAPI [${plan.category}]:`, msg);
      results.push({ category: plan.category, error: msg });
      errors++;
    }
  }
  return { saved: totalSaved, skipped: totalSkipped, errors, results };
}

async function fetchCategory(category) {
  const plan = FETCH_PLANS.find(p => p.category === category);
  if (!plan) return { error: `Unknown category: ${category}` };
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey || apiKey === 'your_news_api_key_here') return { error: 'NEWS_API_KEY not set in .env' };
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) return { error: 'No admin user found' };
  try {
    const { data } = await axios.get(plan.url, { params: { ...plan.params, apiKey }, timeout: 12000 });
    if (data.status !== 'ok') throw new Error(data.message || 'API error');
    const { saved, skipped } = await saveArticles(data.articles || [], plan, admin);
    return { category, fetched: data.articles?.length || 0, saved, skipped };
  } catch (err) {
    return { category, error: err.response?.data?.message || err.message };
  }
}

module.exports = { fetchAndSaveAllNews, fetchCategory, FETCH_PLANS };
