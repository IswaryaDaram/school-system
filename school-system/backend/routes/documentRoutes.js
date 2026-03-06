const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const r        = express.Router();
const { createDocumentRequest, getDocumentRequests, updateDocumentRequest } = require('../controllers/academicController');
const { protect, authorize } = require('../middleware/auth');
const { uploadDocument, handleUploadError } = require('../middleware/upload');
const { DocumentRequest } = require('../models/ContentModels');

r.use(protect);

r.post('/',    authorize('student'), uploadDocument, handleUploadError, createDocumentRequest);
r.get('/',     getDocumentRequests);
r.put('/:id',  authorize('admin'), updateDocumentRequest);

// ── Download generated certificate ──────────────────────────────────────────
r.get('/download/:id', async (req, res, next) => {
  try {
    const doc = await DocumentRequest.findById(req.params.id)
      .populate({ path: 'student', populate: { path: 'user', select: 'name _id' } });

    if (!doc)                    return res.status(404).json({ success: false, message: 'Request not found' });
    if (doc.status !== 'approved') return res.status(400).json({ success: false, message: 'Certificate not yet approved' });

    // Auth check: owner student or admin
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isOwner = doc.student?.user?._id?.toString() === userId ||
                    doc.student?.user?.toString()       === userId;
    if (!isAdmin && !isOwner) return res.status(403).json({ success: false, message: 'Access denied' });

    // Build absolute path
    const relPath  = doc.generatedCertificate || '';
    const absPath  = path.join(__dirname, '..', relPath);
    const filename = `${doc.type}_certificate_${doc.requestNumber}.pdf`;

    const sendFile = (p) => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      fs.createReadStream(p).pipe(res);
    };

    if (relPath && fs.existsSync(absPath)) return sendFile(absPath);

    // File missing — regenerate
    const { generateBonafideCertificate, generateTCCertificate } = require('../utils/pdfGenerator');
    const gen = doc.type === 'bonafide' ? generateBonafideCertificate : generateTCCertificate;
    const { filePath: newAbs, fileName: newName } = await gen(doc.student, doc);
    doc.generatedCertificate = `uploads/documents/${newName}`;
    await doc.save();
    sendFile(newAbs);
  } catch (e) { next(e); }
});

module.exports = r;
