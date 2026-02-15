import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

type Appearance = 'light' | 'dark' | 'system';

interface UIStore {
    // ── Sidebar ────────────────────────────────────────────────────────────
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;

    // ── Appearance / Theme ─────────────────────────────────────────────────
    appearance: Appearance;
    setAppearance: (mode: Appearance) => void;

    // ── Profile Page ───────────────────────────────────────────────────────
    activeProfileTab: string;
    setActiveProfileTab: (tab: string) => void;

    // ── Mobile Navigation ──────────────────────────────────────────────────
    mobileNavOpen: boolean;
    setMobileNavOpen: (open: boolean) => void;
    toggleMobileNav: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useUIStore = create<UIStore>()(
    devtools(
        (set) => ({
            // Sidebar
            sidebarOpen: true,
            toggleSidebar: () =>
                set((state) => ({ sidebarOpen: !state.sidebarOpen }), undefined, 'toggleSidebar'),
            setSidebarOpen: (open) =>
                set({ sidebarOpen: open }, undefined, 'setSidebarOpen'),

            // Appearance
            appearance: 'light',
            setAppearance: (mode) =>
                set({ appearance: mode }, undefined, 'setAppearance'),

            // Profile tab
            activeProfileTab: 'overview',
            setActiveProfileTab: (tab) =>
                set({ activeProfileTab: tab }, undefined, 'setActiveProfileTab'),

            // Mobile navigation
            mobileNavOpen: false,
            setMobileNavOpen: (open) =>
                set({ mobileNavOpen: open }, undefined, 'setMobileNavOpen'),
            toggleMobileNav: () =>
                set((state) => ({ mobileNavOpen: !state.mobileNavOpen }), undefined, 'toggleMobileNav'),
        }),
        { name: 'UIStore' },
    ),
);
