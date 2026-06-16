import multer from 'multer';
import path from 'path';
import { ensureUploadsDir, UPLOADS_DIR } from '../config/uploadsDir.js';

ensureUploadsDir();

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  try {
    cb(null, true);
  } catch (error) {
    console.error('Error in fileFilter:', error);
    cb(error);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
