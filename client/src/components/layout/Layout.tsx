import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { CommandPalette } from '../command/CommandPalette';
import { FocusOverlay } from '../focus/FocusOverlay';
import { AIDrawer } from '../ai/AIDrawer';
import { SpotifyPlayerBar } from '../spotify/SpotifyPlayerBar';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-6 p-4 md:p-6">
          <Outlet />
        </main>
        {/* Persistent Spotify / Focus Audio Player Bar */}
        <SpotifyPlayerBar />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette />

      {/* Focus Mode Fullscreen / Overlay */}
      <FocusOverlay />

      {/* NEXUS AI Drawer */}
      <AIDrawer />
    </div>
  );
};
