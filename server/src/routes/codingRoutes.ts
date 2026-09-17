import { Router } from 'express';
import {
  getCodingProfile,
  syncLeetCodeUser,
  syncGitHubUser,
  disconnectCodingService
} from '../controllers/codingController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getCodingProfile);
router.post('/leetcode/sync', syncLeetCodeUser);
router.post('/github/sync', syncGitHubUser);
router.delete('/:service', disconnectCodingService);

export default router;
