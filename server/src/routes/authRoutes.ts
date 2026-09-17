import { Router } from 'express';
import { register, login, logout, getMe, updatePreferences, googleAuth } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.patch('/preferences', authenticate, updatePreferences);

export default router;
