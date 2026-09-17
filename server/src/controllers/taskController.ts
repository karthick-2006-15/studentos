import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Task } from '../models/Task';
import { Course } from '../models/Course';
import { calculateTaskPriorityScore } from '../utils/priorityEngine';
import { AppError } from '../utils/AppError';

export const getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { status, type, priority, date } = req.query;

    const filter: any = { userId };

    if (status === 'todo') {
      filter.status = { $in: ['todo', 'in_progress'] };
    } else if (status === 'completed') {
      filter.status = 'completed';
    } else if (status && status !== 'all') {
      filter.status = status;
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    if (date === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      filter.$or = [
        { dueDate: { $gte: startOfDay, $lte: endOfDay } },
        { dueDate: { $lt: startOfDay }, status: { $in: ['todo', 'in_progress'] } }, // include overdue
        { dueDate: null }
      ];
    }

    const tasks = await Task.find(filter)
      .populate('courseId', 'name code color')
      .sort({ status: 1, calculatedScore: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      tasks
    });
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { title, description, type, priority, dueDate, estimatedMinutes, courseId, tags, recurrence } = req.body;

    if (!title) {
      return next(new AppError('Task title is required', 400));
    }

    const priorityResult = calculateTaskPriorityScore({
      title,
      type: type || 'task',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedMinutes: estimatedMinutes || 30
    });

    const task = await Task.create({
      userId,
      title,
      description: description || '',
      type: type || 'task',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedMinutes: estimatedMinutes || 30,
      courseId: courseId || undefined,
      tags: tags || [],
      recurrence: recurrence || 'none',
      calculatedScore: priorityResult.score,
      priorityReason: priorityResult.reason,
      status: 'todo'
    });

    const populated = await Task.findById(task._id).populate('courseId', 'name code color');

    return res.status(201).json({
      success: true,
      task: populated
    });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const fields = ['title', 'description', 'type', 'priority', 'dueDate', 'estimatedMinutes', 'courseId', 'tags', 'recurrence', 'status'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        (task as any)[field] = req.body[field];
      }
    });

    if (task.status === 'completed' && !task.completedAt) {
      task.completedAt = new Date();
    } else if (task.status !== 'completed') {
      task.completedAt = undefined;
    }

    // Recalculate score
    const priorityResult = calculateTaskPriorityScore(task);
    task.calculatedScore = priorityResult.score;
    task.priorityReason = priorityResult.reason;

    await task.save();
    const populated = await Task.findById(task._id).populate('courseId', 'name code color');

    return res.status(200).json({
      success: true,
      task: populated
    });
  } catch (err) {
    next(err);
  }
};

export const toggleTaskComplete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    const isNowCompleted = task.status !== 'completed';
    task.status = isNowCompleted ? 'completed' : 'todo';
    task.completedAt = isNowCompleted ? new Date() : undefined;

    await task.save();
    const populated = await Task.findById(task._id).populate('courseId', 'name code color');

    return res.status(200).json({
      success: true,
      task: populated
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const task = await Task.findOneAndDelete({ _id: id, userId });
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const rolloverTasksToTomorrow = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    // Find all incomplete tasks due today or overdue
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0); // 6:00 PM tomorrow

    const result = await Task.updateMany(
      {
        userId,
        status: { $in: ['todo', 'in_progress'] },
        dueDate: { $lte: endOfToday }
      },
      {
        $set: { dueDate: tomorrow }
      }
    );

    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} unfinished tasks moved to tomorrow`,
      count: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
};
