import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { api } from '../../api/client';
import { Button } from '../ui/Button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: any;
}

const suggestedPrompts = [
  'Plan my evening.',
  "What's due this week?",
  'Move unfinished tasks to tomorrow.',
  'Summarize my academic workload.',
  'Give me a LeetCode problem recommendation.'
];

export const AIDrawer: React.FC = () => {
  const { isAIAssistantOpen, setAIAssistantOpen } = useUIStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        'Hello. I am NEXUS AI. I track your courses, deadlines, tasks, and coding activity. What should we tackle right now?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await api.post<{
        success: boolean;
        response: string;
        action?: any;
      }>('/ai/chat', { message: query });

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.response,
        action: res.action
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${err.message || 'Unable to communicate with NEXUS AI.'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAIAssistantOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md h-full bg-[#121215] border-l border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">NEXUS AI</h3>
              <p className="text-[10px] font-mono text-zinc-500">Intelligent Academic Copilot</p>
            </div>
          </div>
          <button
            onClick={() => setAIAssistantOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-zinc-200 text-zinc-950 font-medium'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {m.action && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                    <Check className="w-3.5 h-3.5" />
                    <span>{m.action.description || 'Action completed'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono p-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="p-3 border-t border-zinc-850 bg-zinc-950/50">
          <p className="text-[10px] font-mono text-zinc-500 uppercase mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Quick actions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPrompts.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="text-[11px] bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 px-2.5 py-1 rounded-md transition-colors truncate max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-zinc-800 bg-[#121215]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or run an action..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
              className="px-3"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
