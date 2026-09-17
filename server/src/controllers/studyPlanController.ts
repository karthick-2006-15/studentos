import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { StudyPlan, StudySession } from '../models/StudyPlan';
import { Task } from '../models/Task';
import { studyPlanService } from '../services/studyPlanService';
import { AppError } from '../utils/AppError';

export const generateStudyPlan = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { courseId, examDate, dailyAvailableMinutes, preferredStudyTime } = req.body;

    if (!courseId || !examDate) {
      return next(new AppError('Course ID and exam date are required', 400));
    }

    const plan = await studyPlanService.generatePlan(userId!, {
      courseId,
      examDate,
      dailyAvailableMinutes: dailyAvailableMinutes ? parseInt(dailyAvailableMinutes, 10) : 60,
      preferredStudyTime: preferredStudyTime || 'evening'
    });

    const populated = await StudyPlan.findById(plan._id).populate('courseId', 'name code color');

    return res.status(201).json({
      success: true,
      message: 'AI study plan created and synced to calendar',
      plan: populated
    });
  } catch (err) {
    next(err);
  }
};

export const getStudyPlans = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { courseId } = req.query;

    const filter: any = { userId, status: 'active' };
    if (courseId) filter.courseId = courseId;

    const plans = await StudyPlan.find(filter)
      .populate('courseId', 'name code color')
      .populate('days.taskId', 'status priority')
      .sort({ examDate: 1 });

    return res.status(200).json({
      success: true,
      plans
    });
  } catch (err) {
    next(err);
  }
};

export const logFocusSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { taskId, courseId, taskTitle, durationMinutes, musicTrack, notes, markTaskComplete } = req.body;

    if (!durationMinutes) {
      return next(new AppError('Duration is required to log a focus session', 400));
    }

    const session = await StudySession.create({
      userId,
      taskId: taskId || undefined,
      courseId: courseId || undefined,
      taskTitle: taskTitle || 'Deep Focus Session',
      durationMinutes: parseInt(durationMinutes, 10),
      musicTrack: musicTrack || 'NEXUS Focus Audio',
      notes: notes || '',
      startedAt: new Date(Date.now() - durationMinutes * 60 * 1000),
      endedAt: new Date()
    });

    if (taskId && markTaskComplete) {
      await Task.updateOne(
        { _id: taskId, userId },
        { status: 'completed', completedAt: new Date() }
      );
    }

    return res.status(201).json({
      success: true,
      message: `Focused for ${durationMinutes} minutes!`,
      session
    });
  } catch (err) {
    next(err);
  }
};

export const getFocusHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const sessions = await StudySession.find({ userId })
      .populate('courseId', 'name code color')
      .sort({ startedAt: -1 })
      .limit(30);

    const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    return res.status(200).json({
      success: true,
      totalMinutes,
      sessions
    });
  } catch (err) {
    next(err);
  }
};
