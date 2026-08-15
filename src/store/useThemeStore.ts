/* ============================================================
   Theme Store — SPEC §2b
   Three states: Dark (default), Light, System.
   Persisted to localStorage under 'sentinel.theme'.
   Applied as a class on <html>.
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '../types';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  getEffectiveTheme: () => 'dark' | 'light';
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  let effective: 'dark' | 'light' = 'dark';

  if (theme === 'system') {
    effective = window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  } else {
    effective = theme;
  }

  if (effective === 'light') {
    root.classList.add('light');
  } else {
    root.classList.remove('light');
  }

  return effective;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark' as ThemeMode,

      setTheme: (theme: ThemeMode) => {
        applyTheme(theme);
        set({ theme });
      },

      getEffectiveTheme: () => {
        const { theme } = get();
        if (theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark';
        }
        return theme;
      },
    }),
    {
      name: 'sentinel.theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Apply theme on store rehydration
useThemeStore.persist.onFinishHydration((state) => {
  applyTheme(state.theme);
});

// Listen for system theme changes when in 'system' mode
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    const { theme } = useThemeStore.getState();
    if (theme === 'system') {
      applyTheme('system');
    }
  });
}
