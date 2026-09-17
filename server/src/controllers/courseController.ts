import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Course } from '../models/Course';
import { Assignment } from '../models/Assignment';
import { Assessment } from '../models/Assessment';
import { StudyPlan } from '../models/StudyPlan';
import { AppError } from '../utils/AppError';

export const getCourses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const courses = await Course.find({ userId, status: 'active' }).sort({ createdAt: -1 });

    // Enrich courses with assignment and assessment counts
    const enriched = await Promise.all(
      courses.map(async course => {
        const assignmentsCount = await Assignment.countDocuments({
          userId,
          courseId: course._id,
          status: { $in: ['pending', 'in_progress'] }
        });

        const nextAssessment = await Assessment.findOne({
          userId,
          courseId: course._id,
          date: { $gte: new Date() }
        }).sort({ date: 1 });

        return {
          ...course.toObject(),
          pendingAssignmentsCount: assignmentsCount,
          nextAssessment: nextAssessment
            ? {
                title: nextAssessment.title,
                date: nextAssessment.date,
                daysRemaining: Math.ceil(
                  (new Date(nextAssessment.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
              }
            : null
        };
      })
    );

    return res.status(200).json({
      success: true,
      courses: enriched
    });
  } catch (err) {
    next(err);
  }
};

export const getCourseById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const course = await Course.findOne({ _id: id, userId });
    if (!course) return next(new AppError('Course not found', 404));

    const assignments = await Assignment.find({ userId, courseId: id }).sort({ dueDate: 1 });
    const assessments = await Assessment.find({ userId, courseId: id }).sort({ date: 1 });
    const studyPlans = await StudyPlan.find({ userId, courseId: id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      course,
      assignments,
      assessments,
      studyPlans
    });
  } catch (err) {
    next(err);
  }
};

export const createCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { name, code, instructor, credits, color, units } = req.body;

    if (!name || !code) {
      return next(new AppError('Course name and code are required', 400));
    }

    const existing = await Course.findOne({ userId, code: code.trim().toUpperCase() });
    if (existing) {
      return next(new AppError(`Course with code "${code}" already exists`, 409));
    }

    const course = await Course.create({
      userId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      instructor: instructor || '',
      credits: credits || 3,
      color: color || '#6366f1',
      units: units || []
    });

    return res.status(201).json({
      success: true,
      course
    });
  } catch (err) {
    next(err);
  }
};

export const updateCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const course = await Course.findOne({ _id: id, userId });
    if (!course) return next(new AppError('Course not found', 404));

    const fields = ['name', 'code', 'instructor', 'credits', 'color', 'units', 'status'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) (course as any)[f] = req.body[f];
    });

    await course.save();

    return res.status(200).json({
      success: true,
      course
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const course = await Course.findOneAndDelete({ _id: id, userId });
    if (!course) return next(new AppError('Course not found', 404));

    return res.status(200).json({
      success: true,
      message: 'Course removed'
    });
  } catch (err) {
    next(err);
  }
};
