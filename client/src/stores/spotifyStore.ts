import { create } from 'zustand';
import { api } from '../api/client';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  durationSeconds: number;
  type: 'spotify' | 'ambient' | 'lofi' | 'nature';
}

const DEFAULT_PLAYLIST: Track[] = [
  {
    id: 'track-1',
    title: 'Deep Work (40Hz Gamma Focus)',
    artist: 'NEXUS Acoustics',
    album: 'Cognitive Flow',
    durationSeconds: 240,
    type: 'ambient'
  },
  {
    id: 'track-2',
    title: 'Midnight Library Lo-Fi',
    artist: 'Chilled Student Beats',
    album: 'Exam Revision Sessions',
    durationSeconds: 195,
    type: 'lofi'
  },
  {
    id: 'track-3',
    title: 'Calm Nordic Rain & Thunder',
    artist: 'Ambient Focus Lab',
    album: 'Nature Acoustics',
    durationSeconds: 320,
    type: 'nature'
  },
  {
    id: 'track-4',
    title: 'Weightless Synthesis',
    artist: 'Marconi Ambient',
    album: 'Sound Therapy',
    durationSeconds: 280,
    type: 'ambient'
  }
];

interface SpotifyState {
  playlist: Track[];
  currentTrackIndex: number;
  currentTrack: Track;
  isPlaying: boolean;
  progressSeconds: number;
  volume: number;
  isMuted: boolean;
  isCollapsed: boolean;
  isSpotifyConnected: boolean;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleCollapsed: () => void;
  selectTrack: (track: Track) => void;
  fetchLivePlayback: () => Promise<void>;
  tick: () => void;
}

// Minimalist Web Audio Ambient Synthesizer for instant real sound
class AmbientAudioEngine {
  private audioCtx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private noiseNode: AudioNode | null = null;

  start(volume = 0.2) {
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.stop();

      const ctx = this.audioCtx;
      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(Math.min(0.3, volume * 0.25), ctx.currentTime);

      // 40Hz Binaural Beat carrier (200Hz left, 240Hz right)
      this.osc1 = ctx.createOscillator();
      this.osc1.type = 'sine';
      this.osc1.frequency.setValueAtTime(200, ctx.currentTime);

      this.osc2 = ctx.createOscillator();
      this.osc2.type = 'sine';
      this.osc2.frequency.setValueAtTime(240, ctx.currentTime);

      // Low pass filter for soothing sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);

      this.osc1.connect(filter);
      this.osc2.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);

      this.osc1.start();
      this.osc2.start();
    } catch {
      // Ignore audio context errors if browser policies restrict before user gesture
    }
  }

  setVolume(vol: number) {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(Math.min(0.3, vol * 0.25), this.audioCtx.currentTime);
    }
  }

  stop() {
    try {
      if (this.osc1) {
        this.osc1.stop();
        this.osc1.disconnect();
        this.osc1 = null;
      }
      if (this.osc2) {
        this.osc2.stop();
        this.osc2.disconnect();
        this.osc2 = null;
      }
    } catch {
      // ignore
    }
  }
}

const audioEngine = new AmbientAudioEngine();

export const useSpotifyStore = create<SpotifyState>((set, get) => ({
  playlist: DEFAULT_PLAYLIST,
  currentTrackIndex: 0,
  currentTrack: DEFAULT_PLAYLIST[0],
  isPlaying: false,
  progressSeconds: 0,
  volume: 0.7,
  isMuted: false,
  isCollapsed: false,
  isSpotifyConnected: false,

  play: () => {
    const { volume, isMuted } = get();
    audioEngine.start(isMuted ? 0 : volume);
    set({ isPlaying: true });
  },

  pause: () => {
    audioEngine.stop();
    set({ isPlaying: false });
  },

  togglePlay: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  nextTrack: () => {
    const { playlist, currentTrackIndex, isPlaying, volume, isMuted } = get();
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    set({
      currentTrackIndex: nextIndex,
      currentTrack: playlist[nextIndex],
      progressSeconds: 0
    });
    if (isPlaying) {
      audioEngine.start(isMuted ? 0 : volume);
    }
  },

  previousTrack: () => {
    const { playlist, currentTrackIndex, isPlaying, volume, isMuted } = get();
    const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    set({
      currentTrackIndex: prevIndex,
      currentTrack: playlist[prevIndex],
      progressSeconds: 0
    });
    if (isPlaying) {
      audioEngine.start(isMuted ? 0 : volume);
    }
  },

  seek: (seconds: number) => {
    set({ progressSeconds: Math.max(0, seconds) });
  },

  setVolume: (vol: number) => {
    audioEngine.setVolume(vol);
    set({ volume: vol, isMuted: vol === 0 });
  },

  toggleMute: () => {
    const { isMuted, volume } = get();
    if (isMuted) {
      audioEngine.setVolume(volume || 0.5);
      set({ isMuted: false });
    } else {
      audioEngine.setVolume(0);
      set({ isMuted: true });
    }
  },

  toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),

  selectTrack: (track: Track) => {
    const { playlist, isPlaying, volume, isMuted } = get();
    const idx = playlist.findIndex((t) => t.id === track.id);
    set({
      currentTrackIndex: idx !== -1 ? idx : 0,
      currentTrack: track,
      progressSeconds: 0
    });
    if (isPlaying) {
      audioEngine.start(isMuted ? 0 : volume);
    }
  },

  fetchLivePlayback: async () => {
    try {
      const res = await api.get<{ success: boolean; playback: any }>('/spotify/playback');
      if (res.success && res.playback) {
        if (res.playback.connected && res.playback.currentTrack) {
          const liveTrack: Track = {
            id: 'live-spotify',
            title: res.playback.currentTrack.title,
            artist: res.playback.currentTrack.artist,
            album: res.playback.currentTrack.album,
            albumArt: res.playback.currentTrack.albumArt,
            durationSeconds: Math.round((res.playback.currentTrack.durationMs || 180000) / 1000),
            type: 'spotify'
          };
          set({
            isSpotifyConnected: true,
            currentTrack: liveTrack,
            isPlaying: res.playback.isPlaying ?? false
          });
        }
      }
    } catch {
      // fallback to ambient
    }
  },

  tick: () => {
    const { isPlaying, progressSeconds, currentTrack } = get();
    if (!isPlaying) return;

    if (progressSeconds >= currentTrack.durationSeconds) {
      get().nextTrack();
    } else {
      set({ progressSeconds: progressSeconds + 1 });
    }
  }
}));
