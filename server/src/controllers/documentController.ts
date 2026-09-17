import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CourseDocument } from '../models/CourseDocument';
import { Course } from '../models/Course';
import { Assignment } from '../models/Assignment';
import { Assessment } from '../models/Assessment';
import { Task } from '../models/Task';
import { CalendarEvent } from '../models/CalendarEvent';
import { documentParserService } from '../services/documentParserService';
import { aiService } from '../services/aiService';
import { calculateTaskPriorityScore } from '../utils/priorityEngine';
import { AppError } from '../utils/AppError';
import path from 'path';

export const uploadAndAnalyzeDocument = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    if (!req.file) {
      return next(new AppError('No document file uploaded', 400));
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const fileType = ['jpg', 'jpeg', 'png'].includes(ext) ? 'image' : (ext as any);

    // Create initial CourseDocument record
    const courseDoc = await CourseDocument.create({
      userId,
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileType,
      fileSize: file.size,
      status: 'analyzing'
    });

    try {
      // 1. Extract raw text from file
      const rawText = await documentParserService.extractText(file.path, fileType);
      courseDoc.extractedText = rawText;

      // 2. AI Structured Extraction
      const extractedData = await aiService.extractCourseHandout(rawText);
      courseDoc.extractedData = extractedData;
      courseDoc.status = 'preview_ready';
      await courseDoc.save();

      return res.status(200).json({
        success: true,
        message: 'Handout parsed successfully. Please review the extracted information.',
        documentId: courseDoc._id,
        preview: extractedData
      });
    } catch (parseErr: any) {
      courseDoc.status = 'failed';
      courseDoc.errorMessage = parseErr.message;
      await courseDoc.save();
      return next(new AppError(`Handout analysis failed: ${parseErr.message}`, 500));
    }
  } catch (err) {
    next(err);
  }
};

export const getDocumentPreview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const doc = await CourseDocument.findOne({ _id: id, userId });
    if (!doc) return next(new AppError('Document not found', 404));

    return res.status(200).json({
      success: true,
      document: doc
    });
  } catch (err) {
    next(err);
  }
};

export const confirmDocumentExtraction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    const { courseName, courseCode, instructor, units, assignments, assessments } = req.body;

    const doc = await CourseDocument.findOne({ _id: id, userId });
    if (!doc) return next(new AppError('Document not found', 404));

    if (doc.status === 'confirmed') {
      return next(new AppError('This document has already been confirmed and processed.', 400));
    }

    const finalCode = (courseCode || doc.extractedData?.courseCode || 'COURSE').trim().toUpperCase();
    const finalName = (courseName || doc.extractedData?.courseName || 'New Course').trim();
    const finalInstructor = instructor || doc.extractedData?.instructor || '';
    const finalUnits = units || doc.extractedData?.units || [];
    const finalAssignments = assignments || doc.extractedData?.assignments || [];
    const finalAssessments = assessments || doc.extractedData?.assessments || [];

    // 1. Create Course (or update if code exists for user)
    let course = await Course.findOne({ userId, code: finalCode });
    if (!course) {
      course = await Course.create({
        userId,
        name: finalName,
        code: finalCode,
        instructor: finalInstructor,
        credits: 3,
        color: '#6366f1',
        units: finalUnits
      });
    } else {
      course.units = finalUnits;
      if (finalName) course.name = finalName;
      await course.save();
    }

    doc.courseId = course._id;

    // 2. Process Assignments -> Create Assignment + Task + CalendarEvent
    const createdAssignments = [];
    for (const a of finalAssignments) {
      const dueDate = a.dueDate ? new Date(a.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create linked Task
      const priorityResult = calculateTaskPriorityScore(
        {
          title: `${course.code}: ${a.title}`,
          type: 'assignment',
          dueDate,
          estimatedMinutes: a.estimatedMinutes || 90
        },
        { academicWeight: a.weight || 10 }
      );

      const task = await Task.create({
        userId,
        title: `${course.code}: ${a.title}`,
        description: a.description || `Assignment for ${course.name}`,
        type: 'assignment',
        priority: priorityResult.score > 70 ? 'urgent' : priorityResult.score > 50 ? 'high' : 'medium',
        status: 'todo',
        dueDate,
        estimatedMinutes: a.estimatedMinutes || 90,
        courseId: course._id,
        source: 'assignment',
        tags: [course.code, 'Assignment'],
        calculatedScore: priorityResult.score,
        priorityReason: priorityResult.reason
      });

      // Create Assignment record
      const assignment = await Assignment.create({
        userId,
        courseId: course._id,
        title: a.title,
        description: a.description || '',
        dueDate,
        weight: a.weight || 10,
        estimatedMinutes: a.estimatedMinutes || 90,
        status: 'pending',
        associatedTaskId: task._id
      });

      // Create CalendarEvent
      await CalendarEvent.create({
        userId,
        title: `📝 ${course.code} Due: ${a.title}`,
        description: a.description || '',
        startDate: dueDate,
        endDate: new Date(dueDate.getTime() + 60 * 60 * 1000),
        allDay: true,
        type: 'assignment',
        courseId: course._id,
        relatedTaskId: task._id,
        source: 'assignment',
        color: '#f59e0b'
      });

      createdAssignments.push(assignment);
    }

    // 3. Process Assessments -> Create Assessment + Task + CalendarEvent
    const createdAssessments = [];
    for (const exam of finalAssessments) {
      const examDate = exam.date ? new Date(exam.date) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const priorityResult = calculateTaskPriorityScore(
        {
          title: `Prep: ${course.code} ${exam.title}`,
          type: 'assessment',
          dueDate: examDate,
          estimatedMinutes: 120
        },
        { academicWeight: exam.weight || 25, isAssessmentSoon: true }
      );

      // Create preparation Task
      const task = await Task.create({
        userId,
        title: `Prep: ${course.code} ${exam.title}`,
        description: `Covers: ${exam.syllabus || 'Syllabus units'}`,
        type: 'assessment',
        priority: 'urgent',
        status: 'todo',
        dueDate: examDate,
        estimatedMinutes: 120,
        courseId: course._id,
        source: 'assessment',
        tags: [course.code, 'Exam', exam.type || 'CAT'],
        calculatedScore: priorityResult.score,
        priorityReason: `Exam Assessment (${exam.weight || 25}%)`
      });

      // Create CalendarEvent for the Exam
      const calEvent = await CalendarEvent.create({
        userId,
        title: `🔴 ${course.code} Exam: ${exam.title}`,
        description: `Syllabus: ${exam.syllabus || 'All Units'}`,
        startDate: examDate,
        endDate: new Date(examDate.getTime() + 2 * 60 * 60 * 1000),
        allDay: false,
        type: 'assessment',
        courseId: course._id,
        relatedTaskId: task._id,
        source: 'assessment',
        color: '#ef4444'
      });

      const assessment = await Assessment.create({
        userId,
        courseId: course._id,
        title: exam.title,
        type: exam.type || 'cat',
        date: examDate,
        syllabus: exam.syllabus || '',
        weight: exam.weight || 25,
        associatedTaskId: task._id,
        associatedCalendarEventId: calEvent._id
      });

      createdAssessments.push(assessment);
    }

    doc.status = 'confirmed';
    await doc.save();

    return res.status(200).json({
      success: true,
      message: `Course "${course.name}" (${course.code}) configured with ${createdAssignments.length} assignments and ${createdAssessments.length} assessments.`,
      course,
      assignments: createdAssignments,
      assessments: createdAssessments
    });
  } catch (err) {
    next(err);
  }
};
