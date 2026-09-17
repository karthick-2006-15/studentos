import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueDate: Date;
  weight?: number; // e.g. 10%
  estimatedMinutes: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'completed';
  associatedTaskId?: mongoose.Types.ObjectId;
  submissionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: true, index: true },
    weight: { type: Number, default: 10 },
    estimatedMinutes: { type: Number, default: 90 },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'submitted', 'completed'],
      default: 'pending',
      index: true
    },
    associatedTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    submissionNotes: { type: String }
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
