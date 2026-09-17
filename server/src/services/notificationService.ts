import webpush from 'web-push';
import { env } from '../config/env';
import { Notification, NotificationSettings } from '../models/Notification';
import { logger } from '../utils/logger';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(env.VAPID_EMAIL, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

export const notificationService = {
  /**
   * Dispatches a notification both to the internal database and Web Push
   */
  async sendNotification(
    userId: string,
    payload: {
      title: string;
      body: string;
      type?: 'briefing' | 'deadline' | 'assessment' | 'habit' | 'study' | 'system';
      actionUrl?: string;
    }
  ) {
    try {
      const type = payload.type || 'system';

      // 1. Check user notification settings and quiet hours
      const settings = await NotificationSettings.findOne({ userId });
      if (settings?.preferences?.quietHoursEnabled) {
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = parseInt(settings.preferences.quietHoursStart.split(':')[0], 10);
        const endHour = parseInt(settings.preferences.quietHoursEnd.split(':')[0], 10);

        const isQuietTime =
          startHour > endHour
            ? currentHour >= startHour || currentHour < endHour
            : currentHour >= startHour && currentHour < endHour;

        if (isQuietTime && type !== 'assessment') {
          logger.info(`Notification for user ${userId} skipped due to quiet hours.`);
          return null;
        }
      }

      // 2. Persist in-app notification
      const notification = await Notification.create({
        userId,
        title: payload.title,
        body: payload.body,
        type,
        actionUrl: payload.actionUrl || '/',
        read: false
      });

      // 3. Dispatch Web Push if subscribed
      if (settings?.pushSubscription?.endpoint && env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
        try {
          await webpush.sendNotification(
            settings.pushSubscription as any,
            JSON.stringify({
              title: payload.title,
              body: payload.body,
              data: {
                url: payload.actionUrl || '/',
                notificationId: notification._id
              }
            })
          );
        } catch (pushErr: any) {
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            logger.warn(`Push subscription expired for user ${userId}. Removing.`);
            await NotificationSettings.updateOne({ userId }, { $unset: { pushSubscription: 1 } });
          } else {
            logger.warn('Web push delivery failed:', pushErr.message);
          }
        }
      }

      return notification;
    } catch (err: any) {
      logger.error('Error in sendNotification:', err.message);
      return null;
    }
  }
};
