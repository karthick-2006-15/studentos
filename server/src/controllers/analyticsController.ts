import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { analyticsService } from '../services/analyticsService';

export const getAcademicWorkload = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const data = await analyticsService.getWorkloadScore(userId!);

    return res.status(200).json({
      success: true,
      workload: data
    });
  } catch (err) {
    next(err);
  }
};

export const getWeeklyStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const data = await analyticsService.getWeeklyAnalytics(userId!);

    return res.status(200).json({
      success: true,
      analytics: data
    });
  } catch (err) {
    next(err);
  }
};
