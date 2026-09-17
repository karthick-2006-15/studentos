import { Router } from 'express';
import {
  getAssignments,
  createAssignment,
  updateAssignmentStatus,
  getAssessments,
  createAssessment,
  updateAssessmentStatus
} from '../controllers/academicController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// Assignments
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.patch('/assignments/:id', updateAssignmentStatus);

// Assessments
router.get('/assessments', getAssessments);
router.post('/assessments', createAssessment);
router.patch('/assessments/:id', updateAssessmentStatus);

export default router;
