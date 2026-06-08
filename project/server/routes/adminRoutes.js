import express from 'express';
import {
  getAdminDashboard,
  getAdminProfile,
  loginAdmin,
  requestAdminCredentialOtp,
  verifyAdminCredentialOtp,
  updateAdminCredentials,
} from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.get('/profile', protectAdmin, getAdminProfile);
router.get('/dashboard', protectAdmin, getAdminDashboard);

// Credential update (OTP flow)
router.post('/otp/request', protectAdmin, requestAdminCredentialOtp);
router.post('/otp/verify', protectAdmin, verifyAdminCredentialOtp);
router.post('/account/update', protectAdmin, updateAdminCredentials);

export default router;
