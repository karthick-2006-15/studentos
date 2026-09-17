import axios from 'axios';
import { Integration } from '../models/Integration';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const spotifyService = {
  /**
   * Returns current Spotify playback status or fallback ambient status
   */
  async getPlaybackState(userId: string) {
    const integration = await Integration.findOne({ userId });
    if (!integration || !integration.spotify.connected || !integration.spotify.accessToken) {
      return {
        connected: false,
        ambientTracks: [
          { id: 'binaural_40hz', title: 'Gamma Focus (40Hz)', artist: 'NEXUS Acoustics', type: 'ambient' },
          { id: 'lofi_midnight', title: 'Midnight Library', artist: 'Lo-Fi Study Beats', type: 'lofi' },
          { id: 'deep_rain', title: 'Nordic Rain & Thunder', artist: 'Calm Spaces', type: 'nature' }
        ]
      };
    }

    try {
      const res = await axios.get('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${integration.spotify.accessToken}` },
        timeout: 5000
      });

      if (!res.data || !res.data.item) {
        return {
          connected: true,
          isPlaying: false,
          currentTrack: null
        };
      }

      const item = res.data.item;
      const playbackData = {
        connected: true,
        isPlaying: res.data.is_playing,
        currentTrack: {
          title: item.name,
          artist: (item.artists || []).map((a: any) => a.name).join(', '),
          album: item.album?.name,
          albumArt: item.album?.images?.[0]?.url,
          durationMs: item.duration_ms,
          progressMs: res.data.progress_ms
        }
      };

      // Cache current track in DB
      await Integration.updateOne(
        { userId },
        {
          $set: {
            'spotify.currentTrack': playbackData.currentTrack,
            'spotify.lastSyncedAt': new Date()
          }
        }
      );

      return playbackData;
    } catch (err: any) {
      logger.warn('Failed to get Spotify playback state:', err.message);
      return {
        connected: true,
        isPlaying: false,
        currentTrack: integration.spotify.currentTrack || null,
        error: 'Playback unavailable'
      };
    }
  },

  /**
   * Controls Spotify playback (play/pause/next)
   */
  async controlPlayback(userId: string, action: 'play' | 'pause' | 'next' | 'previous') {
    const integration = await Integration.findOne({ userId });
    if (!integration || !integration.spotify.accessToken) {
      throw new Error('Spotify not connected');
    }

    const endpointMap: Record<string, { method: 'put' | 'post'; url: string }> = {
      play: { method: 'put', url: 'https://api.spotify.com/v1/me/player/play' },
      pause: { method: 'put', url: 'https://api.spotify.com/v1/me/player/pause' },
      next: { method: 'post', url: 'https://api.spotify.com/v1/me/player/next' },
      previous: { method: 'post', url: 'https://api.spotify.com/v1/me/player/previous' }
    };

    const target = endpointMap[action];
    try {
      await axios({
        method: target.method,
        url: target.url,
        headers: { Authorization: `Bearer ${integration.spotify.accessToken}` }
      });
      return { success: true, action };
    } catch (err: any) {
      logger.warn(`Spotify control ${action} failed:`, err.message);
      throw new Error(`Spotify action failed: ${err.message}`);
    }
  }
};
