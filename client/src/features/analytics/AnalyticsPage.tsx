import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, CheckSquare, Terminal, Activity, TrendingUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';
import { WorkloadScore } from '../../types';

export const AnalyticsPage: React.FC = () => {
  const [workload, setWorkload] = useState<WorkloadScore | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [wRes, sRes] = await Promise.all([
          api.get<{ success: boolean; workload: WorkloadScore }>('/analytics/workload'),
          api.get<{ success: boolean; analytics: any }>('/analytics/weekly')
        ]);
        if (wRes.success) setWorkload(wRes.workload);
        if (sRes.success) setStats(sRes.analytics);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800/80">
        <h1 className="text-xl md:text-2xl font-semibold text-zinc-100">Productivity Analytics</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Real metrics for academic workload, study time, coding frequency, and task completion.
        </p>
      </div>

      {/* Top 4 Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono uppercase">Tasks Completed</span>
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
          <p className="text-2xl font-mono font-bold text-zinc-100">
            {stats?.tasks?.completedThisWeek ?? 0}
          </p>
          <span className="text-[10px] font-mono text-zinc-500">past 7 days</span>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono uppercase">Focus Study</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <p className="text-2xl font-mono font-bold text-zinc-100">
            {Math.round((stats?.study?.totalMinutesThisWeek ?? 0) / 60)}h{' '}
            {(stats?.study?.totalMinutesThisWeek ?? 0) % 60}m
          </p>
          <span className="text-[10px] font-mono text-indigo-400">
            {stats?.study?.sessionsCount ?? 0} sessions
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono uppercase">Coding Output</span>
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <p className="text-2xl font-mono font-bold text-zinc-100">
            {stats?.coding?.weeklyCommits ?? 0}
          </p>
          <span className="text-[10px] font-mono text-zinc-500">commits this week</span>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-mono uppercase">Habit Logs</span>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <p className="text-2xl font-mono font-bold text-zinc-100">
            {stats?.habits?.completionsThisWeek ?? 0}
          </p>
          <span className="text-[10px] font-mono text-emerald-400">consistency check</span>
        </Card>
      </div>

      {/* Academic Workload Deep-dive */}
      {workload && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                Academic Workload Pressure Index
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Calculated deterministically from pending deadlines and exam proximity.
              </p>
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
              {workload.level} Workload
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Pressure Score</span>
              <span className="font-mono font-bold text-zinc-100">{workload.workloadScore}%</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
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

          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs font-mono">
            <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block">Pending Assignments</span>
              <span className="text-base font-bold text-zinc-200 mt-1 block">
                {workload.pendingAssignmentsCount}
              </span>
            </div>
            <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block">Upcoming CAT Exams</span>
              <span className="text-base font-bold text-rose-400 mt-1 block">
                {workload.upcomingAssessmentsCount}
              </span>
            </div>
            <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block">Overdue Tasks</span>
              <span className="text-base font-bold text-amber-400 mt-1 block">
                {workload.overdueTasksCount}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Weekly Daily Breakdown Table / Graphic */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
          7-Day Activity Velocity
        </h3>

        <div className="space-y-2">
          {(stats?.dailyBreakdown || []).map((day: any) => (
            <div
              key={day.date}
              className="flex items-center justify-between p-2.5 rounded bg-zinc-900/50 border border-zinc-800/80 text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                <span className="text-zinc-400 w-10 font-bold">{day.day}</span>
                <span className="text-zinc-500 text-[11px]">{day.date}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-indigo-300">{day.studyMinutes}m study</span>
                <span className="text-emerald-400">{day.tasksCompleted} tasks done</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
