import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CalendarEvent } from '../models/CalendarEvent';
import { AppError } from '../utils/AppError';

export const getEvents = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { start, end, type } = req.query;

    const filter: any = { userId };

    if (start && end) {
      filter.startDate = { $gte: new Date(start as string), $lte: new Date(end as string) };
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    const events = await CalendarEvent.find(filter)
      .populate('courseId', 'name code color')
      .populate('relatedTaskId', 'title status priority')
      .sort({ startDate: 1 });

    return res.status(200).json({
      success: true,
      events
    });
  } catch (err) {
    next(err);
  }
};

export const createEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { title, description, startDate, endDate, allDay, type, courseId, relatedTaskId, color } = req.body;

    if (!title || !startDate || !endDate) {
      return next(new AppError('Title, start date, and end date are required', 400));
    }

    // Check for conflict
    const start = new Date(startDate);
    const end = new Date(endDate);

    const conflict = await CalendarEvent.findOne({
      userId,
      $or: [
        { startDate: { $lt: end, $gte: start } },
        { endDate: { $gt: start, $lte: end } }
      ]
    });

    const event = await CalendarEvent.create({
      userId,
      title,
      description: description || '',
      startDate: start,
      endDate: end,
      allDay: Boolean(allDay),
      type: type || 'personal',
      courseId: courseId || undefined,
      relatedTaskId: relatedTaskId || undefined,
      source: 'manual',
      color: color || '#6366f1'
    });

    const populated = await CalendarEvent.findById(event._id)
      .populate('courseId', 'name code color')
      .populate('relatedTaskId', 'title status priority');

    return res.status(201).json({
      success: true,
      event: populated,
      hasConflict: Boolean(conflict),
      conflictingEventTitle: conflict?.title
    });
  } catch (err) {
    next(err);
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const event = await CalendarEvent.findOne({ _id: id, userId });
    if (!event) return next(new AppError('Calendar event not found', 404));

    const fields = ['title', 'description', 'startDate', 'endDate', 'allDay', 'type', 'courseId', 'color'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        (event as any)[field] = req.body[field];
      }
    });

    await event.save();
    const populated = await CalendarEvent.findById(event._id)
      .populate('courseId', 'name code color')
      .populate('relatedTaskId', 'title status priority');

    return res.status(200).json({
      success: true,
      event: populated
    });
  } catch (err) {
    next(err);
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const event = await CalendarEvent.findOneAndDelete({ _id: id, userId });
    if (!event) return next(new AppError('Calendar event not found', 404));

    return res.status(200).json({
      success: true,
      message: 'Calendar event deleted'
    });
  } catch (err) {
    next(err);
  }
};
