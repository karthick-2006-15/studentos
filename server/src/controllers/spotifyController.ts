import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Integration } from '../models/Integration';
import { spotifyService } from '../services/spotifyService';
import { AppError } from '../utils/AppError';

export const getPlaybackStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const playback = await spotifyService.getPlaybackState(userId!);

    return res.status(200).json({
      success: true,
      playback
    });
  } catch (err) {
    next(err);
  }
};

export const controlPlayer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { action } = req.body; // 'play' | 'pause' | 'next' | 'previous'

    if (!['play', 'pause', 'next', 'previous'].includes(action)) {
      return next(new AppError('Invalid playback action', 400));
    }

    const result = await spotifyService.controlPlayback(userId!, action);
    return res.status(200).json(result);
  } catch (err: any) {
    next(new AppError(err.message || 'Spotify control failed', 400));
  }
};

export const connectSpotifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { accessToken, refreshToken } = req.body;

    if (!accessToken) return next(new AppError('Access token required', 400));

    await Integration.findOneAndUpdate(
      { userId },
      {
        $set: {
          'spotify.connected': true,
          'spotify.accessToken': accessToken,
          'spotify.refreshToken': refreshToken || undefined,
          'spotify.lastSyncedAt': new Date()
        }
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Spotify connected successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const disconnectSpotify = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    await Integration.updateOne(
      { userId },
      {
        $set: {
          'spotify.connected': false,
          'spotify.accessToken': undefined,
          'spotify.refreshToken': undefined
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Spotify disconnected'
    });
  } catch (err) {
    next(err);
  }
};
