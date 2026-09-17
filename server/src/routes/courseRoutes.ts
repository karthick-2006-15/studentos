import { Router } from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/courseController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', createCourse);
router.patch('/:id', updateCourse);
router.delete('/:id', deleteCourse);

export default router;
