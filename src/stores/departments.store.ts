/**
 * Departments Zustand Store
 */

import { create } from 'zustand';
import type { Department, Category } from '@/types';

interface DepartmentsState {
    departments: Department[];
    categories: Category[];
    isLoading: boolean;

    setDepartments: (departments: Department[]) => void;
    addDepartment: (department: Department) => void;
    updateDepartment: (id: string, updates: Partial<Department>) => void;
    removeDepartment: (id: string) => void;
    setCategories: (categories: Category[]) => void;
    setLoading: (loading: boolean) => void;
}

export const useDepartmentsStore = create<DepartmentsState>((set) => ({
    departments: [],
    categories: [],
    isLoading: false,

    setDepartments: (departments) => set({ departments }),

    addDepartment: (department) =>
        set((state) => ({ departments: [...state.departments, department] })),

    updateDepartment: (id, updates) =>
        set((state) => ({
            departments: state.departments.map((d) =>
                d.id === id ? { ...d, ...updates } : d
            ),
        })),

    removeDepartment: (id) =>
        set((state) => ({
            departments: state.departments.filter((d) => d.id !== id),
        })),

    setCategories: (categories) => set({ categories }),

    setLoading: (isLoading) => set({ isLoading }),
}));
