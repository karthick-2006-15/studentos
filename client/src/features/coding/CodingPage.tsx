import React, { useState, useEffect } from 'react';
import {
  Terminal,
  GitCommit,
  Flame,
  RotateCw,
  ExternalLink,
  Code2,
  Sparkles,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';
import { GitHubData, LeetCodeData } from '../../types';

export const CodingPage: React.FC = () => {
  const [github, setGithub] = useState<GitHubData | null>(null);
  const [leetcode, setLeetcode] = useState<LeetCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync modal states
  const [isLeetCodeModalOpen, setIsLeetCodeModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchCodingData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ success: boolean; github: GitHubData; leetcode: LeetCodeData }>('/coding');
      if (res.success) {
        setGithub(res.github);
        setLeetcode(res.leetcode);
        if (res.leetcode?.username) setLeetcodeUsername(res.leetcode.username);
        if (res.github?.username) setGithubUsername(res.github.username);
      }
    } catch (err) {
      console.error('Failed to fetch coding data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCodingData();
  }, []);

  const handleSyncLeetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leetcodeUsername.trim()) return;

    try {
      setIsSyncing(true);
      const res = await api.post<{ success: boolean; leetcode: LeetCodeData }>('/coding/leetcode/sync', {
        username: leetcodeUsername.trim()
      });
      if (res.success) {
        setLeetcode(res.leetcode);
        setIsLeetCodeModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'LeetCode sync failed. Please check the username.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUsername.trim()) return;

    try {
      setIsSyncing(true);
      const res = await api.post<{ success: boolean; github: GitHubData }>('/coding/github/sync', {
        username: githubUsername.trim(),
        token: githubToken.trim() || undefined
      });
      if (res.success) {
        setGithub(res.github);
        setIsGitHubModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'GitHub sync failed. Please check username or token.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-100">Coding Intelligence</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Live LeetCode metrics, DSA topic mastery, AI weakness detection, and GitHub commits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGitHubModalOpen(true)}
          >
            <GitCommit className="w-3.5 h-3.5 mr-1" />
            {github?.connected ? `Sync @${github.username}` : 'Connect GitHub'}
          </Button>

          <Button
            size="sm"
            onClick={() => setIsLeetCodeModalOpen(true)}
          >
            <Terminal className="w-3.5 h-3.5 mr-1" />
            {leetcode?.connected ? `Sync @${leetcode.username}` : 'Connect LeetCode'}
          </Button>
        </div>
      </div>

      {/* Main 2-Column Section: LeetCode & GitHub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEETCODE SECTION */}
        <div className="space-y-4">
          <Card className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                  LeetCode Profile
                </h2>
              </div>
              {leetcode?.connected ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-400">@{leetcode.username}</span>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
              ) : (
                <Badge variant="neutral" size="sm">Not Connected</Badge>
              )}
            </div>

            {leetcode?.connected ? (
              <>
                {/* Solved Big Metrics */}
                <div className="flex items-baseline justify-between p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div>
                    <p className="text-xs text-zinc-500 font-mono uppercase">Total Solved</p>
                    <p className="text-3xl md:text-4xl font-mono font-bold text-zinc-100 mt-1">
                      {leetcode.totalSolved}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-mono text-amber-400 font-medium">
                    <Flame className="w-4 h-4 fill-current" />
                    <span>{leetcode.streak} Day Streak</span>
                  </div>
                </div>

                {/* Difficulty Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                    <span className="text-[10px] font-mono uppercase text-emerald-400">Easy</span>
                    <p className="text-xl font-mono font-semibold text-emerald-300 mt-1">
                      {leetcode.easySolved}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
                    <span className="text-[10px] font-mono uppercase text-amber-400">Medium</span>
                    <p className="text-xl font-mono font-semibold text-amber-300 mt-1">
                      {leetcode.mediumSolved}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-center">
                    <span className="text-[10px] font-mono uppercase text-rose-400">Hard</span>
                    <p className="text-xl font-mono font-semibold text-rose-300 mt-1">
                      {leetcode.hardSolved}
                    </p>
                  </div>
                </div>

                {/* AI Weakness Insights */}
                {leetcode.weaknessAnalysis && (
                  <div className="p-3.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                      <Sparkles className="w-3.5 h-3.5" /> AI Weakness & Practice Strategy
                    </div>
                    <p className="text-xs text-indigo-200 leading-relaxed">
                      {leetcode.weaknessAnalysis.summary}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase">Focus on:</span>
                      {leetcode.weaknessAnalysis.recommendedTopics.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300 border border-indigo-800"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topic Breakdown Bars */}
                {leetcode.topicStats && leetcode.topicStats.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-zinc-400 block">DSA Topic Mastery</span>
                    <div className="space-y-1.5">
                      {leetcode.topicStats.slice(0, 5).map((topic) => (
                        <div key={topic.tagName} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-mono">{topic.tagName}</span>
                          <span className="text-zinc-500 font-mono">{topic.problemsSolved} solved</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-zinc-500">
                  Connect your public LeetCode username to sync problems solved, current streaks, and AI weakness insights.
                </p>
                <Button size="sm" onClick={() => setIsLeetCodeModalOpen(true)}>
                  Connect LeetCode
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* GITHUB SECTION */}
        <div className="space-y-4">
          <Card className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                  GitHub Activity
                </h2>
              </div>
              {github?.connected ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-400">@{github.username}</span>
                  <Badge variant="success" size="sm">Synced</Badge>
                </div>
              ) : (
                <Badge variant="neutral" size="sm">Not Connected</Badge>
              )}
            </div>

            {github?.connected ? (
              <>
                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] font-mono uppercase text-zinc-500">Weekly Commits</span>
                    <p className="text-2xl font-mono font-bold text-zinc-100 mt-1">
                      {github.weeklyCommits}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] font-mono uppercase text-zinc-500">Public Repos</span>
                    <p className="text-2xl font-mono font-bold text-zinc-100 mt-1">
                      {github.reposCount}
                    </p>
                  </div>
                </div>

                {/* Languages Breakdown */}
                {github.languages && github.languages.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-zinc-400 block">Languages Used</span>
                    <div className="flex flex-wrap gap-2">
                      {github.languages.map((l) => (
                        <span
                          key={l.name}
                          className="text-[11px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300"
                        >
                          {l.name}: {l.percentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Repos */}
                {github.recentRepos && github.recentRepos.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-zinc-400 block">Active Repositories</span>
                    <div className="space-y-2">
                      {github.recentRepos.slice(0, 4).map((repo) => (
                        <a
                          key={repo.name}
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800/80 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-zinc-200 truncate">{repo.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{repo.description}</p>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 ml-3">
                            <span>{repo.language}</span>
                            <ExternalLink className="w-3 h-3 text-zinc-500" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-zinc-500">
                  Connect your GitHub account to monitor repositories, commit volume, and language activity without gamified XP.
                </p>
                <Button size="sm" onClick={() => setIsGitHubModalOpen(true)}>
                  Connect GitHub
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* LeetCode Sync Modal */}
      <Modal
        isOpen={isLeetCodeModalOpen}
        onClose={() => setIsLeetCodeModalOpen(false)}
        title="Sync LeetCode Account"
        description="Enter your public LeetCode username to pull solved problems and submission streak."
      >
        <form onSubmit={handleSyncLeetCode} className="space-y-4">
          <Input
            label="LeetCode Username"
            value={leetcodeUsername}
            onChange={(e) => setLeetcodeUsername(e.target.value)}
            placeholder="e.g. tourist, neetcode"
            required
            autoFocus
          />

          <div className="pt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsLeetCodeModalOpen(false)}
              disabled={isSyncing}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSyncing}>
              Sync Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* GitHub Sync Modal */}
      <Modal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        title="Sync GitHub Activity"
        description="Enter your GitHub username (and optional Personal Access Token for private repos)."
      >
        <form onSubmit={handleSyncGitHub} className="space-y-4">
          <Input
            label="GitHub Username"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="e.g. octocat"
            required
            autoFocus
          />

          <Input
            type="password"
            label="Personal Access Token (optional)"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_..."
          />

          <div className="pt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsGitHubModalOpen(false)}
              disabled={isSyncing}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSyncing}>
              Sync GitHub
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
