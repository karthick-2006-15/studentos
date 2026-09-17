import { create } from 'zustand';
import { api } from '../api/client';

interface FocusState {
  isActive: boolean;
  isPaused: boolean;
  durationMinutes: number;
  secondsRemaining: number;
  selectedTaskId: string | null;
  selectedTaskTitle: string;
  selectedCourseCode: string;
  ambientSound: string;
  isSoundPlaying: boolean;

  startSession: (params: {
    durationMinutes: number;
    taskId?: string;
    taskTitle?: string;
    courseCode?: string;
  }) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
  tick: () => void;
  setAmbientSound: (sound: string) => void;
  toggleSound: () => void;
  completeSession: (markTaskComplete?: boolean) => Promise<void>;
}

export const useFocusStore = create<FocusState>((set, get) => ({
  isActive: false,
  isPaused: false,
  durationMinutes: 50,
  secondsRemaining: 50 * 60,
  selectedTaskId: null,
  selectedTaskTitle: 'Deep Work Session',
  selectedCourseCode: 'NEXUS',
  ambientSound: 'binaural_40hz',
  isSoundPlaying: false,

  startSession: ({ durationMinutes, taskId, taskTitle, courseCode }) => {
    set({
      isActive: true,
      isPaused: false,
      durationMinutes,
      secondsRemaining: durationMinutes * 60,
      selectedTaskId: taskId || null,
      selectedTaskTitle: taskTitle || 'Deep Focus Session',
      selectedCourseCode: courseCode || 'NEXUS'
    });
  },

  pauseSession: () => set({ isPaused: true }),
  resumeSession: () => set({ isPaused: false }),
  stopSession: () => set({ isActive: false, isPaused: false, isSoundPlaying: false }),

  tick: () => {
    const { secondsRemaining, isActive, isPaused } = get();
    if (!isActive || isPaused) return;

    if (secondsRemaining <= 1) {
      get().completeSession(false);
    } else {
      set({ secondsRemaining: secondsRemaining - 1 });
    }
  },

  setAmbientSound: (sound: string) => set({ ambientSound: sound }),
  toggleSound: () => set((state) => ({ isSoundPlaying: !state.isSoundPlaying })),

  completeSession: async (markTaskComplete = true) => {
    const { durationMinutes, selectedTaskId, selectedTaskTitle } = get();
    try {
      await api.post('/study-plans/focus/log', {
        durationMinutes,
        taskId: selectedTaskId || undefined,
        taskTitle: selectedTaskTitle,
        musicTrack: get().ambientSound,
        markTaskComplete
      });
    } catch (err) {
      console.error('Failed to log focus session:', err);
    } finally {
      set({ isActive: false, isPaused: false, isSoundPlaying: false });
    }
  }
}));
