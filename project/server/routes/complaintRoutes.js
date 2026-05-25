import express from 'express';
import {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
} from '../controllers/complaintController.js';
import { protectFaculty } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createComplaint);
router.get('/', protectFaculty, getComplaints);
router.patch('/:id', protectFaculty, updateComplaintStatus);

export default router;
