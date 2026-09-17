import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  originalName: string;
  fileName: string;
  filePath: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'txt' | 'image';
  fileSize: number;
  extractedText?: string;
  status: 'uploaded' | 'analyzing' | 'preview_ready' | 'confirmed' | 'failed';
  extractedData?: {
    courseName?: string;
    courseCode?: string;
    instructor?: string;
    units?: Array<{
      unitNumber: number;
      title: string;
      topics: string[];
      learningObjectives?: string[];
    }>;
    assignments?: Array<{
      title: string;
      description?: string;
      dueDate?: string;
      estimatedMinutes?: number;
      weight?: number;
    }>;
    assessments?: Array<{
      title: string;
      type: string;
      date?: string;
      syllabus?: string;
      weight?: number;
    }>;
    recommendedMaterials?: string[];
  };
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CourseDocumentSchema = new Schema<ICourseDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', index: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'pptx', 'txt', 'image'],
      required: true
    },
    fileSize: { type: Number, required: true },
    extractedText: { type: String },
    status: {
      type: String,
      enum: ['uploaded', 'analyzing', 'preview_ready', 'confirmed', 'failed'],
      default: 'uploaded'
    },
    extractedData: { type: Schema.Types.Mixed },
    errorMessage: { type: String }
  },
  { timestamps: true }
);

export const CourseDocument = mongoose.model<ICourseDocument>('CourseDocument', CourseDocumentSchema);
