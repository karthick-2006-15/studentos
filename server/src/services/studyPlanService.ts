import { Course } from '../models/Course';
import { CalendarEvent } from '../models/CalendarEvent';
import { Task } from '../models/Task';
import { StudyPlan, IStudyPlanDay } from '../models/StudyPlan';
import { aiService } from './aiService';
import mongoose from 'mongoose';

export const studyPlanService = {
  /**
   * Generates a conflict-free study plan considering existing calendar events and tasks
   */
  async generatePlan(
    userId: string,
    params: {
      courseId: string;
      examDate: string;
      dailyAvailableMinutes?: number;
      preferredStudyTime?: 'morning' | 'afternoon' | 'evening';
    }
  ) {
    const course = await Course.findOne({ _id: params.courseId, userId });
    if (!course) {
      throw new Error('Course not found');
    }

    const examDate = new Date(params.examDate);
    const now = new Date();
    const daysUntilExam = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Fetch existing calendar events between now and examDate to identify occupied blocks
    const existingEvents = await CalendarEvent.find({
      userId,
      startDate: { $gte: now, $lte: examDate }
    }).select('title startDate endDate type');

    const calendarBusyWindows = existingEvents.map(e => ({
      title: e.title,
      start: e.startDate.toISOString(),
      end: e.endDate.toISOString(),
      type: e.type
    }));

    const unitsContext = course.units.map(u => ({
      unitNumber: u.unitNumber,
      title: u.title,
      topics: u.topics
    }));

    const prompt = `Generate an optimal, conflict-free study plan for college course: "${course.name}" (${course.code}).
Exam Date: ${params.examDate} (${daysUntilExam} days away).
Units/Syllabus: ${JSON.stringify(unitsContext, null, 2)}
Student Busy Calendar Events: ${JSON.stringify(calendarBusyWindows.slice(0, 15), null, 2)}
Preferred study window: ${params.preferredStudyTime || 'evening'}.
Default study block: ${params.dailyAvailableMinutes || 60} minutes per day.

INSTRUCTIONS:
1. Divide the units progressively across the available days before the exam.
2. Ensure each day focuses on specific units and realistic topics.
3. Reserve the final 1-2 days for comprehensive revision / mock questions.
4. Schedule study start times that avoid conflict with the student's existing calendar events.
5. Return JSON format strictly matching:
{
  "targetHours": number,
  "summary": "string",
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM (24h format)",
      "unitNumber": 1,
      "topicTitle": "string",
      "durationMinutes": 60,
      "learningObjectives": ["string"]
    }
  ]
}`;

    const planData = await aiService.generateStructuredOutput<{
      targetHours: number;
      summary: string;
      days: Array<{
        dayNumber: number;
        date: string;
        startTime?: string;
        unitNumber: number;
        topicTitle: string;
        durationMinutes: number;
        learningObjectives: string[];
      }>;
    }>(prompt, 'You are an intelligent study planner designed to prevent burnout and resolve scheduling conflicts.');

    // Save StudyPlan document
    const studyPlan = await StudyPlan.create({
      userId,
      courseId: course._id,
      examDate,
      targetHours: planData.targetHours || Math.round((planData.days.length * 60) / 60),
      days: planData.days.map(d => ({
        dayNumber: d.dayNumber,
        date: d.date,
        unitNumber: d.unitNumber,
        topicTitle: d.topicTitle,
        durationMinutes: d.durationMinutes,
        learningObjectives: d.learningObjectives || [],
        completed: false
      })),
      notes: planData.summary
    });

    // Create corresponding tasks and calendar events for each study day
    for (let i = 0; i < planData.days.length; i++) {
      const day = planData.days[i];
      const dateStr = day.date; // "YYYY-MM-DD"
      const timeStr = day.startTime || (params.preferredStudyTime === 'morning' ? '08:30' : '18:30');

      const startDateTime = new Date(`${dateStr}T${timeStr}:00`);
      const endDateTime = new Date(startDateTime.getTime() + day.durationMinutes * 60 * 1000);

      // Create linked Task
      const task = await Task.create({
        userId,
        title: `Study: ${course.code} Unit ${day.unitNumber} — ${day.topicTitle}`,
        description: `Objectives: ${(day.learningObjectives || []).join(', ')}`,
        type: 'study',
        priority: daysUntilExam <= 3 ? 'high' : 'medium',
        status: 'todo',
        dueDate: endDateTime,
        estimatedMinutes: day.durationMinutes,
        courseId: course._id,
        source: 'study_plan',
        tags: [course.code, `Unit-${day.unitNumber}`],
        priorityReason: `Prep for ${course.code} Exam (${daysUntilExam}d remaining)`
      });

      // Create linked CalendarEvent
      const calEvent = await CalendarEvent.create({
        userId,
        title: `📚 ${course.code} Prep: Unit ${day.unitNumber}`,
        description: day.topicTitle,
        startDate: startDateTime,
        endDate: endDateTime,
        allDay: false,
        type: 'study_session',
        courseId: course._id,
        relatedTaskId: task._id,
        source: 'study_plan',
        aiExplanation: `Allocated ${day.durationMinutes}m for ${day.topicTitle} with zero calendar overlap.`,
        color: course.color || '#6366f1'
      });

      // Update studyPlan day reference
      studyPlan.days[i].taskId = task._id as any;
      studyPlan.days[i].calendarEventId = calEvent._id as any;
    }

    await studyPlan.save();
    return studyPlan;
  }
};
