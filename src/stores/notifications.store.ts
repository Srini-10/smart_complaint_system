/**
 * Notifications Zustand Store
 */

import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;

    // Actions
    setNotifications: (notifications: Notification[]) => void;
    setLoading: (loading: boolean) => void;
    clearNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: true,

    setNotifications: (notifications) => set({
        notifications,
        unreadCount: notifications.filter(n => !n.isRead).length,
        isLoading: false
    }),

    setLoading: (isLoading) => set({ isLoading }),

    clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
