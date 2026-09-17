import mongoose, { Document, Schema } from 'mongoose';

export type TaskType = 'task' | 'assignment' | 'study' | 'coding' | 'habit' | 'assessment' | 'personal';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';
export type TaskSource = 'manual' | 'ai' | 'college' | 'assignment' | 'assessment' | 'leetcode' | 'github' | 'habit' | 'study_plan';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  estimatedMinutes: number;
  courseId?: mongoose.Types.ObjectId;
  source: TaskSource;
  tags: string[];
  recurrence: 'none' | 'daily' | 'weekly' | 'custom';
  calculatedScore: number;
  priorityReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['task', 'assignment', 'study', 'coding', 'habit', 'assessment', 'personal'],
      default: 'task',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed', 'archived'],
      default: 'todo',
      index: true
    },
    dueDate: { type: Date, index: true },
    estimatedMinutes: { type: Number, default: 30 },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', index: true },
    source: {
      type: String,
      enum: ['manual', 'ai', 'college', 'assignment', 'assessment', 'leetcode', 'github', 'habit', 'study_plan'],
      default: 'manual'
    },
    tags: [{ type: String, trim: true }],
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'custom'],
      default: 'none'
    },
    calculatedScore: { type: Number, default: 50, index: true },
    priorityReason: { type: String, default: '' },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

TaskSchema.index({ userId: 1, status: 1, calculatedScore: -1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
