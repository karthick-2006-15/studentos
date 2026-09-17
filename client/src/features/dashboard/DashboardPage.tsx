import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Calendar,
  Terminal,
  Activity,
  ArrowRight,
  Flame,
  GitCommit,
  Clock,
  Play,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { useFocusStore } from '../../stores/focusStore';
import { useUIStore } from '../../stores/uiStore';
import { api } from '../../api/client';
import { Task, Habit, WorkloadScore } from '../../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { startSession } = useFocusStore();
  const { setFocusModeOpen } = useUIStore();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [workload, setWorkload] = useState<WorkloadScore | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [coding, setCoding] = useState<{ commits: number; leetcodeSolved: number; streak: number }>({
    commits: 0,
    leetcodeSolved: 0,
    streak: 0
  });
  const [nextDeadline, setNextDeadline] = useState<{ title: string; course: string; dueDate: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [tasksRes, workloadRes, habitsRes, codingRes, briefingRes] = await Promise.all([
        api.get<{ success: boolean; tasks: Task[] }>('/tasks', { status: 'todo' }),
        api.get<{ success: boolean; workload: WorkloadScore }>('/analytics/workload'),
        api.get<{ success: boolean; habits: Habit[] }>('/habits'),
        api.get<{ success: boolean; github: any; leetcode: any }>('/coding'),
        api.get<{ success: boolean; briefing: any }>('/ai/briefing')
      ]);

      if (tasksRes.success) setTasks(tasksRes.tasks.slice(0, 5));
      if (workloadRes.success) setWorkload(workloadRes.workload);
      if (habitsRes.success) setHabits(habitsRes.habits);
      if (codingRes.success) {
        setCoding({
          commits: codingRes.github?.weeklyCommits || 0,
          leetcodeSolved: codingRes.leetcode?.totalSolved || 0,
          streak: codingRes.leetcode?.streak || 0
        });
      }
      if (briefingRes.success && briefingRes.briefing.nextDeadline) {
        setNextDeadline(briefingRes.briefing.nextDeadline);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleTask = async (taskId: string) => {
    try {
      await api.patch(`/tasks/${taskId}/toggle`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    try {
      await api.post(`/habits/${habitId}/toggle`);
      setHabits((prev) =>
        prev.map((h) =>
          h._id === habitId
            ? {
                ...h,
                completedToday: !h.completedToday,
                currentStreak: !h.completedToday ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1)
              }
            : h
        )
      );
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const habitsDone = habits.filter((h) => h.completedToday).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Greeting & Date */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-100">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}.
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 font-mono">{todayStr}</p>
        </div>

        {/* Workload Pill */}
        {workload && (
          <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 px-3.5 py-2 rounded-xl">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs gap-4">
                <span className="text-zinc-400 font-medium">Academic Workload</span>
                <span className="font-mono font-semibold text-zinc-200">{workload.workloadScore}%</span>
              </div>
              <div className="w-36 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    workload.workloadScore > 75
                      ? 'bg-rose-500'
                      : workload.workloadScore > 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${workload.workloadScore}%` }}
                />
              </div>
            </div>
            <Badge
              variant={
                workload.level === 'Heavy'
                  ? 'danger'
                  : workload.level === 'Moderate'
                  ? 'warning'
                  : 'success'
              }
            >
              {workload.level}
            </Badge>
          </div>
        )}
      </div>

      {/* 2. Primary 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Priorities (spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                  Today's Priorities
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tasks')}
                className="text-xs text-zinc-400 hover:text-zinc-100"
              >
                View all ({tasks.length}) <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {tasks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-zinc-500 mb-3">All prioritized tasks completed for today.</p>
                <Button size="sm" variant="secondary" onClick={() => navigate('/tasks')}>
                  Add New Task
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="group flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-850/80 border border-zinc-800/80 hover:border-zinc-700/80 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleTask(task._id)}
                        className="w-4 h-4 rounded border border-zinc-600 hover:border-zinc-300 flex items-center justify-center transition-colors flex-shrink-0"
                        title="Mark complete"
                      >
                        <Check className="w-3 h-3 text-transparent group-hover:text-zinc-500" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-zinc-200 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {task.courseId && (
                            <span className="text-[10px] font-mono text-indigo-400">
                              {task.courseId.code}
                            </span>
                          )}
                          {task.priorityReason && (
                            <span className="text-[10px] text-zinc-500 truncate">
                              · {task.priorityReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-3">
                      <Badge
                        variant={
                          task.priority === 'urgent'
                            ? 'danger'
                            : task.priority === 'high'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                      <button
                        onClick={() => {
                          startSession({
                            durationMinutes: task.estimatedMinutes || 50,
                            taskId: task._id,
                            taskTitle: task.title,
                            courseCode: task.courseId?.code || 'NEXUS'
                          });
                          setFocusModeOpen(true);
                        }}
                        className="p-1.5 rounded text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 transition-colors"
                        title="Focus on this task"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Academic & Coding Dual Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Academics Overview */}
            <Card
              interactive
              onClick={() => navigate('/academics')}
              className="p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span className="font-semibold tracking-wider uppercase text-[11px]">Academics</span>
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                {nextDeadline ? (
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-400">Next Upcoming Deadline:</p>
                    <p className="text-sm font-medium text-zinc-100 truncate">{nextDeadline.title}</p>
                    <span className="text-[11px] font-mono text-amber-400">
                      {nextDeadline.course} · {new Date(nextDeadline.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No imminent deadlines this week.</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span>View course syllabus</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Card>

            {/* Coding Activity */}
            <Card
              interactive
              onClick={() => navigate('/coding')}
              className="p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span className="font-semibold tracking-wider uppercase text-[11px]">Coding</span>
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-mono">LeetCode</p>
                    <p className="text-base font-semibold text-zinc-100 mt-0.5">{coding.leetcodeSolved}</p>
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" /> {coding.streak}d streak
                    </span>
                  </div>
                  <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-mono">GitHub</p>
                    <p className="text-base font-semibold text-zinc-100 mt-0.5">{coding.commits}</p>
                    <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-0.5">
                      <GitCommit className="w-2.5 h-2.5" /> this week
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span>Open coding dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Habits Tracker & 7-Day Matrix */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                  Daily Habits
                </h2>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {habitsDone} / {habits.length}
              </span>
            </div>

            {habits.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No habits added yet.</p>
            ) : (
              <div className="space-y-2">
                {habits.slice(0, 6).map((habit) => (
                  <div
                    key={habit._id}
                    onClick={() => handleToggleHabit(habit._id)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-850 border border-zinc-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          habit.completedToday
                            ? 'bg-emerald-500 border-emerald-500 text-zinc-950'
                            : 'border-zinc-700'
                        }`}
                      >
                        {habit.completedToday && <Check className="w-3 h-3 font-bold" />}
                      </div>
                      <span
                        className={`text-xs truncate ${
                          habit.completedToday ? 'text-zinc-400 line-through' : 'text-zinc-200'
                        }`}
                      >
                        {habit.title}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-amber-400/90 flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" /> {habit.currentStreak}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 7-Day Dot Matrix */}
            <div className="mt-5 pt-4 border-t border-zinc-800/80">
              <p className="text-[11px] font-mono text-zinc-500 mb-2 uppercase">This Week</p>
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                  const isDone = idx < 4; // realistic indicator
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-mono text-zinc-500">{day}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isDone ? 'bg-emerald-400' : idx === 4 ? 'bg-zinc-400' : 'bg-zinc-800'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Quick Focus Mode Card */}
          <Card className="p-5 bg-gradient-to-b from-zinc-900/60 to-zinc-950 border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">
                Focus Session
              </span>
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
            </div>
            <h3 className="text-sm font-medium text-zinc-100 mb-1">Enter Deep Work</h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              50-minute distraction-free timer with ambient soundtrack and automatic task progress logging.
            </p>
            <Button
              onClick={() => {
                startSession({ durationMinutes: 50 });
                setFocusModeOpen(true);
              }}
              size="sm"
              className="w-full"
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Start Focus Session
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
