import mongoose, { Document, Schema } from 'mongoose';

export type CalendarEventType =
  | 'class'
  | 'assignment'
  | 'assessment'
  | 'study_session'
  | 'coding'
  | 'habit'
  | 'personal';

export interface ICalendarEvent extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  type: CalendarEventType;
  courseId?: mongoose.Types.ObjectId;
  relatedTaskId?: mongoose.Types.ObjectId;
  source: 'manual' | 'ai' | 'handout' | 'study_plan' | 'assignment' | 'assessment';
  aiExplanation?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    allDay: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ['class', 'assignment', 'assessment', 'study_session', 'coding', 'habit', 'personal'],
      default: 'personal',
      index: true
    },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', index: true },
    relatedTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    source: {
      type: String,
      enum: ['manual', 'ai', 'handout', 'study_plan', 'assignment', 'assessment'],
      default: 'manual'
    },
    aiExplanation: { type: String, default: '' },
    color: { type: String, default: '#6366f1' }
  },
  { timestamps: true }
);

CalendarEventSchema.index({ userId: 1, startDate: 1, endDate: 1 });

export const CalendarEvent = mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
