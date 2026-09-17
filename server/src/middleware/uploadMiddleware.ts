import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/AppError';

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `handout-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.docx', '.pptx', '.txt', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError(`Unsupported file format "${ext}". Allowed: PDF, DOCX, PPTX, TXT, PNG, JPG.`, 400));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter
});
