import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  BookOpen,
  Info,
  CheckCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';
import { CalendarEvent, Course } from '../../types';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventType, setEventType] = useState('study_session');
  const [eventCourseId, setEventCourseId] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await api.get<{ success: boolean; events: CalendarEvent[] }>('/calendar');
      if (res.success) setEvents(res.events);
    } catch (err) {
      console.error('Failed to fetch events:', err);
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
    fetchEvents();
    fetchCourses();
  }, []);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    try {
      const startDateTime = new Date(`${eventDate}T${eventStartTime}:00`);
      const endDateTime = new Date(`${eventDate}T${eventEndTime}:00`);

      const res = await api.post<{ success: boolean; event: CalendarEvent; hasConflict: boolean }>(
        '/calendar',
        {
          title: eventTitle,
          description: eventDescription,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          type: eventType,
          courseId: eventCourseId || undefined
        }
      );

      if (res.success) {
        setEvents((prev) => [...prev, res.event]);
        setIsCreateModalOpen(false);
        setEventTitle('');
        setEventDescription('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create event');
    }
  };

  // Month grid generation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-100">{monthName}</h1>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handlePrev}
              className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-0.5 text-xs font-mono rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
            {(['month', 'agenda'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded capitalize font-medium transition-colors ${
                  viewMode === mode ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Event
          </Button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'month' ? (
        <Card className="p-4 md:p-6 overflow-x-auto">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs text-zinc-500 uppercase pb-3 border-b border-zinc-800/80 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 min-w-[600px]">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-24 md:h-28 rounded-lg bg-transparent" />;
              }

              const cellDate = new Date(year, month, day);
              const cellDateStr = cellDate.toISOString().split('T')[0];
              const isToday =
                new Date().toISOString().split('T')[0] === cellDateStr;

              // Filter events for this day
              const dayEvents = events.filter((e) => {
                const eDate = new Date(e.startDate).toISOString().split('T')[0];
                return eDate === cellDateStr;
              });

              return (
                <div
                  key={day}
                  className={`h-24 md:h-28 p-1.5 rounded-lg border transition-colors flex flex-col justify-between ${
                    isToday
                      ? 'bg-zinc-900/90 border-indigo-500/40 ring-1 ring-indigo-500/20'
                      : 'bg-[#121215]/60 hover:bg-zinc-900/50 border-zinc-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-medium ${
                        isToday ? 'text-indigo-400 font-bold' : 'text-zinc-400'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono text-zinc-500">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-16 py-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev._id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`text-[10px] truncate px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          ev.type === 'assessment'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                            : ev.type === 'assignment'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                        }`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[9px] text-zinc-500 font-mono">
                        +{dayEvents.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* Agenda View */
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Upcoming Calendar Agenda
          </h2>
          {events.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">No upcoming events scheduled.</p>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <div
                  key={ev._id}
                  onClick={() => setSelectedEvent(ev)}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2 h-8 rounded-full ${
                        ev.type === 'assessment'
                          ? 'bg-rose-500'
                          : ev.type === 'assignment'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{ev.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                        <span>{new Date(ev.startDate).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {ev.courseId && <span className="text-indigo-400">[{ev.courseId.code}]</span>}
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={
                      ev.type === 'assessment'
                        ? 'danger'
                        : ev.type === 'assignment'
                        ? 'warning'
                        : 'primary'
                    }
                    size="sm"
                  >
                    {ev.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          isOpen={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          description="Calendar Event Details"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="primary">{selectedEvent.type}</Badge>
              {selectedEvent.courseId && (
                <span className="font-mono text-indigo-400 font-medium">
                  {selectedEvent.courseId.code} — {selectedEvent.courseId.name}
                </span>
              )}
            </div>

            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5 font-mono text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">Date:</span>
                <span>{new Date(selectedEvent.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Window:</span>
                <span>
                  {new Date(selectedEvent.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {new Date(selectedEvent.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {selectedEvent.description && (
              <div>
                <span className="text-zinc-500 block mb-1">Description:</span>
                <p className="text-zinc-300 leading-relaxed bg-zinc-900/50 p-2.5 rounded border border-zinc-800/60">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            {selectedEvent.aiExplanation && (
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-200">
                <span className="font-semibold block mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> AI Scheduling Context
                </span>
                <p className="leading-relaxed">{selectedEvent.aiExplanation}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule Calendar Event"
        description="Add class timings, exams, or study sessions."
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Event Title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g. DBMS CAT-1 Review"
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description (optional)</label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Notes or chapter details..."
              rows={2}
              className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              type="date"
              label="Date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
            <Input
              type="time"
              label="Start Time"
              value={eventStartTime}
              onChange={(e) => setEventStartTime(e.target.value)}
              required
            />
            <Input
              type="time"
              label="End Time"
              value={eventEndTime}
              onChange={(e) => setEventEndTime(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="study_session">Study Session</option>
                <option value="assignment">Assignment Due</option>
                <option value="assessment">Assessment / Exam</option>
                <option value="class">Class / Lecture</option>
                <option value="coding">Coding Block</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Course</label>
              <select
                value={eventCourseId}
                onChange={(e) => setEventCourseId(e.target.value)}
                className="w-full bg-[#121215] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="">None</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Schedule Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
