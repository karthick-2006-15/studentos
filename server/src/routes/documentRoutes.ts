import { Router } from 'express';
import {
  uploadAndAnalyzeDocument,
  getDocumentPreview,
  confirmDocumentExtraction
} from '../controllers/documentController';
import { authenticate } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('file'), uploadAndAnalyzeDocument);
router.get('/:id', getDocumentPreview);
router.post('/:id/confirm', confirmDocumentExtraction);

export default router;
