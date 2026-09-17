import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  GraduationCap,
  Terminal,
  Activity,
  Bot,
  BarChart3,
  Sliders,
  Play,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useFocusStore } from '../../stores/focusStore';

const primaryNav = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
  { name: 'Academics', path: '/academics', icon: GraduationCap },
  { name: 'Coding', path: '/coding', icon: Terminal },
  { name: 'Habits', path: '/habits', icon: Activity },
  { name: 'NEXUS AI', path: '/ai', icon: Bot }
];

const secondaryNav = [
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Integrations', path: '/integrations', icon: Sliders },
  { name: 'Settings', path: '/settings', icon: Settings }
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, setSidebarCollapsed, setFocusModeOpen } = useUIStore();
  const { isActive: isFocusActive } = useFocusStore();

  return (
    <aside
      className={clsx(
        'hidden md:flex flex-col border-r border-zinc-800/80 bg-[#09090b] transition-all duration-200 select-none z-30',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-800/80">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-xs">
              N
            </div>
            <span className="font-semibold text-sm tracking-wider text-zinc-100">NEXUS</span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              OS
            </span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 mx-auto rounded bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-sm">
            N
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={clsx(
            'p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-850',
            sidebarCollapsed && 'hidden'
          )}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Focus Launcher Button */}
      <div className="px-3 py-3">
        <button
          onClick={() => setFocusModeOpen(true)}
          className={clsx(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
            isFocusActive
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-850 hover:text-white border border-zinc-800'
          )}
        >
          <Play className={clsx('w-3.5 h-3.5 text-indigo-400', isFocusActive && 'fill-indigo-400')} />
          {!sidebarCollapsed && (
            <span className="truncate">
              {isFocusActive ? 'Focus Active...' : 'Start Focus'}
            </span>
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
        <div className="space-y-0.5">
          {!sidebarCollapsed && (
            <span className="px-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              Core
            </span>
          )}
          {primaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-850 text-zinc-100 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900',
                    sidebarCollapsed && 'justify-center px-0'
                  )
                }
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>

        <div className="pt-4 space-y-0.5">
          {!sidebarCollapsed && (
            <span className="px-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              System
            </span>
          )}
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-850 text-zinc-100 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900',
                    sidebarCollapsed && 'justify-center px-0'
                  )
                }
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-zinc-800/80">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-zinc-200 truncate">{user?.name || 'Student'}</p>
                <p className="text-[11px] text-zinc-500 truncate">{user?.major || 'CSE'}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-850 transition-colors ml-auto"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
