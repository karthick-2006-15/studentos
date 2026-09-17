import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  ChevronDown,
  ChevronUp,
  Maximize2,
  ListMusic,
  Sliders
} from 'lucide-react';
import { useSpotifyStore, Track } from '../../stores/spotifyStore';
import { useUIStore } from '../../stores/uiStore';
import { useFocusStore } from '../../stores/focusStore';

export const SpotifyPlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    progressSeconds,
    volume,
    isMuted,
    isCollapsed,
    playlist,
    isSpotifyConnected,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleMute,
    toggleCollapsed,
    selectTrack,
    fetchLivePlayback,
    tick
  } = useSpotifyStore();

  const { setFocusModeOpen } = useUIStore();
  const { startSession } = useFocusStore();
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  // Poll live playback and tick progress
  useEffect(() => {
    fetchLivePlayback();
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchLivePlayback, tick]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.min(
    100,
    (progressSeconds / (currentTrack.durationSeconds || 180)) * 100
  );

  // If collapsed, show a sleek minimal floating pill in the bottom right
  if (isCollapsed) {
    return (
      <div className="fixed bottom-16 md:bottom-5 right-5 z-40 animate-in fade-in zoom-in-95 duration-150">
        <div
          onClick={toggleCollapsed}
          className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-[#121215]/95 hover:bg-[#18181c] border border-zinc-800 shadow-2xl cursor-pointer text-xs transition-all select-none backdrop-blur-md"
          title="Expand Spotify Player"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Music className="w-3 h-3" />
          </div>
          <span className="max-w-[120px] truncate font-medium text-zinc-200 text-xs">
            {currentTrack.title}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="p-1 rounded-full text-zinc-300 hover:text-white"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
          </button>
          <ChevronUp className="w-3 h-3 text-zinc-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-800/80 bg-[#0c0c0e]/95 backdrop-blur-md px-4 py-2 z-30 transition-all select-none relative">
      {/* Scrubber Progress Bar at top edge of the player */}
      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = clickX / rect.width;
          seek(Math.round(ratio * currentTrack.durationSeconds));
        }}
        className="absolute -top-1 left-0 right-0 h-1 bg-zinc-900 cursor-pointer group"
      >
        <div
          className="h-full bg-emerald-500 group-hover:bg-emerald-400 transition-all duration-300 ease-linear relative"
          style={{ width: `${progressPercent}%` }}
        >
          <span className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm transition-opacity" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* LEFT: Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:max-w-xs">
          <div className="relative w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            {currentTrack.albumArt ? (
              <img
                src={currentTrack.albumArt}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center ${
                  isPlaying ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500'
                }`}
              >
                <Music className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
              </div>
            )}
            {isPlaying && (
              <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-[#0c0c0e]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-zinc-100 truncate">{currentTrack.title}</p>
            </div>
            <p className="text-[11px] text-zinc-400 truncate">
              {currentTrack.artist}{' '}
              {isSpotifyConnected ? (
                <span className="text-[10px] text-emerald-400 font-mono">· Spotify</span>
              ) : (
                <span className="text-[10px] text-zinc-500 font-mono">· Focus Audio</span>
              )}
            </p>
          </div>
        </div>

        {/* CENTER: Playback Controls */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <button
              onClick={previousTrack}
              className="text-zinc-400 hover:text-zinc-100 p-1 rounded transition-colors"
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-950 hover:bg-white flex items-center justify-center transition-all shadow-sm active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="text-zinc-400 hover:text-zinc-100 p-1 rounded transition-colors"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Timestamp display */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
            <span>{formatTime(progressSeconds)}</span>
            <span>/</span>
            <span>{formatTime(currentTrack.durationSeconds)}</span>
          </div>
        </div>

        {/* RIGHT: Quick Focus Launcher & Volume & Playlist */}
        <div className="flex items-center gap-2.5">
          {/* Playlist Picker Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Study Audio Playlist"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Playlist Dropdown */}
            {isPlaylistOpen && (
              <div
                className="absolute bottom-10 right-0 w-64 p-2 rounded-xl bg-[#121215] border border-zinc-800 shadow-2xl space-y-1 text-xs z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-zinc-500 border-b border-zinc-800 mb-1">
                  Focus Audio Tracks
                </div>
                {playlist.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      selectTrack(t);
                      setIsPlaylistOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      currentTrack.id === t.id
                        ? 'bg-emerald-500/10 text-emerald-300 font-medium'
                        : 'text-zinc-300 hover:bg-zinc-850'
                    }`}
                  >
                    <div className="truncate min-w-0 pr-2">
                      <p className="truncate text-xs">{t.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{t.artist}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {formatTime(t.durationSeconds)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Volume Slider (desktop) */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-zinc-200 p-1"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Quick Focus Button */}
          <button
            onClick={() => {
              startSession({
                durationMinutes: 50,
                taskTitle: `Focus: ${currentTrack.title}`,
                courseCode: 'NEXUS'
              });
              setFocusModeOpen(true);
            }}
            className="hidden sm:flex items-center gap-1 text-[11px] font-medium bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 px-2.5 py-1.5 rounded-lg transition-colors"
            title="Launch Focus Mode with this track"
          >
            <Maximize2 className="w-3 h-3 text-indigo-400" /> Focus
          </button>

          {/* Collapse Player Bar */}
          <button
            onClick={toggleCollapsed}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-850 transition-colors"
            title="Minimize Player Bar"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
