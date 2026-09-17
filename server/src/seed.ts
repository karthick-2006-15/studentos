import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import { User } from './models/User';
import { Course } from './models/Course';
import { Assignment } from './models/Assignment';
import { Assessment } from './models/Assessment';
import { Task } from './models/Task';
import { CalendarEvent } from './models/CalendarEvent';
import { Habit, HabitLog } from './models/Habit';
import { Integration } from './models/Integration';
import { NotificationSettings } from './models/Notification';
import { calculateTaskPriorityScore } from './utils/priorityEngine';

async function seed() {
  await connectDatabase();
  console.log('[Seed] Connected to database. Seeding initial student environment...');

  // 1. Create or Find User
  let user = await User.findOne({ email: 'karthick@nexus.io' });
  if (!user) {
    user = await User.create({
      name: 'Karthick S',
      email: 'karthick@nexus.io',
      password: 'Password123!',
      college: 'SRM Institute of Science and Technology',
      major: 'B.Tech Computer Science & Engineering',
      semester: 5,
      graduationYear: 2026
    });
  }

  const userId = user._id;

  // Clean existing data for idempotency
  await Promise.all([
    Course.deleteMany({ userId }),
    Assignment.deleteMany({ userId }),
    Assessment.deleteMany({ userId }),
    Task.deleteMany({ userId }),
    CalendarEvent.deleteMany({ userId }),
    Habit.deleteMany({ userId }),
    HabitLog.deleteMany({ userId }),
    Integration.deleteMany({ userId }),
    NotificationSettings.deleteMany({ userId })
  ]);

  await NotificationSettings.create({ userId });

  // 2. Create Courses
  const dbms = await Course.create({
    userId,
    name: 'Database Management Systems',
    code: 'CS302',
    instructor: 'Dr. V. Ramanathan',
    credits: 4,
    color: '#6366f1',
    units: [
      {
        unitNumber: 1,
        title: 'ER Model & Relational Model',
        topics: ['Entity Relationships', 'Relational Constraints', 'Keys']
      },
      {
        unitNumber: 2,
        title: 'Relational Algebra & SQL',
        topics: ['Relational Operations', 'Subqueries', 'Aggregations', 'Views']
      },
      {
        unitNumber: 3,
        title: 'Database Design & Normalization',
        topics: ['Functional Dependencies', '1NF, 2NF, 3NF', 'BCNF']
      },
      {
        unitNumber: 4,
        title: 'Transaction Management & Concurrency',
        topics: ['ACID Properties', 'Two-Phase Locking', 'Deadlock Handling']
      },
      {
        unitNumber: 5,
        title: 'Indexing & Query Optimization',
        topics: ['B+ Trees', 'Hashing', 'Query Execution Plans']
      }
    ]
  });

  const dsa = await Course.create({
    userId,
    name: 'Data Structures & Algorithms',
    code: 'CS301',
    instructor: 'Prof. S. Meenakshi',
    credits: 4,
    color: '#10b981',
    units: [
      { unitNumber: 1, title: 'Linear Structures', topics: ['Arrays', 'Linked Lists', 'Stacks', 'Queues'] },
      { unitNumber: 2, title: 'Trees & Heaps', topics: ['Binary Search Trees', 'AVL', 'Binary Heaps'] },
      { unitNumber: 3, title: 'Graphs', topics: ['BFS', 'DFS', 'Dijkstra', 'Kruskal'] },
      { unitNumber: 4, title: 'Dynamic Programming', topics: ['Knapsack', 'LCS', 'DP on Trees'] },
      { unitNumber: 5, title: 'Advanced Algorithms', topics: ['Tries', 'Disjoint Set Union', 'Greedy'] }
    ]
  });

  const os = await Course.create({
    userId,
    name: 'Operating Systems',
    code: 'CS303',
    instructor: 'Dr. Anand Kumar',
    credits: 3,
    color: '#06b6d4',
    units: [
      { unitNumber: 1, title: 'Process Management', topics: ['Processes', 'Threads', 'CPU Scheduling'] },
      { unitNumber: 2, title: 'Process Synchronization', topics: ['Semaphores', 'Monitors', 'Classical IPC'] },
      { unitNumber: 3, title: 'Memory Management', topics: ['Paging', 'Segmentation', 'Virtual Memory'] }
    ]
  });

  // 3. Create Upcoming Assessments (CAT-1)
  const now = new Date();
  const catDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days
  catDate.setHours(10, 0, 0, 0);

  const cat1 = await Assessment.create({
    userId,
    courseId: dbms._id,
    title: 'DBMS CAT-1 Assessment',
    type: 'cat',
    date: catDate,
    syllabus: 'Unit 1 & Unit 2 (ER Models, Relational Algebra, SQL)',
    weight: 25,
    preparationStatus: 'reviewing'
  });

  // 4. Create Assignments
  const assignmentDueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow
  assignmentDueDate.setHours(23, 59, 0, 0);

  const dbmsAssignment = await Assignment.create({
    userId,
    courseId: dbms._id,
    title: 'DBMS SQL & Relational Algebra Sheet',
    description: 'Solve Complex Joins and Relational Algebra expressions for Schema 3.',
    dueDate: assignmentDueDate,
    weight: 10,
    estimatedMinutes: 90,
    status: 'in_progress'
  });

  // 5. Create Prioritized Unified Tasks
  const taskData = [
    {
      title: 'DBMS CAT-1 Preparation (Unit 1 & 2)',
      type: 'assessment',
      priority: 'urgent',
      dueDate: catDate,
      estimatedMinutes: 120,
      courseId: dbms._id,
      source: 'assessment',
      academicWeight: 25
    },
    {
      title: 'Complete DBMS SQL Assignment',
      type: 'assignment',
      priority: 'high',
      dueDate: assignmentDueDate,
      estimatedMinutes: 90,
      courseId: dbms._id,
      source: 'assignment',
      academicWeight: 10
    },
    {
      title: 'Solve 2 Graph Problems on LeetCode',
      type: 'coding',
      priority: 'medium',
      dueDate: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      estimatedMinutes: 45,
      courseId: dsa._id,
      source: 'leetcode'
    },
    {
      title: 'Operating Systems Process Scheduling Notes',
      type: 'study',
      priority: 'medium',
      dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      estimatedMinutes: 60,
      courseId: os._id,
      source: 'study_plan'
    }
  ];

  for (const td of taskData) {
    const priority = calculateTaskPriorityScore(td as any, { academicWeight: td.academicWeight });
    await Task.create({
      userId,
      title: td.title,
      type: td.type,
      priority: td.priority,
      status: 'todo',
      dueDate: td.dueDate,
      estimatedMinutes: td.estimatedMinutes,
      courseId: td.courseId,
      source: td.source,
      calculatedScore: priority.score,
      priorityReason: priority.reason
    });
  }

  // 6. Create Calendar Events
  await CalendarEvent.create({
    userId,
    title: '🔴 DBMS CAT-1 Exam',
    description: 'Unit 1 & Unit 2',
    startDate: catDate,
    endDate: new Date(catDate.getTime() + 90 * 60 * 1000),
    allDay: false,
    type: 'assessment',
    courseId: dbms._id,
    source: 'assessment',
    color: '#ef4444'
  });

  await CalendarEvent.create({
    userId,
    title: '📝 Due: DBMS SQL Assignment',
    description: 'Submit on portal',
    startDate: assignmentDueDate,
    endDate: new Date(assignmentDueDate.getTime() + 30 * 60 * 1000),
    allDay: true,
    type: 'assignment',
    courseId: dbms._id,
    source: 'assignment',
    color: '#f59e0b'
  });

  // 7. Create Daily Habits
  const habitItems = [
    { title: 'Wake up before 7:00 AM', category: 'morning', currentStreak: 8, bestStreak: 14 },
    { title: 'Morning Workout & Hydration', category: 'morning', currentStreak: 5, bestStreak: 12 },
    { title: 'LeetCode Daily Problem', category: 'study', currentStreak: 12, bestStreak: 21 },
    { title: 'College Course Handout Review', category: 'study', currentStreak: 4, bestStreak: 9 },
    { title: 'Limit Screen Time after 10:30 PM', category: 'night', currentStreak: 6, bestStreak: 10 },
    { title: 'Sleep by 11:30 PM', category: 'night', currentStreak: 5, bestStreak: 8 }
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  for (const h of habitItems) {
    const habit = await Habit.create({
      userId,
      title: h.title,
      category: h.category,
      targetDaysPerWeek: 7,
      currentStreak: h.currentStreak,
      bestStreak: h.bestStreak,
      lastCompletedDate: todayStr,
      isActive: true
    });

    // Seed log for today
    await HabitLog.create({
      userId,
      habitId: habit._id,
      date: todayStr,
      completed: true
    });
  }

  // 8. Create Integration Data
  await Integration.create({
    userId,
    github: {
      connected: true,
      username: 'karthick-cs',
      lastSyncedAt: new Date(),
      reposCount: 14,
      weeklyCommits: 18,
      totalCommitsYear: 280,
      recentRepos: [
        {
          name: 'nexus-student-os',
          description: 'AI-powered minimalist student operating system',
          language: 'TypeScript',
          stars: 12,
          updatedAt: new Date().toISOString(),
          url: 'https://github.com'
        },
        {
          name: 'dbms-btree-engine',
          description: 'B+ Tree query index simulator in C++',
          language: 'C++',
          stars: 8,
          updatedAt: new Date().toISOString(),
          url: 'https://github.com'
        }
      ],
      languages: [
        { name: 'TypeScript', percentage: 48 },
        { name: 'C++', percentage: 32 },
        { name: 'Python', percentage: 20 }
      ]
    },
    leetcode: {
      connected: true,
      username: 'karthick_dsa',
      lastSyncedAt: new Date(),
      totalSolved: 154,
      easySolved: 74,
      mediumSolved: 66,
      hardSolved: 14,
      ranking: 124500,
      streak: 12,
      totalActiveDays: 85,
      recentSubmissions: [
        { id: '1', title: 'Course Schedule II', titleSlug: 'course-schedule-ii', timestamp: Date.now() - 3600000 },
        { id: '2', title: 'Lowest Common Ancestor', titleSlug: 'lowest-common-ancestor-of-a-binary-tree', timestamp: Date.now() - 86400000 }
      ],
      topicStats: [
        { tagName: 'Arrays', problemsSolved: 42 },
        { tagName: 'Trees', problemsSolved: 31 },
        { tagName: 'Dynamic Programming', problemsSolved: 24 },
        { tagName: 'Graphs', problemsSolved: 18 },
        { tagName: 'Strings', problemsSolved: 26 }
      ],
      weaknessAnalysis: {
        summary: 'Strong mastery in Arrays and Trees. Practice Graph Cycle Detection and DP on Trees this week.',
        recommendedTopics: ['Graph Theory', 'Dynamic Programming'],
        suggestedProblemCount: 2
      }
    },
    spotify: {
      connected: false
    }
  });

  console.log('[Seed] Database seeded successfully for student: Karthick S (karthick@nexus.io)');
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed] Seeding error:', err);
  process.exit(1);
});
