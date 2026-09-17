import { Router } from 'express';
import {
  generateStudyPlan,
  getStudyPlans,
  logFocusSession,
  getFocusHistory
} from '../controllers/studyPlanController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/generate', generateStudyPlan);
router.get('/', getStudyPlans);
router.post('/focus/log', logFocusSession);
router.get('/focus/history', getFocusHistory);

export default router;
