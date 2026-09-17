import mongoose, { Document, Schema } from 'mongoose';

export type HabitTimeOfDay = 'morning' | 'study' | 'night' | 'anytime';

export interface IHabit extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  category: HabitTimeOfDay;
  description?: string;
  targetDaysPerWeek: number;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['morning', 'study', 'night', 'anytime'],
      default: 'anytime'
    },
    description: { type: String, default: '' },
    targetDaysPerWeek: { type: Number, default: 7 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastCompletedDate: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Habit = mongoose.model<IHabit>('Habit', HabitSchema);

export interface IHabitLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  habitId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

const HabitLogSchema = new Schema<IHabitLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true, index: true },
    date: { type: String, required: true, index: true },
    completed: { type: Boolean, default: true },
    completedAt: { type: Date, default: Date.now },
    notes: { type: String }
  },
  { timestamps: true }
);

HabitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

export const HabitLog = mongoose.model<IHabitLog>('HabitLog', HabitLogSchema);
