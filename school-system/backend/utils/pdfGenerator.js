const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateBonafideCertificate = async (student, requestData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 60, right: 60 } });
    const fileName = `bonafide_${student.rollNumber}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '..', 'uploads', 'documents', fileName);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Header
    doc.fontSize(20).fillColor('#1a1a2e').font('Helvetica-Bold')
       .text('GOVERNMENT HIGH SCHOOL', { align: 'center' })
       .fontSize(12).font('Helvetica')
       .text('Hyderabad, Telangana - 500001', { align: 'center' })
       .text('Phone: +91-40-XXXXXXXX | Email: school@edu.gov.in', { align: 'center' })
       .moveDown(0.5);

    // Divider
    doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#4f46e5').moveDown(0.5);

    // Title
    doc.fontSize(16).fillColor('#4f46e5').font('Helvetica-Bold')
       .text('BONAFIDE CERTIFICATE', { align: 'center' }).moveDown(1);

    // Certificate Number
    doc.fontSize(10).fillColor('#666').font('Helvetica')
       .text(`Certificate No: ${requestData.requestNumber}   Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' }).moveDown(1);

    // Body
    doc.fontSize(12).fillColor('#1a1a2e').font('Helvetica')
       .text('To Whom It May Concern,', { indent: 0 }).moveDown(0.5);

    doc.text(`This is to certify that `, { continued: true })
       .font('Helvetica-Bold').text(`${student.user?.name || 'N/A'}`, { continued: true })
       .font('Helvetica').text(`, son/daughter of `)
       .font('Helvetica-Bold').text(`${student.parentName || 'N/A'}`, { continued: true })
       .font('Helvetica').text(`, bearing Roll No. `)
       .font('Helvetica-Bold').text(`${student.rollNumber}`, { continued: true })
       .font('Helvetica').text(`, is a bonafide student of this school studying in `)
       .font('Helvetica-Bold').text(`Class ${student.class?.name || 'N/A'}`, { continued: true })
       .font('Helvetica').text(` for the academic year `)
       .font('Helvetica-Bold').text(`${student.academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)}.`).moveDown(1);

    doc.text(`Purpose: ${requestData.reason}`).moveDown(2);

    doc.text('This certificate is issued for the purpose mentioned above.').moveDown(3);

    // Signature
    doc.font('Helvetica-Bold')
       .text('Principal / Headmaster', { align: 'right' })
       .font('Helvetica').text('(School Seal & Signature)', { align: 'right' });

    // Footer
    doc.fontSize(8).fillColor('#999')
       .text('This is a computer-generated certificate.', 60, 750, { align: 'center' });

    doc.end();
    writeStream.on('finish', () => resolve({ filePath, fileName }));
    writeStream.on('error', reject);
  });
};

exports.generateTCCertificate = async (student, requestData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 60, right: 60 } });
    const fileName = `tc_${student.rollNumber}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '..', 'uploads', 'documents', fileName);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    doc.fontSize(20).fillColor('#1a1a2e').font('Helvetica-Bold')
       .text('GOVERNMENT HIGH SCHOOL', { align: 'center' })
       .fontSize(12).font('Helvetica')
       .text('Hyderabad, Telangana - 500001', { align: 'center' }).moveDown(0.5);

    doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#ef4444').moveDown(0.5);

    doc.fontSize(16).fillColor('#ef4444').font('Helvetica-Bold')
       .text('TRANSFER CERTIFICATE', { align: 'center' }).moveDown(1);

    doc.fontSize(10).fillColor('#666').font('Helvetica')
       .text(`TC No: ${requestData.requestNumber}   Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' }).moveDown(1);

    const fields = [
      ['Student Name', student.user?.name || 'N/A'],
      ['Father\'s Name', student.parentName || 'N/A'],
      ['Date of Birth', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'],
      ['Admission Number', student.admissionNumber || student.rollNumber],
      ['Class Last Studied', `Class ${student.class?.name || 'N/A'}`],
      ['Academic Year', student.academicYear || 'N/A'],
      ['Date of Leaving', new Date().toLocaleDateString('en-IN')],
      ['Reason for Leaving', requestData.reason],
      ['Conduct', 'Good'],
      ['Whether Eligible for Re-admission', 'Yes']
    ];

    fields.forEach(([label, value]) => {
      doc.fontSize(11).fillColor('#1a1a2e')
         .font('Helvetica-Bold').text(`${label}: `, { continued: true })
         .font('Helvetica').text(value).moveDown(0.3);
    });

    doc.moveDown(2).font('Helvetica-Bold')
       .text('Principal / Headmaster', { align: 'right' })
       .font('Helvetica').text('(School Seal & Signature)', { align: 'right' });

    doc.end();
    writeStream.on('finish', () => resolve({ filePath, fileName }));
    writeStream.on('error', reject);
  });
};
