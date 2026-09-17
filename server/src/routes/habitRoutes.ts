import { Router } from 'express';
import { getHabits, createHabit, toggleHabitDay, deleteHabit } from '../controllers/habitController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getHabits);
router.post('/', createHabit);
router.post('/:id/toggle', toggleHabitDay);
router.delete('/:id', deleteHabit);

export default router;
