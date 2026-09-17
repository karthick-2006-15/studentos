import { Router } from 'express';
import { chatWithAssistant, getDailyBriefing, getEveningReview } from '../controllers/aiController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/chat', chatWithAssistant);
router.get('/briefing', getDailyBriefing);
router.get('/evening-review', getEveningReview);

export default router;
