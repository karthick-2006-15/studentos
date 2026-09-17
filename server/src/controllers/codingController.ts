import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Integration } from '../models/Integration';
import { leetcodeService } from '../services/leetcodeService';
import { githubService } from '../services/githubService';
import { AppError } from '../utils/AppError';

export const getCodingProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    let integration = await Integration.findOne({ userId });

    if (!integration) {
      integration = await Integration.create({ userId });
    }

    return res.status(200).json({
      success: true,
      github: integration.github,
      leetcode: integration.leetcode
    });
  } catch (err) {
    next(err);
  }
};

export const syncLeetCodeUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { username } = req.body;

    if (!username) return next(new AppError('LeetCode username is required', 400));

    const leetcodeData = await leetcodeService.syncLeetCode(userId!, username.trim());

    return res.status(200).json({
      success: true,
      message: `Synced LeetCode profile for @${username}`,
      leetcode: leetcodeData
    });
  } catch (err: any) {
    next(new AppError(err.message || 'Failed to sync LeetCode profile', 400));
  }
};

export const syncGitHubUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { username, token } = req.body;

    if (!username) return next(new AppError('GitHub username is required', 400));

    const githubData = await githubService.syncGitHub(userId!, username.trim(), token?.trim());

    return res.status(200).json({
      success: true,
      message: `Synced GitHub activity for @${username}`,
      github: githubData
    });
  } catch (err: any) {
    next(new AppError(err.message || 'Failed to sync GitHub profile', 400));
  }
};

export const disconnectCodingService = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { service } = req.params; // 'github' or 'leetcode'

    if (service !== 'github' && service !== 'leetcode') {
      return next(new AppError('Invalid service. Must be github or leetcode.', 400));
    }

    await Integration.updateOne(
      { userId },
      {
        $set: {
          [`${service}.connected`]: false,
          [`${service}.username`]: ''
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: `${service} disconnected`
    });
  } catch (err) {
    next(err);
  }
};
