import { create } from 'zustand';

interface UIState {
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isAIAssistantOpen: boolean;
  setAIAssistantOpen: (open: boolean) => void;
  isFocusModeOpen: boolean;
  setFocusModeOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  isAIAssistantOpen: false,
  setAIAssistantOpen: (open) => set({ isAIAssistantOpen: open }),
  isFocusModeOpen: false,
  setFocusModeOpen: (open) => set({ isFocusModeOpen: open }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed })
}));
