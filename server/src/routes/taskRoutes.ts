import { Router } from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  toggleTaskComplete,
  deleteTask,
  rolloverTasksToTomorrow
} from '../controllers/taskController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.post('/', createTask);
router.post('/rollover', rolloverTasksToTomorrow);
router.patch('/:id', updateTask);
router.patch('/:id/toggle', toggleTaskComplete);
router.delete('/:id', deleteTask);

export default router;
