/**
 * Auth Zustand Store
 * Manages authentication state, user profile, and role
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    role: UserRole | null;

    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: true,
            isAuthenticated: false,
            role: null,

            setUser: (user) =>
                set({
                    user,
                    isAuthenticated: !!user,
                    role: user?.role ?? null,
                    isLoading: false,
                }),

            setLoading: (isLoading) => set({ isLoading }),

            logout: () =>
                set({
                    user: null,
                    isAuthenticated: false,
                    role: null,
                    isLoading: false,
                }),
        }),
        {
            name: 'auth-store',
            partialize: (state) => ({ user: state.user }),
        }
    )
);
