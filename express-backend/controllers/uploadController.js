import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'public/avatars');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => { //to change
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadAvatar = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const validExtensions = /jpeg|jpg|png|webp/;
    const extMatch = validExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimeMatch = validExtensions.test(file.mimetype);

    if (extMatch && mimeMatch) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, webp) are permitted.'));
    }
  }
});

app.use('/uploads', express.static(uploadDir));

app.post('/api/upload', upload.single('picture'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  res.status(200).json({
    message: 'File processed successfully.',
    filename: req.file.filename,
    url: `http://localhost:${PORT}/uploads/${req.file.filename}`
  });
});

// Global error handler specifically tracking file upload limits
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// app.listen(PORT, () => console.log(`Server handling storage on port ${PORT}`));

module.exports = { uploadAvatar }