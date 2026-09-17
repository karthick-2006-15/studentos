import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Send, Check, Calendar, Sun, Moon, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../api/client';

export const AIPage: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; action?: any }>>([
    {
      role: 'assistant',
      content:
        'Welcome to NEXUS AI. I have full context of your college courses, assignments, exams, LeetCode progress, and calendar. What would you like to plan or review?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [briefing, setBriefing] = useState<any>(null);
  const [eveningReview, setEveningReview] = useState<any>(null);

  const fetchBriefingAndReview = async () => {
    try {
      const [bRes, rRes] = await Promise.all([
        api.get<{ success: boolean; briefing: any }>('/ai/briefing'),
        api.get<{ success: boolean; review: any }>('/ai/evening-review')
      ]);
      if (bRes.success) setBriefing(bRes.briefing);
      if (rRes.success) setEveningReview(rRes.review);
    } catch (err) {
      console.error('Failed to load briefing:', err);
    }
  };

  useEffect(() => {
    fetchBriefingAndReview();
  }, []);

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim() || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const res = await api.post<{ success: boolean; response: string; action?: any }>('/ai/chat', {
        message: text
      });

      if (res.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.response, action: res.action }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message || 'AI request failed'}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRolloverTasks = async () => {
    try {
      const res = await api.post<{ success: boolean; message: string }>('/tasks/rollover');
      if (res.success) {
        alert(res.message);
        fetchBriefingAndReview();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800/80">
        <h1 className="text-xl md:text-2xl font-semibold text-zinc-100 flex items-center gap-2">
          <Bot className="w-6 h-6 text-indigo-400" /> NEXUS Academic Intelligence
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Autonomous student copilot with verified real-data tool calling and conflict-free planning.
        </p>
      </div>

      {/* Briefing & Review Dual Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Morning Briefing Card */}
        {briefing && (
          <Card className="p-4 space-y-3 bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                <Sun className="w-4 h-4" /> Daily Briefing
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{briefing.dateStr}</span>
            </div>

            <p className="text-xs text-zinc-300">
              {briefing.greeting}. You have{' '}
              <span className="text-indigo-400 font-semibold">{briefing.priorities.length} tasks</span>{' '}
              prioritized for today and{' '}
              <span className="text-amber-400 font-semibold">
                {briefing.upcomingDeadlinesCount} deadlines
              </span>{' '}
              in the next 72 hours.
            </p>

            <div className="space-y-1 pt-1">
              {briefing.priorities.slice(0, 3).map((p: any, idx: number) => (
                <div
                  key={p.id || idx}
                  className="flex items-center justify-between text-[11px] font-mono p-1.5 rounded bg-zinc-900 border border-zinc-800"
                >
                  <span className="text-zinc-200 truncate">{p.title}</span>
                  <span className="text-zinc-500">{p.reason}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Evening Review Card */}
        {eveningReview && (
          <Card className="p-4 space-y-3 bg-zinc-900/40 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  <Moon className="w-4 h-4" /> Evening Review
                </div>
                <Badge variant="primary" size="sm">End of Day</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">Completed</span>
                  <span className="text-base font-bold text-emerald-400">
                    {eveningReview.completedCount}
                  </span>
                </div>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">Remaining</span>
                  <span className="text-base font-bold text-amber-400">
                    {eveningReview.remainingCount}
                  </span>
                </div>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">Study Logged</span>
                  <span className="text-base font-bold text-zinc-200">
                    {eveningReview.studyMinutes}m
                  </span>
                </div>
              </div>
            </div>

            {eveningReview.remainingCount > 0 && (
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={handleRolloverTasks}
                >
                  Move {eveningReview.remainingCount} remaining tasks to tomorrow
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Main AI Chat Interface */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
          Ask NEXUS AI Anything
        </h2>

        {/* Quick prompt pills */}
        <div className="flex flex-wrap gap-2">
          {[
            'What should I study today?',
            'What assignments are due this week?',
            'When is my next assessment?',
            'I have 3 hours tonight. What should I do?',
            'Move my unfinished tasks to tomorrow.'
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="text-xs bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto p-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-zinc-200 text-zinc-950 font-medium'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {m.action && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-xs text-emerald-400 font-mono">
                    <Check className="w-3.5 h-3.5" />
                    <span>{m.action.description || 'Structured action executed'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono p-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Reasoning against academic workload...
            </div>
          )}
        </div>

        {/* Form Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 pt-2 border-t border-zinc-800"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask questions about your courses, deadlines, or request scheduling..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
          <Button type="submit" size="sm" disabled={!input.trim() || isLoading}>
            <Send className="w-3.5 h-3.5 mr-1" /> Ask
          </Button>
        </form>
      </Card>
    </div>
  );
};
