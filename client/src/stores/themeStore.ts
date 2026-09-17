import { create } from 'zustand';

export type ThemeId = 'obsidian' | 'midnight' | 'carbon' | 'forest' | 'paper';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  primaryColor: string;
  bgColor: string;
  surfaceColor: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'obsidian',
    name: 'Obsidian Dark',
    description: 'Default Linear-grade dark pitch black with technical indigo accents',
    primaryColor: '#6366f1',
    bgColor: '#09090b',
    surfaceColor: '#121215',
    isDark: true
  },
  {
    id: 'midnight',
    name: 'Midnight Slate',
    description: 'Deep nautical navy and cyan palette for long evening study hours',
    primaryColor: '#38bdf8',
    bgColor: '#070a12',
    surfaceColor: '#0f172a',
    isDark: true
  },
  {
    id: 'carbon',
    name: 'Carbon Monochrome',
    description: 'Matte graphite with pure white typography and high technical contrast',
    primaryColor: '#e4e4e7',
    bgColor: '#141414',
    surfaceColor: '#1c1c1e',
    isDark: true
  },
  {
    id: 'forest',
    name: 'Forest Night',
    description: 'Calm evergreen dark mode with soft emerald accents to reduce eye strain',
    primaryColor: '#10b981',
    bgColor: '#080f0c',
    surfaceColor: '#0f1e17',
    isDark: true
  },
  {
    id: 'paper',
    name: 'Minimal Light (Paper)',
    description: 'Crisp Notion-style light mode with slate borders and deep charcoal text',
    primaryColor: '#4f46e5',
    bgColor: '#f8f9fa',
    surfaceColor: '#ffffff',
    isDark: false
  }
];

interface ThemeState {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const getInitialTheme = (): ThemeId => {
  if (typeof window === 'undefined') return 'obsidian';
  const saved = localStorage.getItem('nexus_theme') as ThemeId;
  if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
    return saved;
  }
  return 'obsidian';
};

export const applyThemeToDom = (themeId: ThemeId) => {
  const root = document.documentElement;
  root.setAttribute('data-theme', themeId);

  const themeConfig = THEME_OPTIONS.find((t) => t.id === themeId);
  if (themeConfig?.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>((set) => {
  const initialTheme = getInitialTheme();
  applyThemeToDom(initialTheme);

  return {
    currentTheme: initialTheme,
    setTheme: (theme: ThemeId) => {
      localStorage.setItem('nexus_theme', theme);
      applyThemeToDom(theme);
      set({ currentTheme: theme });
    }
  };
});
