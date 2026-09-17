import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic {
  title: string;
  subtopics?: string[];
  estimatedHours?: number;
}

export interface IUnit {
  unitNumber: number;
  title: string;
  topics: string[];
  learningObjectives?: string[];
}

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  instructor?: string;
  credits?: number;
  color?: string;
  units: IUnit[];
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    instructor: { type: String, default: '' },
    credits: { type: Number, default: 3 },
    color: { type: String, default: '#6366f1' },
    units: [
      {
        unitNumber: { type: Number, required: true },
        title: { type: String, required: true },
        topics: [{ type: String }],
        learningObjectives: [{ type: String }]
      }
    ],
    status: { type: String, enum: ['active', 'archived'], default: 'active' }
  },
  { timestamps: true }
);

CourseSchema.index({ userId: 1, code: 1 }, { unique: true });

export const Course = mongoose.model<ICourse>('Course', CourseSchema);
