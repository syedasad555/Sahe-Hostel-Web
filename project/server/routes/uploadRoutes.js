import express from 'express';
import multer from 'multer';
import path from 'path';
import { CSV_TEMP_DIR, ensureUploadsDir } from '../config/uploadsDir.js';
import { processCsvUpload } from '../controllers/uploadController.js';

ensureUploadsDir();

const router = express.Router();

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, CSV_TEMP_DIR);
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/csv', upload.single('csvFile'), processCsvUpload);

export default router;
