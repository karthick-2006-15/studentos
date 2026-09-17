import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Play, Bot, Settings } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useFocusStore } from '../../stores/focusStore';
import { api } from '../../api/client';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { setCommandPaletteOpen, setAIAssistantOpen, setFocusModeOpen } = useUIStore();
  const { isActive: isFocusActive } = useFocusStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get<{ success: boolean; unreadCount: number }>('/notifications');
        if (res.success) setUnreadCount(res.unreadCount);
      } catch {
        // ignore
      }
    };
    fetchUnread();
  }, []);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-sm px-4 md:px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Date / Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
          {todayStr}
        </span>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search or command...</span>
          <kbd className="hidden sm:inline text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-700/50">
            ⌘K
          </kbd>
        </button>

        {/* Focus Mode Quick Action */}
        <button
          onClick={() => setFocusModeOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isFocusActive
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse'
              : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800'
          }`}
          title="Open Focus Mode"
        >
          <Play className={`w-3 h-3 text-indigo-400 ${isFocusActive ? 'fill-indigo-400' : ''}`} />
          <span className="hidden md:inline">{isFocusActive ? 'In Focus' : 'Focus'}</span>
        </button>

        {/* AI Assistant Quick Trigger */}
        <button
          onClick={() => setAIAssistantOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          title="Open NEXUS AI"
        >
          <Bot className="w-3.5 h-3.5 text-zinc-300" />
          <span className="hidden md:inline">Ask AI</span>
        </button>

        {/* Settings & Themes Quick Trigger */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border border-zinc-800 transition-colors"
          title="Settings & Appearance"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => alert('Notifications: All deadlines and briefings are up to date.')}
          className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border border-zinc-800 transition-colors"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#09090b]" />
          )}
        </button>
      </div>
    </header>
  );
};
