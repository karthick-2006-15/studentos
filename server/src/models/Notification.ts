import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationSettings extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  pushSubscription?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  preferences: {
    morningBriefing: boolean;
    morningBriefingTime: string; // "08:00"
    eveningReview: boolean;
    eveningReviewTime: string; // "21:00"
    deadlineReminders: boolean;
    assessmentAlerts: boolean;
    studyReminders: boolean;
    habitReminders: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string; // "23:00"
    quietHoursEnd: string; // "07:00"
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSettingsSchema = new Schema<INotificationSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    pushSubscription: { type: Schema.Types.Mixed },
    preferences: {
      morningBriefing: { type: Boolean, default: true },
      morningBriefingTime: { type: String, default: '08:00' },
      eveningReview: { type: Boolean, default: true },
      eveningReviewTime: { type: String, default: '21:00' },
      deadlineReminders: { type: Boolean, default: true },
      assessmentAlerts: { type: Boolean, default: true },
      studyReminders: { type: Boolean, default: true },
      habitReminders: { type: Boolean, default: true },
      quietHoursEnabled: { type: Boolean, default: true },
      quietHoursStart: { type: String, default: '23:00' },
      quietHoursEnd: { type: String, default: '07:00' }
    }
  },
  { timestamps: true }
);

export const NotificationSettings = mongoose.model<INotificationSettings>(
  'NotificationSettings',
  NotificationSettingsSchema
);

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  type: 'briefing' | 'deadline' | 'assessment' | 'habit' | 'study' | 'system';
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: ['briefing', 'deadline', 'assessment', 'habit', 'study', 'system'],
      default: 'system'
    },
    read: { type: Boolean, default: false },
    actionUrl: { type: String, default: '/' }
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
