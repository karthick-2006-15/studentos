import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Assignment } from '../models/Assignment';
import { Assessment } from '../models/Assessment';
import { Task } from '../models/Task';
import { CalendarEvent } from '../models/CalendarEvent';
import { AppError } from '../utils/AppError';

// Assignments
export const getAssignments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { status, courseId } = req.query;

    const filter: any = { userId };
    if (status && status !== 'all') filter.status = status;
    if (courseId) filter.courseId = courseId;

    const assignments = await Assignment.find(filter)
      .populate('courseId', 'name code color')
      .populate('associatedTaskId', 'status priority')
      .sort({ dueDate: 1 });

    return res.status(200).json({ success: true, assignments });
  } catch (err) {
    next(err);
  }
};

export const createAssignment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { courseId, title, description, dueDate, weight, estimatedMinutes } = req.body;

    if (!courseId || !title || !dueDate) {
      return next(new AppError('Course, title, and due date are required', 400));
    }

    const due = new Date(dueDate);

    // Create linked Task
    const task = await Task.create({
      userId,
      title: `Assignment: ${title}`,
      description: description || '',
      type: 'assignment',
      priority: 'high',
      dueDate: due,
      estimatedMinutes: estimatedMinutes || 90,
      courseId,
      source: 'assignment',
      tags: ['Assignment']
    });

    // Create linked CalendarEvent
    const calEvent = await CalendarEvent.create({
      userId,
      title: `📝 Due: ${title}`,
      description: description || '',
      startDate: due,
      endDate: new Date(due.getTime() + 60 * 60 * 1000),
      allDay: true,
      type: 'assignment',
      courseId,
      relatedTaskId: task._id,
      source: 'assignment'
    });

    const assignment = await Assignment.create({
      userId,
      courseId,
      title,
      description: description || '',
      dueDate: due,
      weight: weight || 10,
      estimatedMinutes: estimatedMinutes || 90,
      status: 'pending',
      associatedTaskId: task._id
    });

    const populated = await Assignment.findById(assignment._id).populate('courseId', 'name code color');

    return res.status(201).json({ success: true, assignment: populated });
  } catch (err) {
    next(err);
  }
};

export const updateAssignmentStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    const { status, submissionNotes } = req.body;

    const assignment = await Assignment.findOne({ _id: id, userId });
    if (!assignment) return next(new AppError('Assignment not found', 404));

    if (status) assignment.status = status;
    if (submissionNotes !== undefined) assignment.submissionNotes = submissionNotes;

    // Update linked task if marked submitted or completed
    if (assignment.associatedTaskId && (status === 'submitted' || status === 'completed')) {
      await Task.updateOne(
        { _id: assignment.associatedTaskId },
        { status: 'completed', completedAt: new Date() }
      );
    }

    await assignment.save();
    const populated = await Assignment.findById(assignment._id).populate('courseId', 'name code color');

    return res.status(200).json({ success: true, assignment: populated });
  } catch (err) {
    next(err);
  }
};

// Assessments
export const getAssessments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { courseId } = req.query;

    const filter: any = { userId };
    if (courseId) filter.courseId = courseId;

    const assessments = await Assessment.find(filter)
      .populate('courseId', 'name code color')
      .populate('associatedTaskId', 'status priority')
      .sort({ date: 1 });

    return res.status(200).json({ success: true, assessments });
  } catch (err) {
    next(err);
  }
};

export const createAssessment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { courseId, title, type, date, syllabus, weight } = req.body;

    if (!courseId || !title || !date) {
      return next(new AppError('Course, title, and exam date are required', 400));
    }

    const examDate = new Date(date);

    // Create task
    const task = await Task.create({
      userId,
      title: `Prepare for ${title}`,
      description: syllabus || '',
      type: 'assessment',
      priority: 'urgent',
      dueDate: examDate,
      estimatedMinutes: 120,
      courseId,
      source: 'assessment',
      tags: ['Exam', type || 'CAT']
    });

    // Create calendar event
    const calEvent = await CalendarEvent.create({
      userId,
      title: `🔴 Exam: ${title}`,
      description: syllabus || '',
      startDate: examDate,
      endDate: new Date(examDate.getTime() + 2 * 60 * 60 * 1000),
      allDay: false,
      type: 'assessment',
      courseId,
      relatedTaskId: task._id,
      source: 'assessment',
      color: '#ef4444'
    });

    const assessment = await Assessment.create({
      userId,
      courseId,
      title,
      type: type || 'cat',
      date: examDate,
      syllabus: syllabus || '',
      weight: weight || 25,
      associatedTaskId: task._id,
      associatedCalendarEventId: calEvent._id
    });

    const populated = await Assessment.findById(assessment._id).populate('courseId', 'name code color');

    return res.status(201).json({ success: true, assessment: populated });
  } catch (err) {
    next(err);
  }
};

export const updateAssessmentStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    const { preparationStatus, notes } = req.body;

    const assessment = await Assessment.findOne({ _id: id, userId });
    if (!assessment) return next(new AppError('Assessment not found', 404));

    if (preparationStatus) assessment.preparationStatus = preparationStatus;
    if (notes !== undefined) assessment.notes = notes;

    await assessment.save();
    const populated = await Assessment.findById(assessment._id).populate('courseId', 'name code color');

    return res.status(200).json({ success: true, assessment: populated });
  } catch (err) {
    next(err);
  }
};
