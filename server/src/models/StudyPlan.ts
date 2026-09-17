import mongoose, { Document, Schema } from 'mongoose';

export interface IStudyPlanDay {
  dayNumber: number;
  date: string; // YYYY-MM-DD
  unitNumber: number;
  topicTitle: string;
  durationMinutes: number;
  learningObjectives?: string[];
  completed: boolean;
  taskId?: mongoose.Types.ObjectId;
  calendarEventId?: mongoose.Types.ObjectId;
}

export interface IStudyPlan extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  examDate: Date;
  targetHours: number;
  days: IStudyPlanDay[];
  status: 'active' | 'completed' | 'archived';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudyPlanSchema = new Schema<IStudyPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    examDate: { type: Date, required: true },
    targetHours: { type: Number, required: true },
    days: [
      {
        dayNumber: { type: Number, required: true },
        date: { type: String, required: true },
        unitNumber: { type: Number, required: true },
        topicTitle: { type: String, required: true },
        durationMinutes: { type: Number, required: true },
        learningObjectives: [{ type: String }],
        completed: { type: Boolean, default: false },
        taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
        calendarEventId: { type: Schema.Types.ObjectId, ref: 'CalendarEvent' }
      }
    ],
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
    notes: { type: String }
  },
  { timestamps: true }
);

export const StudyPlan = mongoose.model<IStudyPlan>('StudyPlan', StudyPlanSchema);

export interface IStudySession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  taskTitle?: string;
  durationMinutes: number;
  completed: boolean;
  startedAt: Date;
  endedAt?: Date;
  musicTrack?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', index: true },
    taskTitle: { type: String, default: 'Focus Session' },
    durationMinutes: { type: Number, required: true },
    completed: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    musicTrack: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

StudySessionSchema.index({ userId: 1, startedAt: -1 });

export const StudySession = mongoose.model<IStudySession>('StudySession', StudySessionSchema);
