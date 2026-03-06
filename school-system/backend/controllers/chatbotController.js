/**
 * chatbotController.js
 * 
 * Chatbot  → Groq API (FREE: 14,400 req/day, Llama 3.3 70B)
 *            Sign up: https://console.groq.com  →  API Keys  →  Create Key
 *            Add to .env: GROQ_API_KEY=gsk_...
 *
 * Translate → MyMemory API (FREE: 5,000 words/day, NO KEY NEEDED)
 *             https://mymemory.translated.net
 */

const axios   = require('axios');
const Student = require('../models/Student');
const { Attendance, Assignment } = require('../models/AcademicModels');

// ─── Build user context ────────────────────────────────────────────────────────
async function buildContext(user) {
  let context = `User: ${user.name} (${user.role})`;
  try {
    if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id }).populate('class', 'name section');
      if (student) {
        const recent  = await Attendance.find({ student: student._id }).sort('-date').limit(30);
        const present = recent.filter(a => a.status === 'present').length;
        const pct     = recent.length > 0 ? ((present / recent.length) * 100).toFixed(1) : 'N/A';
        const pending = await Assignment.countDocuments({ class: student.class?._id, deadline: { $gte: new Date() } });
        context = `Student: ${user.name} | Class: ${student.class?.name || 'N/A'} ${student.class?.section || ''} | Roll: ${student.rollNumber} | Attendance: ${pct}% | Pending Assignments: ${pending}`;
      }
    } else if (user.role === 'teacher') {
      context = `Teacher: ${user.name}`;
    } else if (user.role === 'admin') {
      const count = await Student.countDocuments({ isArchived: false });
      context = `Admin: ${user.name} | Active students: ${count}`;
    }
  } catch (e) { /* use default */ }
  return context;
}

// ─── Groq API call (free, fast, Llama 3.3 70B) ───────────────────────────────
async function callGroq(systemPrompt, messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('MISSING_GROQ_KEY');
  }

  const { data } = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    }
  );
  return data?.choices?.[0]?.message?.content || '';
}

// ─── MyMemory Translation (free, no key needed) ────────────────────────────────
async function translateWithMyMemory(text, targetLang = 'te') {
  if (!text || !text.trim()) return '';
  
  // MyMemory has a 500 char limit per request — chunk if needed
  const chunks = [];
  const words  = text.split(' ');
  let   chunk  = '';
  for (const word of words) {
    if ((chunk + ' ' + word).length > 450) {
      if (chunk) chunks.push(chunk.trim());
      chunk = word;
    } else {
      chunk += (chunk ? ' ' : '') + word;
    }
  }
  if (chunk) chunks.push(chunk.trim());

  const translated = [];
  for (const c of chunks) {
    try {
      const { data } = await axios.get('https://api.mymemory.translated.net/get', {
        params: { q: c, langpair: `en|${targetLang}` },
        timeout: 8000
      });
      const result = data?.responseData?.translatedText;
      translated.push(result || c);
      // Small delay between chunks to be respectful
      if (chunks.length > 1) await new Promise(r => setTimeout(r, 200));
    } catch {
      translated.push(c); // fallback: keep original
    }
  }
  return translated.join(' ');
}

// ─── GET /api/chatbot/context ──────────────────────────────────────────────────
exports.getContext = async (req, res) => {
  const context = await buildContext(req.user);
  res.json({ success: true, context });
};

// ─── POST /api/chatbot ─────────────────────────────────────────────────────────
exports.chat = async (req, res) => {
  const { message, conversationHistory = [], language = 'en' } = req.body;
  const user    = req.user;
  const context = await buildContext(user);

  const langInstruction = language === 'te'
    ? 'IMPORTANT: You MUST reply entirely in Telugu (తెలుగు) script only. No English words.'
    : 'Reply in English.';

  const systemPrompt =
    `You are a helpful school assistant AI for a school management system in Andhra Pradesh, India.\n` +
    `User context: ${context}\n` +
    `Today: ${new Date().toLocaleDateString('en-IN')}\n` +
    `${langInstruction}\n` +
    `You help with: attendance, marks, assignments, documents (bonafide/TC), study tips, AND career guidance.\n` +
    `Career guidance knowledge:\n` +
    `- After 10th: Science (PCM→Engineering/Architecture, PCB→Medicine/Nursing), Commerce (CA/BBA/MBA), Arts (IAS/Law/Journalism), Vocational (ITI/Polytechnic)\n` +
    `- Key entrance exams: JEE Main/Advanced (Engineering), NEET (Medicine), AP EAMCET (AP colleges), CLAT (Law), NDA (Defence)\n` +
    `- Govt jobs: UPSC (IAS/IPS), SSC CGL/CHSL/MTS, RRB Railways, APPSC (AP state), AP Police, AP Grama Sachivalayam, IBPS/SBI Bank jobs\n` +
    `- Scholarships: NMMS, NTSE, PM YASASVI, Jagananna Vidya Deevena, Jagananna Vasathi Deevena, Pre/Post Matric SC/ST/BC scholarships\n` +
    `- Documents: Bonafide certificate (for bank/scholarship/concession), TC (for school transfer — irreversible)\n` +
    `Be concise and friendly. Keep replies under 120 words.`;

  const messages = [
    ...conversationHistory.slice(-8).map(m => ({
      role:    m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content)
    })),
    { role: 'user', content: String(message) }
  ];

  try {
    const reply = await callGroq(systemPrompt, messages);
    res.json({ success: true, reply, role: 'assistant' });
  } catch (err) {
    console.error('Chatbot error:', err.response?.status, err.message);
    let reply;
    if (err.message === 'MISSING_GROQ_KEY') {
      reply = language === 'te'
        ? '⚙️ Chatbot సెటప్ అవలేదు. GROQ_API_KEY ని .env లో జోడించండి. ఉచిత కీ: console.groq.com'
        : '⚙️ Chatbot not set up. Add GROQ_API_KEY to .env. Free key at: console.groq.com';
    } else if (err.response?.status === 401) {
      reply = '⚠️ Invalid Groq API key. Check GROQ_API_KEY in .env';
    } else if (err.response?.status === 429) {
      reply = language === 'te'
        ? '⚠️ రోజువారీ పరిమితి దాటింది. రేపు మళ్ళీ ప్రయత్నించండి.'
        : '⚠️ Daily free limit reached. Try again tomorrow.';
    } else {
      reply = language === 'te'
        ? '⚠️ కనెక్షన్ విఫలమైంది. మళ్ళీ ప్రయత్నించండి.'
        : `⚠️ Connection error: ${err.message}`;
    }
    res.json({ success: true, reply, role: 'assistant' });
  }
};

// ─── POST /api/chatbot/translate ───────────────────────────────────────────────
exports.translate = async (req, res) => {
  const { title, summary, content } = req.body;
  if (!title && !content) {
    return res.status(400).json({ success: false, message: 'No text provided' });
  }

  try {
    // Translate all three fields in parallel
    const [tTitle, tSummary, tContent] = await Promise.all([
      title   ? translateWithMyMemory(title,   'te') : Promise.resolve(''),
      summary ? translateWithMyMemory(summary, 'te') : Promise.resolve(''),
      content ? translateWithMyMemory(content, 'te') : Promise.resolve('')
    ]);

    res.json({
      success:  true,
      title:    tTitle,
      summary:  tSummary,
      content:  tContent
    });
  } catch (err) {
    console.error('Translation error:', err.message);
    res.json({ success: false, message: `Translation failed: ${err.message}` });
  }
};
