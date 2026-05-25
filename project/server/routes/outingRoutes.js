import express from 'express';
import { protectFaculty } from '../middleware/authMiddleware.js';
import {
  listOutingStudents,
  lookupStudentByRoll,
  notifyOutingParents,
  listOutingPermissions,
  removeOutingMember,
  deleteOutingPermission,
} from '../controllers/outingController.js';

const router = express.Router();

router.get('/students', protectFaculty, listOutingStudents);
router.get('/permissions', protectFaculty, listOutingPermissions);
router.delete('/permissions/:id/members/:rollNumber', protectFaculty, removeOutingMember);
router.delete('/permissions/:id', protectFaculty, deleteOutingPermission);
router.get('/lookup/:rollNumber', protectFaculty, lookupStudentByRoll);
router.post('/notify', protectFaculty, notifyOutingParents);

export default router;
