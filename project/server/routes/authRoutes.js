import express from 'express';
import { verifyStudent } from '../controllers/studentController.js';
import {
  loginFaculty,
  getFacultyProfile,
  logoutFaculty,
  requestFacultyCredentialOtp,
  verifyFacultyCredentialOtp,
  updateFacultyCredentials,
} from '../controllers/facultyController.js';
import { protectFaculty } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student routes
router.get('/verify', verifyStudent);

// Faculty routes
router.post('/faculty/login', loginFaculty);
router.post('/faculty/otp/request', requestFacultyCredentialOtp);
router.post('/faculty/otp/verify', verifyFacultyCredentialOtp);
router.post('/faculty/account/update', updateFacultyCredentials);
router.get('/faculty/profile', protectFaculty, getFacultyProfile);
router.post('/faculty/logout', protectFaculty, logoutFaculty);

export default router;
