import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  googleId?: string;
  college?: string;
  major?: string;
  semester?: number;
  graduationYear?: number;
  preferences: {
    theme: 'dark' | 'light' | 'system';
    quietHoursStart: string;
    quietHoursEnd: string;
    enablePush: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: false },
    avatar: { type: String, default: '' },
    googleId: { type: String, sparse: true, index: true },
    college: { type: String, default: 'College of Engineering' },
    major: { type: String, default: 'Computer Science & Engineering' },
    semester: { type: Number, default: 5 },
    graduationYear: { type: Number, default: 2026 },
    preferences: {
      theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
      quietHoursStart: { type: String, default: '23:00' },
      quietHoursEnd: { type: String, default: '07:00' },
      enablePush: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
