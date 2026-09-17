import React, { useState, useEffect } from 'react';
import { Terminal, GitCommit, Music, Calendar, Check, ExternalLink, RotateCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';

export const IntegrationsPage: React.FC = () => {
  const [github, setGithub] = useState<any>(null);
  const [leetcode, setLeetcode] = useState<any>(null);
  const [spotify, setSpotify] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [modalService, setModalService] = useState<'github' | 'leetcode' | 'spotify' | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const [codingRes, spotifyRes] = await Promise.all([
        api.get<{ success: boolean; github: any; leetcode: any }>('/coding'),
        api.get<{ success: boolean; playback: any }>('/spotify/playback')
      ]);

      if (codingRes.success) {
        setGithub(codingRes.github);
        setLeetcode(codingRes.leetcode);
      }
      if (spotifyRes.success) {
        setSpotify(spotifyRes.playback);
      }
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleDisconnect = async (service: 'github' | 'leetcode' | 'spotify') => {
    if (!confirm(`Are you sure you want to disconnect ${service}?`)) return;

    try {
      if (service === 'spotify') {
        await api.delete('/spotify/disconnect');
      } else {
        await api.delete(`/coding/${service}`);
      }
      fetchIntegrations();
    } catch (err: any) {
      alert(err.message || 'Disconnect failed');
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (modalService === 'leetcode') {
        await api.post('/coding/leetcode/sync', { username: usernameInput.trim() });
      } else if (modalService === 'github') {
        await api.post('/coding/github/sync', {
          username: usernameInput.trim(),
          token: tokenInput.trim() || undefined
        });
      } else if (modalService === 'spotify') {
        await api.post('/spotify/connect', { accessToken: tokenInput.trim() });
      }

      setModalService(null);
      setUsernameInput('');
      setTokenInput('');
      fetchIntegrations();
    } catch (err: any) {
      alert(err.message || 'Connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800/80">
        <h1 className="text-xl md:text-2xl font-semibold text-zinc-100">Integration Center</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Connect your developer, coding, and media platforms with zero data leakage.
        </p>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LeetCode */}
        <Card className="p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">LeetCode</h3>
                  <p className="text-[11px] text-zinc-500">DSA statistics & weakness detection</p>
                </div>
              </div>
              <Badge variant={leetcode?.connected ? 'success' : 'neutral'} size="sm">
                {leetcode?.connected ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Pulls solved problems (Easy/Medium/Hard), active streak, and recent submissions via public GraphQL.
            </p>

            {leetcode?.connected && (
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 space-y-1">
                <div>Account: @{leetcode.username}</div>
                <div>Solved: {leetcode.totalSolved} problems ({leetcode.streak}d streak)</div>
                <div className="text-zinc-500 text-[10px]">
                  Last synced: {leetcode.lastSyncedAt ? new Date(leetcode.lastSyncedAt).toLocaleTimeString() : 'Recently'}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            {leetcode?.connected ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setModalService('leetcode');
                    setUsernameInput(leetcode.username || '');
                  }}
                >
                  <RotateCw className="w-3.5 h-3.5 mr-1" /> Sync Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDisconnect('leetcode')}
                  className="text-rose-400 hover:text-rose-300"
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setModalService('leetcode')}>
                Connect LeetCode
              </Button>
            )}
          </div>
        </Card>

        {/* GitHub */}
        <Card className="p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                  <GitCommit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">GitHub</h3>
                  <p className="text-[11px] text-zinc-500">Repositories, commits, & languages</p>
                </div>
              </div>
              <Badge variant={github?.connected ? 'success' : 'neutral'} size="sm">
                {github?.connected ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Monitors weekly coding commits, active repositories, and language percentage breakdown without arbitrary XP.
            </p>

            {github?.connected && (
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 space-y-1">
                <div>Account: @{github.username}</div>
                <div>Commits this week: {github.weeklyCommits} ({github.reposCount} public repos)</div>
                <div className="text-zinc-500 text-[10px]">
                  Last synced: {github.lastSyncedAt ? new Date(github.lastSyncedAt).toLocaleTimeString() : 'Recently'}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            {github?.connected ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setModalService('github');
                    setUsernameInput(github.username || '');
                  }}
                >
                  <RotateCw className="w-3.5 h-3.5 mr-1" /> Sync Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDisconnect('github')}
                  className="text-rose-400 hover:text-rose-300"
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setModalService('github')}>
                Connect GitHub
              </Button>
            )}
          </div>
        </Card>

        {/* Spotify */}
        <Card className="p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Spotify Playback</h3>
                  <p className="text-[11px] text-zinc-500">Focus mode music & ambient sound</p>
                </div>
              </div>
              <Badge variant={spotify?.connected ? 'success' : 'neutral'} size="sm">
                {spotify?.connected ? 'Connected' : 'Ambient Fallback Active'}
              </Badge>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Connect Spotify for live music playback during study focus sessions. If unconnected, NEXUS built-in ambient 40Hz audio plays automatically.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            {spotify?.connected ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDisconnect('spotify')}
                className="text-rose-400 hover:text-rose-300"
              >
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={() => setModalService('spotify')}>
                Connect Spotify Token
              </Button>
            )}
          </div>
        </Card>

        {/* Web Push Notifications */}
        <Card className="p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Push Notifications</h3>
                  <p className="text-[11px] text-zinc-500">Morning briefing & deadline alerts</p>
                </div>
              </div>
              <Badge variant="success" size="sm">VAPID Ready</Badge>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Automated 8:00 AM daily briefings, 24h deadline warnings, and 9:00 PM evening task reviews with quiet-hours protection.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await api.post('/notifications/test');
                  alert('Test push notification dispatched!');
                } catch (err: any) {
                  alert(err.message || 'Notification error');
                }
              }}
            >
              Test Notification
            </Button>
          </div>
        </Card>
      </div>

      {/* Connect Modal */}
      {modalService && (
        <Modal
          isOpen={Boolean(modalService)}
          onClose={() => setModalService(null)}
          title={`Connect ${modalService.toUpperCase()}`}
          description="Authenticate your profile for background synchronization."
        >
          <form onSubmit={handleConnect} className="space-y-4">
            {modalService === 'leetcode' && (
              <Input
                label="LeetCode Username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. tourist"
                required
                autoFocus
              />
            )}

            {modalService === 'github' && (
              <>
                <Input
                  label="GitHub Username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. octocat"
                  required
                  autoFocus
                />
                <Input
                  type="password"
                  label="Personal Access Token (optional)"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_..."
                />
              </>
            )}

            {modalService === 'spotify' && (
              <Input
                type="password"
                label="Spotify Access Token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="BQD..."
                required
                autoFocus
              />
            )}

            <div className="pt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalService(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting}>
                Save Connection
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
