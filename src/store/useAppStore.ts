/* ============================================================
   App Store — SPEC §7
   Manages modals, toasts, drawers, density override,
   command palette, and demo mode.
   ============================================================ */

import { create } from 'zustand';
import type { Toast, ModalDescriptor, DrawerDescriptor } from '../types';

interface AppState {
  // Modal stack
  modals: ModalDescriptor[];
  openModal: (modal: ModalDescriptor) => void;
  closeModal: (id?: string) => void;
  closeAllModals: () => void;

  // Toast queue
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Drawer
  drawer: DrawerDescriptor | null;
  openDrawer: (drawer: DrawerDescriptor) => void;
  closeDrawer: () => void;

  // Density override (per-table)
  densityOverride: string | null;
  setDensityOverride: (density: string | null) => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  // Demo mode
  demoMode: boolean;
  setDemoMode: (on: boolean) => void;
}

let toastCounter = 0;

export const useAppStore = create<AppState>()((set, get) => ({
  // === Modals ===
  modals: [],

  openModal: (modal) =>
    set((state) => ({
      modals: [...state.modals, modal],
    })),

  closeModal: (id) =>
    set((state) => {
      if (id) {
        return { modals: state.modals.filter((m) => m.id !== id) };
      }
      // Close topmost
      return { modals: state.modals.slice(0, -1) };
    }),

  closeAllModals: () => set({ modals: [] }),

  // === Toasts ===
  toasts: [],

  pushToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    const fullToast: Toast = { ...toast, id };
    set((state) => ({
      toasts: [...state.toasts, fullToast],
    }));

    // Auto dismiss
    setTimeout(() => {
      get().dismissToast(id);
    }, toast.duration || 3000);
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // === Drawer ===
  drawer: null,
  openDrawer: (drawer) => set({ drawer }),
  closeDrawer: () => set({ drawer: null }),

  // === Density Override ===
  densityOverride: null,
  setDensityOverride: (density) => set({ densityOverride: density }),

  // === Command Palette ===
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  // === Demo Mode ===
  demoMode: false,
  setDemoMode: (on) => set({ demoMode: on }),
}));
