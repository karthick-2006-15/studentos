import React, { useState, useEffect } from 'react';
import { Activity, Plus, Check, Flame, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { api } from '../../api/client';
import { Habit } from '../../types';

export const HabitsPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [summary, setSummary] = useState<{ total: number; completedToday: number; completionRate: number }>({
    total: 0,
    completedToday: 0,
    completionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'morning' | 'study' | 'night' | 'anytime'>('morning');
  const [targetDays, setTargetDays] = useState('7');

  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{
        success: boolean;
        habits: Habit[];
        summary: { total: number; completedToday: number; completionRate: number };
      }>('/habits');

      if (res.success) {
        setHabits(res.habits);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to fetch habits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await api.post(`/habits/${id}/toggle`);
      setHabits((prev) =>
        prev.map((h) =>
          h._id === id
            ? {
                ...h,
                completedToday: !h.completedToday,
                currentStreak: !h.completedToday ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1)
              }
            : h
        )
      );
      setSummary((prev) => {
        const isNowDone = !habits.find((h) => h._id === id)?.completedToday;
        const newDone = isNowDone ? prev.completedToday + 1 : Math.max(0, prev.completedToday - 1);
        return {
          ...prev,
          completedToday: newDone,
          completionRate: prev.total > 0 ? Math.round((newDone / prev.total) * 100) : 0
        };
      });
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/habits/${id}`);
      setHabits((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await api.post<{ success: boolean; habit: Habit }>('/habits', {
        title: title.trim(),
        category,
        targetDaysPerWeek: parseInt(targetDays, 10) || 7
      });

      if (res.success) {
        setHabits((prev) => [...prev, { ...res.habit, completedToday: false, weeklyStatus: [] }]);
        setIsModalOpen(false);
        setTitle('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create habit');
    }
  };

  const categories = [
    { key: 'morning', label: 'Morning Routine' },
    { key: 'study', label: 'Study Routine' },
    { key: 'night', label: 'Night Routine' },
    { key: 'anytime', label: 'General Habits' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-100">Daily Habits</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Minimalist habit consistency without vanity RPG mechanics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-mono text-zinc-400">
              {summary.completedToday} / {summary.total} Done
            </span>
            <div className="w-28 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${summary.completionRate}%` }}
              />
            </div>
          </div>

          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New Habit
          </Button>
        </div>
      </div>

      {/* Habit Categories */}
      {habits.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No habits tracked"
          description="Build daily student consistency by tracking morning, study, and night routines."
          actionLabel="Add Habit"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {categories.map(({ key, label }) => {
            const groupHabits = habits.filter((h) => h.category === key);
            if (groupHabits.length === 0) return null;

            return (
              <div key={key} className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                  {label}
                </span>

                <div className="space-y-2">
                  {groupHabits.map((habit) => (
                    <Card
                      key={habit._id}
                      className="p-3.5 flex items-center justify-between group hover:border-zinc-700/80 transition-all"
                    >
                      <div
                        onClick={() => handleToggle(habit._id)}
                        className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                            habit.completedToday
                              ? 'bg-emerald-500 border-emerald-500 text-zinc-950'
                              : 'border-zinc-700 hover:border-zinc-400'
                          }`}
                        >
                          {habit.completedToday && <Check className="w-3 h-3 font-bold" />}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-medium truncate ${
                              habit.completedToday ? 'line-through text-zinc-500' : 'text-zinc-200'
                            }`}
                          >
                            {habit.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Weekly Dots */}
                        <div className="hidden sm:flex items-center gap-1">
                          {(habit.weeklyStatus || []).map((day, idx) => (
                            <span
                              key={idx}
                              className={`w-2 h-2 rounded-full ${
                                day.completed ? 'bg-emerald-400' : 'bg-zinc-800'
                              }`}
                              title={`${day.date}: ${day.completed ? 'Completed' : 'Missed'}`}
                            />
                          ))}
                        </div>

                        <span className="text-xs font-mono text-amber-400 font-medium flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          {habit.currentStreak}d
                        </span>

                        <button
                          onClick={() => handleDelete(habit._id)}
                          className="p-1 rounded text-zinc-600 hover:text-rose-400 hover:bg-zinc-850 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Habit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Daily Habit"
        description="Add a consistent habit routine."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Habit Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Solve 1 DSA Problem, Morning Workout"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="morning">Morning Routine</option>
                <option value="study">Study Routine</option>
                <option value="night">Night Routine</option>
                <option value="anytime">Anytime / Health</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Target Days / Week</label>
              <select
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
                className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="7">Everyday (7 days)</option>
                <option value="5">Weekdays (5 days)</option>
                <option value="3">3 days / week</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Habit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
