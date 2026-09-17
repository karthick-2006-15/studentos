import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  type: 'cat' | 'midterm' | 'final' | 'quiz' | 'lab_exam' | 'project';
  date: Date;
  syllabus?: string;
  weight?: number; // e.g. 20%
  preparationStatus: 'not_started' | 'reviewing' | 'ready';
  notes?: string;
  associatedTaskId?: mongoose.Types.ObjectId;
  associatedCalendarEventId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['cat', 'midterm', 'final', 'quiz', 'lab_exam', 'project'],
      default: 'cat'
    },
    date: { type: Date, required: true, index: true },
    syllabus: { type: String, default: '' },
    weight: { type: Number, default: 25 },
    preparationStatus: {
      type: String,
      enum: ['not_started', 'reviewing', 'ready'],
      default: 'not_started'
    },
    notes: { type: String },
    associatedTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    associatedCalendarEventId: { type: Schema.Types.ObjectId, ref: 'CalendarEvent' }
  },
  { timestamps: true }
);

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
