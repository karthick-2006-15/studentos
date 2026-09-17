import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationSettings,
  updateNotificationSettings,
  savePushSubscription,
  sendTestPush
} from '../controllers/notificationController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);
router.get('/settings', getNotificationSettings);
router.patch('/settings', updateNotificationSettings);
router.post('/subscribe', savePushSubscription);
router.post('/test', sendTestPush);

export default router;
