const express = require('express');
const r = express.Router();
const { chat, getContext, translate } = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');
r.get('/context',    protect, getContext);
r.post('/',          protect, chat);
r.post('/translate', protect, translate);
module.exports = r;
