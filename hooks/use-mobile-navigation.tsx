"use client";
import { create } from 'zustand';

interface MobileNavigationState {
  isOpen: boolean;
  currentSection: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setSection: (section: string | null) => void;
}

export const useMobileNavigation = create<MobileNavigationState>((set) => ({
  isOpen: false,
  currentSection: null,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setSection: (section) => set({ currentSection: section }),
}));

export default useMobileNavigation;
