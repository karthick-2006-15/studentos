import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { CourseDocument } from '../models/CourseDocument';
import { Assignment } from '../models/Assignment';
import { Assessment } from '../models/Assessment';
import { Task } from '../models/Task';
import { CalendarEvent } from '../models/CalendarEvent';
import { Habit, HabitLog } from '../models/Habit';
import { StudyPlan, StudySession } from '../models/StudyPlan';
import { Integration } from '../models/Integration';
import { Notification, NotificationSettings } from '../models/Notification';
import { AIConversation } from '../models/AIConversation';

async function cleanDatabase() {
  console.log('[CleanDB] Connecting to MongoDB to purge all test data...');
  await connectDatabase();

  const collections = [
    { name: 'Users', model: User },
    { name: 'Courses', model: Course },
    { name: 'CourseDocuments', model: CourseDocument },
    { name: 'Assignments', model: Assignment },
    { name: 'Assessments', model: Assessment },
    { name: 'Tasks', model: Task },
    { name: 'CalendarEvents', model: CalendarEvent },
    { name: 'Habits', model: Habit },
    { name: 'HabitLogs', model: HabitLog },
    { name: 'StudyPlans', model: StudyPlan },
    { name: 'StudySessions', model: StudySession },
    { name: 'Integrations', model: Integration },
    { name: 'Notifications', model: Notification },
    { name: 'NotificationSettings', model: NotificationSettings },
    { name: 'AIConversations', model: AIConversation }
  ];

  console.log('[CleanDB] Starting collection purge...');

  for (const { name, model } of collections) {
    const m = model as mongoose.Model<any>;
    const countBefore = await m.countDocuments();
    const result = await m.deleteMany({});
    console.log(`[CleanDB] Purged ${name}: ${result.deletedCount} documents deleted (was ${countBefore}).`);
  }

  console.log('[CleanDB] Database purge complete. All collections are now completely clean (0 records).');
  await mongoose.disconnect();
  process.exit(0);
}

cleanDatabase().catch((err) => {
  console.error('[CleanDB] Error during database purge:', err);
  process.exit(1);
});
