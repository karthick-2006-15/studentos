import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Notification, NotificationSettings } from '../models/Notification';
import { notificationService } from '../services/notificationService';
import { AppError } from '../utils/AppError';

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(25);
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    await Notification.updateOne({ _id: id, userId }, { $set: { read: true } });
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

export const getNotificationSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    let settings = await NotificationSettings.findOne({ userId });
    if (!settings) {
      settings = await NotificationSettings.create({ userId });
    }

    return res.status(200).json({
      success: true,
      settings: settings.preferences,
      hasPushSubscription: Boolean(settings.pushSubscription)
    });
  } catch (err) {
    next(err);
  }
};

export const updateNotificationSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { preferences } = req.body;

    const settings = await NotificationSettings.findOneAndUpdate(
      { userId },
      { $set: { preferences } },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      preferences: settings.preferences
    });
  } catch (err) {
    next(err);
  }
};

export const savePushSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return next(new AppError('Valid push subscription object required', 400));
    }

    await NotificationSettings.findOneAndUpdate(
      { userId },
      { $set: { pushSubscription: subscription } },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Push notification subscription registered successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const sendTestPush = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    await notificationService.sendNotification(userId!, {
      title: 'NEXUS — System Alert',
      body: 'Notifications are actively configured and synchronized.',
      type: 'system',
      actionUrl: '/dashboard'
    });

    return res.status(200).json({
      success: true,
      message: 'Test notification sent'
    });
  } catch (err) {
    next(err);
  }
};
