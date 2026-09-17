import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Task } from '../models/Task';
import { Course } from '../models/Course';
import { Assignment } from '../models/Assignment';
import { Assessment } from '../models/Assessment';
import { CalendarEvent } from '../models/CalendarEvent';
import { Habit, HabitLog } from '../models/Habit';
import { Integration } from '../models/Integration';
import { StudySession } from '../models/StudyPlan';
import { AIConversation } from '../models/AIConversation';
import { aiService } from '../services/aiService';
import { calculateTaskPriorityScore } from '../utils/priorityEngine';
import { analyticsService } from '../services/analyticsService';
import { AppError } from '../utils/AppError';

export const chatWithAssistant = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { message, conversationId } = req.body;

    if (!message) return next(new AppError('Message is required', 400));

    // Fetch real application context for the user
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [tasks, assignments, assessments, habits, integration, workload] = await Promise.all([
      Task.find({ userId, status: { $in: ['todo', 'in_progress'] } })
        .populate('courseId', 'name code')
        .sort({ calculatedScore: -1 })
        .limit(10),
      Assignment.find({ userId, dueDate: { $gte: now, $lte: next7Days }, status: { $in: ['pending', 'in_progress'] } })
        .populate('courseId', 'name code')
        .sort({ dueDate: 1 }),
      Assessment.find({ userId, date: { $gte: now, $lte: next7Days } })
        .populate('courseId', 'name code')
        .sort({ date: 1 }),
      Habit.find({ userId, isActive: true }),
      Integration.findOne({ userId }),
      analyticsService.getWorkloadScore(userId!)
    ]);

    const systemPrompt = `You are NEXUS AI, the intelligent minimalist operating system assistant for college students.
Current Date/Time: ${now.toUTCString()}.
STUDENT CONTEXT:
- Pending High Priority Tasks: ${JSON.stringify(
      tasks.map(t => ({
        id: t._id,
        title: t.title,
        priority: t.priority,
        score: t.calculatedScore,
        dueDate: t.dueDate,
        reason: t.priorityReason
      })),
      null,
      2
    )}
- Upcoming Assignments (Next 7 days): ${JSON.stringify(
      assignments.map(a => ({
        id: a._id,
        course: (a.courseId as any)?.code,
        title: a.title,
        dueDate: a.dueDate,
        weight: a.weight
      })),
      null,
      2
    )}
- Upcoming Assessments (Next 7 days): ${JSON.stringify(
      assessments.map(e => ({
        id: e._id,
        course: (e.courseId as any)?.code,
        title: e.title,
        date: e.date,
        syllabus: e.syllabus
      })),
      null,
      2
    )}
- Habits: ${JSON.stringify(habits.map(h => ({ title: h.title, streak: h.currentStreak, category: h.category })))}
- Coding Status: LeetCode solved: ${integration?.leetcode?.totalSolved || 0} (${integration?.leetcode?.streak || 0}d streak), GitHub: ${integration?.github?.weeklyCommits || 0} commits this week.
- Academic Workload: ${workload.workloadScore}% (${workload.level}).

BEHAVIOR GUIDELINES:
1. Always base answers on the student's actual tasks, deadlines, and metrics above.
2. Be concise, calm, technical, and direct. Avoid fluffy filler words or cartoon excitement.
3. If the user asks to perform an action like "Create task <title>", "Move unfinished tasks to tomorrow", identify the structured action.
4. If you suggest an actionable change (e.g. creating a task or moving tasks), return a tool action payload if applicable.`;

    const response = await aiService.generateCompletion(
      [{ role: 'user', content: message }],
      { systemPrompt, temperature: 0.3 }
    );

    // If user asked to rollover tasks or create task, detect and handle
    let actionExecuted = null;
    const lower = message.toLowerCase();

    if (lower.includes('move') && (lower.includes('tomorrow') || lower.includes('rollover'))) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);

      const modified = await Task.updateMany(
        { userId, status: { $in: ['todo', 'in_progress'] }, dueDate: { $lte: endOfDay } },
        { $set: { dueDate: tomorrow } }
      );
      actionExecuted = {
        action: 'rollover_tasks',
        description: `Moved ${modified.modifiedCount} unfinished tasks to tomorrow.`
      };
    } else if (lower.startsWith('create task') || lower.startsWith('add task')) {
      const taskTitle = message.replace(/^(create task|add task)\s*:?/i, '').trim();
      if (taskTitle) {
        const priorityRes = calculateTaskPriorityScore({ title: taskTitle, type: 'task', priority: 'medium' });
        const newTask = await Task.create({
          userId,
          title: taskTitle,
          type: 'task',
          priority: 'medium',
          status: 'todo',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          calculatedScore: priorityRes.score,
          priorityReason: priorityRes.reason
        });
        actionExecuted = {
          action: 'create_task',
          task: newTask
        };
      }
    }

    // Persist conversation
    let conv = conversationId ? await AIConversation.findOne({ _id: conversationId, userId }) : null;
    if (!conv) {
      conv = await AIConversation.create({
        userId,
        title: message.slice(0, 30),
        messages: []
      });
    }

    conv.messages.push({
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    conv.messages.push({
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: response,
      toolCalls: actionExecuted ? [actionExecuted as any] : undefined,
      timestamp: new Date()
    });

    await conv.save();

    return res.status(200).json({
      success: true,
      conversationId: conv._id,
      response,
      action: actionExecuted
    });
  } catch (err) {
    next(err);
  }
};

export const getDailyBriefing = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [todayTasks, upcomingDeadlines, habits, integration] = await Promise.all([
      Task.find({
        userId,
        status: { $in: ['todo', 'in_progress'] },
        $or: [{ dueDate: { $lte: endOfDay } }, { dueDate: null }]
      })
        .populate('courseId', 'name code')
        .sort({ calculatedScore: -1 })
        .limit(5),
      Assignment.find({
        userId,
        status: { $in: ['pending', 'in_progress'] },
        dueDate: { $gte: now, $lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) }
      })
        .populate('courseId', 'name code')
        .sort({ dueDate: 1 }),
      Habit.find({ userId, isActive: true }),
      Integration.findOne({ userId })
    ]);

    const briefing = {
      greeting: getGreeting(now.getHours()),
      dateStr: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      priorities: todayTasks.map(t => ({
        id: t._id,
        title: t.title,
        priority: t.priority,
        score: t.calculatedScore,
        reason: t.priorityReason || 'High Priority'
      })),
      upcomingDeadlinesCount: upcomingDeadlines.length,
      nextDeadline: upcomingDeadlines[0]
        ? {
            title: upcomingDeadlines[0].title,
            course: (upcomingDeadlines[0].courseId as any)?.code || 'Academic',
            dueDate: upcomingDeadlines[0].dueDate
          }
        : null,
      codingSnapshot: {
        commitsThisWeek: integration?.github?.weeklyCommits || 0,
        leetcodeSolved: integration?.leetcode?.totalSolved || 0,
        streak: integration?.leetcode?.streak || 0
      },
      habitsCount: habits.length
    };

    return res.status(200).json({
      success: true,
      briefing
    });
  } catch (err) {
    next(err);
  }
};

export const getEveningReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [completedToday, remainingTasks, sessionsToday, habits] = await Promise.all([
      Task.find({ userId, status: 'completed', completedAt: { $gte: startOfDay } }),
      Task.find({ userId, status: { $in: ['todo', 'in_progress'] } }),
      StudySession.find({ userId, startedAt: { $gte: startOfDay } }),
      Habit.find({ userId, isActive: true })
    ]);

    const studyMinutes = sessionsToday.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    return res.status(200).json({
      success: true,
      review: {
        completedCount: completedToday.length,
        remainingCount: remainingTasks.length,
        studyMinutes,
        totalHabits: habits.length,
        remainingTasks: remainingTasks.slice(0, 5).map(t => ({ id: t._id, title: t.title }))
      }
    });
  } catch (err) {
    next(err);
  }
};

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
