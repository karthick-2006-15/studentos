import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Layout } from './components/layout/Layout';

// Pages
import { DashboardPage } from './features/dashboard/DashboardPage';
import { TasksPage } from './features/tasks/TasksPage';
import { CalendarPage } from './features/calendar/CalendarPage';
import { AcademicsPage } from './features/academics/AcademicsPage';
import { CodingPage } from './features/coding/CodingPage';
import { HabitsPage } from './features/habits/HabitsPage';
import { AIPage } from './features/ai/AIPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { IntegrationsPage } from './features/integrations/IntegrationsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#09090b] text-zinc-400 font-mono text-xs">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping mr-2" />
        Initializing NEXUS OS...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected App shell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="academics" element={<AcademicsPage />} />
          <Route path="coding" element={<CodingPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="ai" element={<AIPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
