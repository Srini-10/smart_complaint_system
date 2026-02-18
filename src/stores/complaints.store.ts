/**
 * Complaints Zustand Store
 * Manages complaints state with real-time Firestore listeners
 */

import { create } from 'zustand';
import type { Complaint, ComplaintFilters } from '@/types';

interface ComplaintsState {
    complaints: Complaint[];
    selectedComplaint: Complaint | null;
    isLoading: boolean;
    filters: ComplaintFilters;
    totalCount: number;

    // Actions
    setComplaints: (complaints: Complaint[]) => void;
    addComplaint: (complaint: Complaint) => void;
    updateComplaint: (id: string, updates: Partial<Complaint>) => void;
    removeComplaint: (id: string) => void;
    setSelectedComplaint: (complaint: Complaint | null) => void;
    setLoading: (loading: boolean) => void;
    setFilters: (filters: ComplaintFilters) => void;
    clearFilters: () => void;
    setTotalCount: (count: number) => void;
}

export const useComplaintsStore = create<ComplaintsState>((set) => ({
    complaints: [],
    selectedComplaint: null,
    isLoading: false,
    filters: {},
    totalCount: 0,

    setComplaints: (complaints) => set({ complaints, totalCount: complaints.length }),

    addComplaint: (complaint) =>
        set((state) => ({
            complaints: [complaint, ...state.complaints],
            totalCount: state.totalCount + 1,
        })),

    updateComplaint: (id, updates) =>
        set((state) => ({
            complaints: state.complaints.map((c) =>
                c.id === id ? { ...c, ...updates } : c
            ),
            selectedComplaint:
                state.selectedComplaint?.id === id
                    ? { ...state.selectedComplaint, ...updates }
                    : state.selectedComplaint,
        })),

    removeComplaint: (id) =>
        set((state) => ({
            complaints: state.complaints.filter((c) => c.id !== id),
            totalCount: state.totalCount - 1,
        })),

    setSelectedComplaint: (selectedComplaint) => set({ selectedComplaint }),

    setLoading: (isLoading) => set({ isLoading }),

    setFilters: (filters) => set({ filters }),

    clearFilters: () => set({ filters: {} }),

    setTotalCount: (totalCount) => set({ totalCount }),
}));
