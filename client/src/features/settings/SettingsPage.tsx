import React, { useState, useEffect } from 'react';
import {
  Palette,
  User as UserIcon,
  Bell,
  Moon,
  Sun,
  Shield,
  Check,
  Download,
  Save
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore, THEME_OPTIONS, ThemeId } from '../../stores/themeStore';
import { api } from '../../api/client';

export const SettingsPage: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const { currentTheme, setTheme } = useThemeStore();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [major, setMajor] = useState(user?.major || '');
  const [semester, setSemester] = useState(String(user?.semester || 5));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Notification Preferences
  const [morningBriefing, setMorningBriefing] = useState(true);
  const [eveningReview, setEveningReview] = useState(true);
  const [quietHours, setQuietHours] = useState(true);
  const [quietStart, setQuietStart] = useState('23:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCollege(user.college || '');
      setMajor(user.major || '');
      setSemester(String(user.semester || 5));
    }
  }, [user]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get<{ success: boolean; settings: any }>('/notifications/settings');
        if (res.success && res.settings) {
          setMorningBriefing(res.settings.morningBriefing ?? true);
          setEveningReview(res.settings.eveningReview ?? true);
          setQuietHours(res.settings.quietHoursEnabled ?? true);
          setQuietStart(res.settings.quietHoursStart || '23:00');
          setQuietEnd(res.settings.quietHoursEnd || '07:00');
        }
      } catch {
        // fallback
      }
    };
    fetchSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      await api.patch('/auth/preferences', {
        name,
        college,
        major,
        semester: parseInt(semester, 10) || 5
      });
      setProfileSuccessMsg('Profile updated successfully.');
      setTimeout(() => setProfileSuccessMsg(null), 3000);
      checkAuth();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setIsSavingNotifs(true);
      await api.patch('/notifications/settings', {
        preferences: {
          morningBriefing,
          morningBriefingTime: '08:00',
          eveningReview,
          eveningReviewTime: '21:00',
          quietHoursEnabled: quietHours,
          quietHoursStart: quietStart,
          quietHoursEnd: quietEnd
        }
      });
      alert('Notification settings updated.');
    } catch (err: any) {
      alert(err.message || 'Failed to update notification preferences');
    } finally {
      setIsSavingNotifs(false);
    }
  };

  const handleExportData = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      user: {
        name: user?.name,
        email: user?.email,
        college: user?.college,
        major: user?.major,
        semester: user?.semester
      },
      theme: currentTheme
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nexus-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800/80">
        <h1 className="text-xl md:text-2xl font-semibold text-zinc-100">Settings & Appearance</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Customize your theme, academic profile, notification schedule, and student data.
        </p>
      </div>

      {/* 1. THEME & APPEARANCE SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Appearance & Themes
          </h2>
        </div>
        <p className="text-xs text-zinc-400">
          Select a minimalist palette calibrated for high contrast and zero visual clutter.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {THEME_OPTIONS.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-indigo-500/80 border-indigo-500 bg-[#15151a]'
                    : 'border-zinc-800 bg-[#121215] hover:border-zinc-700'
                }`}
              >
                <div>
                  {/* Swatch Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                      <span className="text-xs font-semibold text-zinc-100">{theme.name}</span>
                    </div>

                    {isSelected ? (
                      <Badge variant="primary" size="sm">
                        <Check className="w-2.5 h-2.5 mr-0.5" /> Active
                      </Badge>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500">
                        {theme.isDark ? 'Dark' : 'Light'}
                      </span>
                    )}
                  </div>

                  {/* Visual Color Preview Bars */}
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-black/40 border border-white/5 mb-3">
                    <div
                      className="w-5 h-5 rounded border border-white/10"
                      style={{ backgroundColor: theme.bgColor }}
                      title="Background"
                    />
                    <div
                      className="w-5 h-5 rounded border border-white/10"
                      style={{ backgroundColor: theme.surfaceColor }}
                      title="Card Surface"
                    />
                    <div
                      className="w-5 h-5 rounded border border-white/10"
                      style={{ backgroundColor: theme.primaryColor }}
                      title="Accent"
                    />
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">{theme.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. STUDENT ACADEMIC PROFILE */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
          <UserIcon className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Student Profile
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Karthick S"
              required
            />
            <Input
              label="University / College"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="e.g. SRM Institute of Science and Technology"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Major / Program"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="e.g. B.Tech Computer Science & Engineering"
            />
            <Input
              type="number"
              label="Current Semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              min={1}
              max={12}
            />
          </div>

          {profileSuccessMsg && (
            <p className="text-xs text-emerald-400 font-mono">{profileSuccessMsg}</p>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" isLoading={isSavingProfile}>
              <Save className="w-3.5 h-3.5 mr-1" /> Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. NOTIFICATION PREFERENCES & QUIET HOURS */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
          <Bell className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Daily Notifications & Quiet Hours
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div>
              <span className="text-xs font-medium text-zinc-200 block">
                Morning Priorities Briefing
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                Delivers today's highest ranked tasks and deadline alerts at 8:00 AM.
              </span>
            </div>
            <input
              type="checkbox"
              checked={morningBriefing}
              onChange={(e) => setMorningBriefing(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div>
              <span className="text-xs font-medium text-zinc-200 block">
                Evening Review & Task Rollover
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                Summarizes completed work and prompts to move unfinished tasks to tomorrow at 9:00 PM.
              </span>
            </div>
            <input
              type="checkbox"
              checked={eveningReview}
              onChange={(e) => setEveningReview(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-500 cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-200 block">
                  Quiet Hours (No Alert Chimes)
                </span>
                <span className="text-[11px] text-zinc-400 block mt-0.5">
                  Suppresses push notifications during rest hours except critical exam alerts.
                </span>
              </div>
              <input
                type="checkbox"
                checked={quietHours}
                onChange={(e) => setQuietHours(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-indigo-500 cursor-pointer"
              />
            </div>

            {quietHours && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                <Input
                  type="time"
                  label="Quiet Start"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                />
                <Input
                  type="time"
                  label="Quiet End"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={handleSaveNotifications} isLoading={isSavingNotifs}>
            <Save className="w-3.5 h-3.5 mr-1" /> Update Preferences
          </Button>
        </div>
      </Card>

      {/* 4. DATA OWNERSHIP & PRIVACY */}
      <Card className="p-5 space-y-3 border-zinc-800">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
          <Shield className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Data Ownership & Backup
          </h3>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          You retain complete ownership of your academic records, tasks, and notes. Export your entire system state anytime as a standard JSON backup.
        </p>

        <div className="pt-2 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Data (JSON)
          </Button>
        </div>
      </Card>
    </div>
  );
};
