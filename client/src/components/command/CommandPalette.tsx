import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  CheckSquare,
  Calendar,
  Upload,
  Play,
  Terminal,
  Bot,
  Sliders,
  BarChart3,
  BookOpen,
  Palette,
  Settings
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useThemeStore } from '../../stores/themeStore';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setAIAssistantOpen, setFocusModeOpen } =
    useUIStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  const commands: CommandItem[] = [
    {
      id: 'ask-ai',
      title: 'Ask NEXUS AI',
      category: 'AI Assistant',
      icon: Bot,
      action: () => {
        setCommandPaletteOpen(false);
        setAIAssistantOpen(true);
      }
    },
    {
      id: 'create-task',
      title: 'Create new task',
      category: 'Tasks',
      icon: CheckSquare,
      action: () => {
        setCommandPaletteOpen(false);
        navigate('/tasks');
      }
    },
    {
      id: 'upload-handout',
      title: 'Upload course handout (PDF/DOCX)',
      category: 'Academics',
      icon: Upload,
      action: () => {
        setCommandPaletteOpen(false);
        navigate('/academics');
      }
    },
    {
      id: 'start-focus',
      title: 'Start focus mode session',
      category: 'Productivity',
      icon: Play,
      action: () => {
        setCommandPaletteOpen(false);
        setFocusModeOpen(true);
      }
    },
    {
      id: 'open-calendar',
      title: 'Open student calendar',
      category: 'Navigation',
      icon: Calendar,
      action: () => {
        setCommandPaletteOpen(false);
        navigate('/calendar');
      }
    },
    {
      id: 'open-leetcode',
      title: 'Open LeetCode & Coding stats',
      category: 'Coding',
      icon: Terminal,
      action: () => {
        setCommandPaletteOpen(false);
        navigate('/coding');
      }
    },
    {
      id: 'open-academics',
      title: 'View courses & study plans',
      category: 'Academics',
      icon: BookOpen,
      action: () => {
        setCommandPaletteOpen(false);
        navigate('/academics');
      }
    },
    {
      id: 'open-analytics',
      title: 'View productivity analytics',
      category: 'Analytics',
      icon: BarChart3,
      action: () => {
        setCommandPaletteOpen(false);
        navigate('/analytics');
      }
    },
    {
      id: 'connect-integrations',
      title: 'Manage integrations (GitHub, LeetCode, Spotify)',
      category: 'Settings',
      icon: Sliders,
      action: () => {
        setCommandPaletteOpen(false);
        navigate('/integrations');
      }
    },
    {
      id: 'open-settings',
      title: 'Open Settings & Preferences',
      category: 'Settings',
      icon: Settings,
      action: () => {
        setCommandPaletteOpen(false);
        navigate('/settings');
      }
    },
    {
      id: 'theme-obsidian',
      title: 'Theme: Switch to Obsidian Dark',
      category: 'Appearance',
      icon: Palette,
      action: () => {
        useThemeStore.getState().setTheme('obsidian');
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'theme-midnight',
      title: 'Theme: Switch to Midnight Slate',
      category: 'Appearance',
      icon: Palette,
      action: () => {
        useThemeStore.getState().setTheme('midnight');
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'theme-carbon',
      title: 'Theme: Switch to Carbon Monochrome',
      category: 'Appearance',
      icon: Palette,
      action: () => {
        useThemeStore.getState().setTheme('carbon');
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'theme-forest',
      title: 'Theme: Switch to Forest Night',
      category: 'Appearance',
      icon: Palette,
      action: () => {
        useThemeStore.getState().setTheme('forest');
        setCommandPaletteOpen(false);
      }
    },
    {
      id: 'theme-paper',
      title: 'Theme: Switch to Minimal Light (Paper)',
      category: 'Appearance',
      icon: Palette,
      action: () => {
        useThemeStore.getState().setTheme('paper');
        setCommandPaletteOpen(false);
      }
    }
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-[#121215] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handlePaletteKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-700/50">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <p className="p-4 text-center text-xs text-zinc-500">No matching commands found.</p>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                    isSelected ? 'bg-zinc-800/80 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    <span className="text-xs font-medium truncate">{cmd.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
