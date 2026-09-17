export interface User {
  id: string;
  name: string;
  email: string;
  college?: string;
  major?: string;
  semester?: number;
  graduationYear?: number;
  preferences?: {
    theme: 'dark' | 'light' | 'system';
    quietHoursStart: string;
    quietHoursEnd: string;
    enablePush: boolean;
  };
}

export interface Course {
  _id: string;
  name: string;
  code: string;
  instructor?: string;
  credits?: number;
  color?: string;
  units: Array<{
    unitNumber: number;
    title: string;
    topics: string[];
    learningObjectives?: string[];
  }>;
  pendingAssignmentsCount?: number;
  nextAssessment?: {
    title: string;
    date: string;
    daysRemaining: number;
  } | null;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  type: 'task' | 'assignment' | 'study' | 'coding' | 'habit' | 'assessment' | 'personal';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'archived';
  dueDate?: string;
  estimatedMinutes: number;
  courseId?: {
    _id: string;
    name: string;
    code: string;
    color: string;
  };
  source: string;
  tags: string[];
  recurrence: string;
  calculatedScore: number;
  priorityReason?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  type: 'class' | 'assignment' | 'assessment' | 'study_session' | 'coding' | 'habit' | 'personal';
  courseId?: {
    _id: string;
    name: string;
    code: string;
    color: string;
  };
  relatedTaskId?: {
    _id: string;
    title: string;
    status: string;
    priority: string;
  };
  source: string;
  aiExplanation?: string;
  color?: string;
}

export interface Assignment {
  _id: string;
  courseId: {
    _id: string;
    name: string;
    code: string;
    color?: string;
  };
  title: string;
  description?: string;
  dueDate: string;
  weight: number;
  estimatedMinutes: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'completed';
  associatedTaskId?: string;
  submissionNotes?: string;
}

export interface Assessment {
  _id: string;
  courseId: {
    _id: string;
    name: string;
    code: string;
    color?: string;
  };
  title: string;
  type: 'cat' | 'midterm' | 'final' | 'quiz' | 'lab_exam' | 'project';
  date: string;
  syllabus?: string;
  weight: number;
  preparationStatus: 'not_started' | 'reviewing' | 'ready';
  notes?: string;
}

export interface Habit {
  _id: string;
  title: string;
  category: 'morning' | 'study' | 'night' | 'anytime';
  description?: string;
  targetDaysPerWeek: number;
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  weeklyStatus: Array<{
    date: string;
    dayOfWeek: string;
    completed: boolean;
  }>;
}

export interface GitHubData {
  connected: boolean;
  username: string;
  lastSyncedAt?: string;
  reposCount: number;
  weeklyCommits: number;
  totalCommitsYear: number;
  recentRepos: Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    updatedAt: string;
    url: string;
  }>;
  languages: Array<{ name: string; percentage: number }>;
}

export interface LeetCodeData {
  connected: boolean;
  username: string;
  lastSyncedAt?: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  streak: number;
  totalActiveDays: number;
  recentSubmissions: Array<{
    id: string;
    title: string;
    titleSlug: string;
    timestamp: number;
  }>;
  topicStats: Array<{
    tagName: string;
    problemsSolved: number;
  }>;
  weaknessAnalysis?: {
    summary: string;
    recommendedTopics: string[];
    suggestedProblemCount: number;
  };
}

export interface SpotifyPlayback {
  connected: boolean;
  isPlaying?: boolean;
  currentTrack?: {
    title: string;
    artist: string;
    album?: string;
    albumArt?: string;
    durationMs: number;
    progressMs: number;
  } | null;
  ambientTracks?: Array<{
    id: string;
    title: string;
    artist: string;
    type: string;
  }>;
  error?: string;
}

export interface StudyPlanDay {
  dayNumber: number;
  date: string;
  unitNumber: number;
  topicTitle: string;
  durationMinutes: number;
  learningObjectives?: string[];
  completed: boolean;
  taskId?: string;
  calendarEventId?: string;
}

export interface StudyPlan {
  _id: string;
  courseId: {
    _id: string;
    name: string;
    code: string;
    color?: string;
  };
  examDate: string;
  targetHours: number;
  days: StudyPlanDay[];
  status: 'active' | 'completed' | 'archived';
  notes?: string;
}

export interface WorkloadScore {
  workloadScore: number;
  level: 'Manageable' | 'Moderate' | 'Heavy';
  pendingAssignmentsCount: number;
  upcomingAssessmentsCount: number;
  overdueTasksCount: number;
}
