const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const r        = express.Router();
const { uploadMaterial: uploadCtrl, getMaterials } = require('../controllers/academicController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMaterial, handleUploadError } = require('../middleware/upload');
const StudyMaterial = require('../models/StudyMaterial');

r.use(protect);
r.get('/', getMaterials);
r.post('/', authorize('teacher', 'admin'), uploadMaterial, handleUploadError, uploadCtrl);

// DELETE material
r.delete('/:id', authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const mat = await StudyMaterial.findById(req.params.id);
    if (!mat) return res.status(404).json({ success: false, message: 'Material not found' });
    // Delete file from disk
    if (mat.filePath) {
      const abs = path.join(__dirname, '..', mat.filePath);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    }
    await StudyMaterial.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Material deleted.' });
  } catch (e) { next(e); }
});

// Secure download
r.get('/download/:id', async (req, res, next) => {
  try {
    const mat = await StudyMaterial.findById(req.params.id);
    if (!mat) return res.status(404).json({ success: false, message: 'Not found' });
    const absPath = path.join(__dirname, '..', mat.filePath);
    if (!fs.existsSync(absPath)) return res.status(404).json({ success: false, message: 'File not found on server' });
    res.setHeader('Content-Disposition', `attachment; filename="${mat.fileName || mat.title}"`);
    fs.createReadStream(absPath).pipe(res);
  } catch (e) { next(e); }
});

module.exports = r;
