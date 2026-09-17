import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Filter,
  Check,
  Play,
  Trash2,
  Calendar as CalendarIcon,
  RotateCcw,
  Clock
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useFocusStore } from '../../stores/focusStore';
import { useUIStore } from '../../stores/uiStore';
import { api } from '../../api/client';
import { Task, Course } from '../../types';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'completed'>('todo');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState('task');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState('30');
  const [newCourseId, setNewCourseId] = useState('');

  const { startSession } = useFocusStore();
  const { setFocusModeOpen } = useUIStore();

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ success: boolean; tasks: Task[] }>('/tasks', {
        status: statusFilter,
        type: typeFilter
      });
      if (res.success) setTasks(res.tasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get<{ success: boolean; courses: Course[] }>('/courses');
      if (res.success) setCourses(res.courses);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleToggleTask = async (id: string) => {
    try {
      const res = await api.patch<{ success: boolean; task: Task }>(`/tasks/${id}/toggle`);
      if (res.success) {
        if (statusFilter === 'all') {
          setTasks((prev) => prev.map((t) => (t._id === id ? res.task : t)));
        } else {
          setTasks((prev) => prev.filter((t) => t._id !== id));
        }
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleRollover = async () => {
    try {
      const res = await api.post<{ success: boolean; message: string }>('/tasks/rollover');
      if (res.success) {
        alert(res.message);
        fetchTasks();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.post<{ success: boolean; task: Task }>('/tasks', {
        title: newTitle,
        description: newDescription,
        type: newType,
        priority: newPriority,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : undefined,
        estimatedMinutes: parseInt(newEstimatedMinutes, 10) || 30,
        courseId: newCourseId || undefined
      });

      if (res.success) {
        setTasks((prev) => [res.task, ...prev]);
        setIsCreateModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewDueDate('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-100">Tasks & Priorities</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Unified priority engine ranking academic, coding, study, and routine tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRollover} title="Move overdue & today tasks to tomorrow">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Rollover
          </Button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New Task
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status filters */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          {(['todo', 'completed', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                statusFilter === st ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Type selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="assignment">Assignments</option>
            <option value="assessment">Assessments</option>
            <option value="study">Study Blocks</option>
            <option value="coding">Coding</option>
            <option value="habit">Habits</option>
            <option value="task">General</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-900/40 animate-pulse border border-zinc-800/40" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="Everything in this view is completed or not yet scheduled. Add a new task to continue making progress."
          actionLabel="Create Task"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <Card
                key={task._id}
                className="p-3.5 flex items-center justify-between group hover:border-zinc-700/80 transition-all"
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleTask(task._id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-zinc-950'
                        : 'border-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    {isCompleted && <Check className="w-3 h-3 font-bold" />}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium truncate ${
                          isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 font-mono">
                      {task.courseId && (
                        <span className="text-indigo-400 font-semibold">{task.courseId.code}</span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-2.5 h-2.5" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.estimatedMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {task.estimatedMinutes}m
                        </span>
                      )}
                      {task.priorityReason && <span>· {task.priorityReason}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Score, Priority, Actions */}
                <div className="flex items-center gap-3 ml-3">
                  {/* Priority score indicator */}
                  <span
                    className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded"
                    title={`Calculated Priority Score: ${task.calculatedScore}`}
                  >
                    {task.calculatedScore}
                  </span>

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

                  {/* Focus button */}
                  {!isCompleted && (
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
                      className="p-1.5 rounded text-zinc-500 hover:text-indigo-400 hover:bg-zinc-850 transition-colors"
                      title="Focus on this task"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="p-1.5 rounded text-zinc-600 hover:text-rose-400 hover:bg-zinc-850 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
        description="Unified tasks automatically receive calculated priority scores based on deadline and weight."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Implement B-Tree Indexing in C++"
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description (optional)</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Key notes, requirements, or links..."
              rows={2}
              className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="task">General Task</option>
                <option value="assignment">Assignment</option>
                <option value="assessment">Assessment</option>
                <option value="study">Study Session</option>
                <option value="coding">Coding Practice</option>
                <option value="habit">Habit Routine</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Due Date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />

            <Input
              type="number"
              label="Estimated Minutes"
              value={newEstimatedMinutes}
              onChange={(e) => setNewEstimatedMinutes(e.target.value)}
              min={5}
              max={360}
            />
          </div>

          {courses.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Related Course</label>
              <select
                value={newCourseId}
                onChange={(e) => setNewCourseId(e.target.value)}
                className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="">No Course Link</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
