import { Router } from 'express';
import { getAcademicWorkload, getWeeklyStats } from '../controllers/analyticsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/workload', getAcademicWorkload);
router.get('/weekly', getWeeklyStats);

export default router;
