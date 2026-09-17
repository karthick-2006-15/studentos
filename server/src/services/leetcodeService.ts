import axios from 'axios';
import { Integration } from '../models/Integration';
import { aiService } from './aiService';
import { logger } from '../utils/logger';

const LEETCODE_API_URL = 'https://leetcode.com/graphql';

const USER_PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
        reputation
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

const RECENT_SUBMISSIONS_QUERY = `
  query getRecentSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
    }
  }
`;

const CALENDAR_QUERY = `
  query userProfileCalendar($username: String!) {
    matchedUser(username: $username) {
      userCalendar {
        streak
        totalActiveDays
        submissionCalendar
      }
    }
  }
`;

const SKILLS_QUERY = `
  query skillStats($username: String!) {
    matchedUser(username: $username) {
      tagProblemCounts {
        fundamental {
          tagName
          problemsSolved
        }
        intermediate {
          tagName
          problemsSolved
        }
        advanced {
          tagName
          problemsSolved
        }
      }
    }
  }
`;

export const leetcodeService = {
  /**
   * Syncs LeetCode profile directly from public GraphQL
   */
  async syncLeetCode(userId: string, username: string) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      };

      // 1. Fetch Profile & Counts
      const profileRes = await axios.post(
        LEETCODE_API_URL,
        { query: USER_PROFILE_QUERY, variables: { username } },
        { headers, timeout: 12000 }
      );

      const matchedUser = profileRes.data?.data?.matchedUser;
      if (!matchedUser) {
        throw new Error(`LeetCode user "${username}" not found.`);
      }

      const counts = matchedUser.submitStats?.acSubmissionNum || [];
      const totalSolved = counts.find((c: any) => c.difficulty === 'All')?.count || 0;
      const easySolved = counts.find((c: any) => c.difficulty === 'Easy')?.count || 0;
      const mediumSolved = counts.find((c: any) => c.difficulty === 'Medium')?.count || 0;
      const hardSolved = counts.find((c: any) => c.difficulty === 'Hard')?.count || 0;
      const ranking = matchedUser.profile?.ranking || 0;

      // 2. Fetch Recent Submissions
      let recentSubmissions = [];
      try {
        const subRes = await axios.post(
          LEETCODE_API_URL,
          { query: RECENT_SUBMISSIONS_QUERY, variables: { username, limit: 10 } },
          { headers, timeout: 8000 }
        );
        recentSubmissions = subRes.data?.data?.recentAcSubmissionList || [];
      } catch (err: any) {
        logger.warn('Failed to fetch recent submissions:', err.message);
      }

      // 3. Fetch Calendar & Streaks
      let streak = 0;
      let totalActiveDays = 0;
      try {
        const calRes = await axios.post(
          LEETCODE_API_URL,
          { query: CALENDAR_QUERY, variables: { username } },
          { headers, timeout: 8000 }
        );
        const cal = calRes.data?.data?.matchedUser?.userCalendar;
        if (cal) {
          streak = cal.streak || 0;
          totalActiveDays = cal.totalActiveDays || 0;
        }
      } catch (err: any) {
        logger.warn('Failed to fetch LeetCode calendar:', err.message);
      }

      // 4. Fetch Skill/Topic Stats
      const topicStats: Array<{ tagName: string; problemsSolved: number }> = [];
      try {
        const skillsRes = await axios.post(
          LEETCODE_API_URL,
          { query: SKILLS_QUERY, variables: { username } },
          { headers, timeout: 8000 }
        );
        const tags = skillsRes.data?.data?.matchedUser?.tagProblemCounts;
        if (tags) {
          const allTags = [
            ...(tags.fundamental || []),
            ...(tags.intermediate || []),
            ...(tags.advanced || [])
          ];
          for (const item of allTags) {
            topicStats.push({
              tagName: item.tagName,
              problemsSolved: item.problemsSolved
            });
          }
        }
      } catch (err: any) {
        logger.warn('Failed to fetch LeetCode skills:', err.message);
      }

      // 5. Run AI Weakness Analysis
      let weaknessAnalysis = {
        summary: 'Solve a mix of Arrays and Dynamic Programming to maintain your streak.',
        recommendedTopics: ['Dynamic Programming', 'Graph Theory'],
        suggestedProblemCount: 2
      };

      if (topicStats.length > 0) {
        try {
          const sortedTopics = [...topicStats].sort((a, b) => a.problemsSolved - b.problemsSolved);
          const weakest = sortedTopics.slice(0, 3).map(t => t.tagName);
          const strongest = sortedTopics.slice(-3).map(t => t.tagName);

          weaknessAnalysis = {
            summary: `Strong progress in ${strongest.join(', ')}. Practice more ${weakest.join(' & ')} to balance your DSA foundation.`,
            recommendedTopics: weakest,
            suggestedProblemCount: 2
          };
        } catch {
          // Keep fallback
        }
      }

      // Update Integration record
      const integration = await Integration.findOneAndUpdate(
        { userId },
        {
          $set: {
            'leetcode.connected': true,
            'leetcode.username': username,
            'leetcode.lastSyncedAt': new Date(),
            'leetcode.totalSolved': totalSolved,
            'leetcode.easySolved': easySolved,
            'leetcode.mediumSolved': mediumSolved,
            'leetcode.hardSolved': hardSolved,
            'leetcode.ranking': ranking,
            'leetcode.streak': streak,
            'leetcode.totalActiveDays': totalActiveDays,
            'leetcode.recentSubmissions': recentSubmissions,
            'leetcode.topicStats': topicStats.slice(0, 15),
            'leetcode.weaknessAnalysis': weaknessAnalysis
          }
        },
        { upsert: true, new: true }
      );

      return integration.leetcode;
    } catch (err: any) {
      logger.error('LeetCode sync failed:', err.message);
      throw new Error(`Unable to sync LeetCode: ${err.message}`);
    }
  }
};
