const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (allowed) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error(`File type ${ext} not allowed`), false);
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

exports.uploadMaterial = multer({
  storage: createStorage('materials'),
  fileFilter: fileFilter(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.jpg', '.jpeg', '.png']),
  limits: { fileSize: maxSize }
}).single('file');

exports.uploadAssignment = multer({
  storage: createStorage('assignments'),
  fileFilter: fileFilter(['.pdf', '.doc', '.docx', '.zip', '.jpg', '.jpeg', '.png']),
  limits: { fileSize: maxSize }
}).array('files', 5);

exports.uploadDocument = multer({
  storage: createStorage('documents'),
  fileFilter: fileFilter(['.pdf', '.jpg', '.jpeg', '.png']),
  limits: { fileSize: maxSize }
}).array('documents', 3);

exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File too large. Max 10MB allowed.' });
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) return res.status(400).json({ success: false, message: err.message });
  next();
};
