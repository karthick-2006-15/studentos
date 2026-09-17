import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Calendar, GraduationCap, Terminal, Activity } from 'lucide-react';
import clsx from 'clsx';

const mobileNavItems = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
  { name: 'Academics', path: '/academics', icon: GraduationCap },
  { name: 'Coding', path: '/coding', icon: Terminal },
  { name: 'Habits', path: '/habits', icon: Activity }
];

export const MobileNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-t border-zinc-800/80 px-2 py-1 safe-area-bottom">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1 rounded-lg text-[10px] font-medium transition-colors',
                  isActive ? 'text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                )
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
