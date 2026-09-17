import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Habit, HabitLog } from '../models/Habit';
import { AppError } from '../utils/AppError';

export const getHabits = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const today = new Date().toISOString().split('T')[0];

    const habits = await Habit.find({ userId, isActive: true }).sort({ category: 1, createdAt: 1 });

    // Fetch logs for the last 7 days for the weekly dot matrix
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDateStr = sevenDaysAgo.toISOString().split('T')[0];

    const logs = await HabitLog.find({
      userId,
      date: { $gte: startDateStr }
    });

    const enriched = habits.map(habit => {
      const habitLogs = logs.filter(l => l.habitId.toString() === habit._id.toString());
      const completedToday = habitLogs.some(l => l.date === today && l.completed);

      // 7-day completion status array (Mon -> Sun or last 7 days)
      const weeklyStatus = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const isDone = habitLogs.some(l => l.date === dStr && l.completed);
        weeklyStatus.push({
          date: dStr,
          dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
          completed: isDone
        });
      }

      return {
        ...habit.toObject(),
        completedToday,
        weeklyStatus
      };
    });

    // Compute aggregate today stats
    const totalCount = enriched.length;
    const completedCount = enriched.filter(h => h.completedToday).length;

    return res.status(200).json({
      success: true,
      summary: {
        total: totalCount,
        completedToday: completedCount,
        completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      },
      habits: enriched
    });
  } catch (err) {
    next(err);
  }
};

export const createHabit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { title, category, description, targetDaysPerWeek } = req.body;

    if (!title) return next(new AppError('Habit title is required', 400));

    const habit = await Habit.create({
      userId,
      title: title.trim(),
      category: category || 'anytime',
      description: description || '',
      targetDaysPerWeek: targetDaysPerWeek || 7,
      currentStreak: 0,
      bestStreak: 0,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      habit
    });
  } catch (err) {
    next(err);
  }
};

export const toggleHabitDay = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    const date = (req.body.date || new Date().toISOString().split('T')[0]) as string;

    const habit = await Habit.findOne({ _id: id, userId });
    if (!habit) return next(new AppError('Habit not found', 404));

    const existingLog = await HabitLog.findOne({ userId, habitId: id, date });

    if (existingLog) {
      if (existingLog.completed) {
        // Toggle to uncompleted
        await HabitLog.deleteOne({ _id: existingLog._id });
        habit.currentStreak = Math.max(0, habit.currentStreak - 1);
      } else {
        existingLog.completed = true;
        await existingLog.save();
        habit.currentStreak += 1;
      }
    } else {
      // Create completed log
      await HabitLog.create({
        userId,
        habitId: id,
        date,
        completed: true,
        completedAt: new Date()
      });
      habit.currentStreak += 1;
    }

    if (habit.currentStreak > habit.bestStreak) {
      habit.bestStreak = habit.currentStreak;
    }
    habit.lastCompletedDate = date;
    await habit.save();

    return res.status(200).json({
      success: true,
      habit
    });
  } catch (err) {
    next(err);
  }
};

export const deleteHabit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    await Habit.updateOne({ _id: id, userId }, { isActive: false });
    return res.status(200).json({
      success: true,
      message: 'Habit archived'
    });
  } catch (err) {
    next(err);
  }
};
