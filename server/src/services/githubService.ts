import axios from 'axios';
import { Integration } from '../models/Integration';
import { logger } from '../utils/logger';

const GITHUB_API_BASE = 'https://api.github.com';

export const githubService = {
  /**
   * Syncs GitHub user activity, public repos, commits, and languages
   */
  async syncGitHub(userId: string, username: string, token?: string) {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'NEXUS-Student-OS'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // 1. Fetch user profile
      const userRes = await axios.get(`${GITHUB_API_BASE}/users/${username}`, { headers, timeout: 10000 });
      const publicRepos = userRes.data.public_repos || 0;

      // 2. Fetch recent repos
      const reposRes = await axios.get(
        `${GITHUB_API_BASE}/users/${username}/repos?sort=pushed&per_page=6`,
        { headers, timeout: 10000 }
      );

      const recentRepos = (reposRes.data || []).map((r: any) => ({
        name: r.name,
        description: r.description || 'No description provided.',
        language: r.language || 'Code',
        stars: r.stargazers_count || 0,
        updatedAt: r.pushed_at,
        url: r.html_url
      }));

      // 3. Fetch user public events to compute weekly commits
      let weeklyCommits = 0;
      const languagesMap: Record<string, number> = {};

      try {
        const eventsRes = await axios.get(
          `${GITHUB_API_BASE}/users/${username}/events/public?per_page=50`,
          { headers, timeout: 10000 }
        );

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        for (const ev of eventsRes.data || []) {
          const evDate = new Date(ev.created_at);
          if (ev.type === 'PushEvent' && evDate >= oneWeekAgo) {
            const commitCount = ev.payload?.commits?.length || 1;
            weeklyCommits += commitCount;
          }
        }
      } catch (evErr: any) {
        logger.warn('Failed to parse public events for commits:', evErr.message);
      }

      // Compute language distribution from top repos
      for (const repo of recentRepos) {
        if (repo.language && repo.language !== 'Code') {
          languagesMap[repo.language] = (languagesMap[repo.language] || 0) + 1;
        }
      }

      const totalLangs = Object.values(languagesMap).reduce((a, b) => a + b, 0) || 1;
      const languages = Object.entries(languagesMap).map(([name, count]) => ({
        name,
        percentage: Math.round((count / totalLangs) * 100)
      }));

      // Update Integration
      const integration = await Integration.findOneAndUpdate(
        { userId },
        {
          $set: {
            'github.connected': true,
            'github.username': username,
            'github.accessToken': token || undefined,
            'github.lastSyncedAt': new Date(),
            'github.reposCount': publicRepos,
            'github.weeklyCommits': weeklyCommits,
            'github.totalCommitsYear': weeklyCommits * 4, // estimate
            'github.recentRepos': recentRepos,
            'github.languages': languages
          }
        },
        { upsert: true, new: true }
      );

      return integration.github;
    } catch (err: any) {
      logger.error('GitHub sync failed:', err.message);
      throw new Error(`Unable to sync GitHub: ${err.message}`);
    }
  }
};
