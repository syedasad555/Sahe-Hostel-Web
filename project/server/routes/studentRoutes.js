import express from 'express';
import {
  registerStudent,
  loginStudent,
  getStudents,
  getStudent,
  deleteStudent
} from '../controllers/studentController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Login student
router.post('/login', loginStudent);

// Register student with file uploads
router.post(
  '/',
  upload.fields([
    { name: 'studentPhoto', maxCount: 1 },
    { name: 'parentPhoto', maxCount: 1 },
    { name: 'tenthCertificate', maxCount: 1 },
    { name: 'paymentReceipt', maxCount: 1 },
    { name: 'aadharCard', maxCount: 1 }
  ]),
  registerStudent
);

// Get all students with search and filter
router.get('/', getStudents);

// Get single student
router.get('/:id', getStudent);

// Delete a student
router.delete('/:id', deleteStudent);

export default router;
