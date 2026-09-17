import React, { useEffect } from 'react';
import { X, Play, Pause, CheckCircle, Volume2, VolumeX, Music } from 'lucide-react';
import { useFocusStore } from '../../stores/focusStore';
import { useUIStore } from '../../stores/uiStore';
import { useSpotifyStore } from '../../stores/spotifyStore';
import { Button } from '../ui/Button';

export const FocusOverlay: React.FC = () => {
  const { isFocusModeOpen, setFocusModeOpen } = useUIStore();
  const { isPlaying: isSpotifyPlaying, togglePlay: toggleSpotifyPlay, play: playSpotify, pause: pauseSpotify } = useSpotifyStore();
  const {
    isActive,
    isPaused,
    secondsRemaining,
    durationMinutes,
    selectedTaskTitle,
    selectedCourseCode,
    ambientSound,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    tick,
    setAmbientSound,
    completeSession
  } = useFocusStore();

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, tick]);

  if (!isFocusModeOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = ((durationMinutes * 60 - secondsRemaining) / (durationMinutes * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 md:p-12 bg-[#09090b] text-zinc-100 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
            NEXUS FOCUS
          </span>
        </div>
        <button
          onClick={() => setFocusModeOpen(false)}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          title="Minimize Focus Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Focus Center */}
      <div className="flex flex-col items-center justify-center text-center max-w-md w-full">
        {/* Context Task */}
        <div className="mb-6 space-y-1">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            {selectedCourseCode}
          </span>
          <h2 className="text-lg md:text-xl font-medium text-zinc-200 mt-2 truncate max-w-sm">
            {selectedTaskTitle}
          </h2>
        </div>

        {/* Large Minimalist Timer */}
        <div className="relative flex items-center justify-center my-4">
          <span className="text-7xl md:text-8xl font-mono font-light tracking-tighter text-zinc-100 tabular-nums">
            {formattedTime}
          </span>
        </div>

        {/* Progress Line */}
        <div className="w-64 h-1 bg-zinc-900 rounded-full overflow-hidden my-6 border border-zinc-800">
          <div
            className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Audio / Spotify Selector */}
        <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 px-4 py-2 rounded-full mb-8">
          <Music className="w-4 h-4 text-indigo-400" />
          <select
            value={ambientSound}
            onChange={(e) => setAmbientSound(e.target.value)}
            className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="binaural_40hz" className="bg-zinc-900">♫ Gamma Focus (40Hz)</option>
            <option value="lofi_midnight" className="bg-zinc-900">♫ Midnight Lofi Library</option>
            <option value="deep_rain" className="bg-zinc-900">♫ Calm Nordic Rain</option>
            <option value="spotify" className="bg-zinc-900">♫ Spotify Sync</option>
          </select>
          <button
            onClick={toggleSpotifyPlay}
            className="text-zinc-400 hover:text-zinc-200 p-1"
            title={isSpotifyPlaying ? 'Mute' : 'Play Sound'}
          >
            {isSpotifyPlaying ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-4">
          {!isActive ? (
            <Button
              size="lg"
              onClick={() => {
                startSession({ durationMinutes: 50 });
                playSpotify();
              }}
              className="px-8 bg-zinc-100 text-zinc-950 font-medium hover:bg-white"
            >
              <Play className="w-4 h-4 fill-zinc-950 mr-2" /> Start 50m Session
            </Button>
          ) : isPaused ? (
            <Button
              size="lg"
              onClick={() => {
                resumeSession();
                playSpotify();
              }}
              className="px-8"
            >
              <Play className="w-4 h-4 mr-2" /> Resume
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                pauseSession();
                pauseSpotify();
              }}
              className="px-8"
            >
              <Pause className="w-4 h-4 mr-2" /> Pause Session
            </Button>
          )}

          {isActive && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => completeSession(true)}
              className="text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
              title="Complete & Log Session"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Complete
            </Button>
          )}
        </div>

        {/* Preset Durations when idle */}
        {!isActive && (
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => startSession({ durationMinutes: 25 })}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-900 transition-colors"
            >
              25m Pomodoro
            </button>
            <span className="text-zinc-700">·</span>
            <button
              onClick={() => startSession({ durationMinutes: 50 })}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-900 transition-colors"
            >
              50m Deep Work
            </button>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="text-center text-xs font-mono text-zinc-600">
        Press ESC or click ✕ to return to workspace without losing session
      </div>
    </div>
  );
};
