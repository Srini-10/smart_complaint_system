/**
 * Departments Firebase Service
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Department, DepartmentFormData, Category } from '@/types';

function fromTs(ts: Timestamp | Date | undefined): Date {
    if (!ts) return new Date();
    if (ts instanceof Timestamp) return ts.toDate();
    return ts;
}

function deptFromDoc(id: string, data: Record<string, unknown>): Department {
    return {
        id,
        name: data.name as string,
        description: data.description as string,
        categories: (data.categories as Department['categories']) ?? [],
        adminIds: (data.adminIds as string[]) ?? [],
        location: data.location as string | undefined,
        email: data.email as string | undefined,
        phone: data.phone as string | undefined,
        slaHours: (data.slaHours as number) ?? 48,
        isActive: (data.isActive as boolean) ?? true,
        createdAt: fromTs(data.createdAt as Timestamp),
        updatedAt: fromTs(data.updatedAt as Timestamp),
    };
}

// Create department
export async function createDepartment(formData: DepartmentFormData): Promise<string> {
    const docRef = await addDoc(collection(db, 'departments'), {
        ...formData,
        adminIds: [],
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

// Get all departments
export async function getDepartments(): Promise<Department[]> {
    const snap = await getDocs(collection(db, 'departments'));
    return snap.docs.map((d) => deptFromDoc(d.id, d.data() as Record<string, unknown>));
}

// Get single department
export async function getDepartment(id: string): Promise<Department | null> {
    const snap = await getDoc(doc(db, 'departments', id));
    if (!snap.exists()) return null;
    return deptFromDoc(snap.id, snap.data() as Record<string, unknown>);
}

// Update department
export async function updateDepartment(
    id: string,
    updates: Partial<DepartmentFormData>
): Promise<void> {
    await updateDoc(doc(db, 'departments', id), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

// Delete department
export async function deleteDepartment(id: string): Promise<void> {
    await deleteDoc(doc(db, 'departments', id));
}

// Add admin to department
export async function addAdminToDepartment(
    departmentId: string,
    adminId: string
): Promise<void> {
    const snap = await getDoc(doc(db, 'departments', departmentId));
    if (!snap.exists()) return;
    const adminIds = (snap.data().adminIds ?? []) as string[];
    if (!adminIds.includes(adminId)) {
        await updateDoc(doc(db, 'departments', departmentId), {
            adminIds: [...adminIds, adminId],
            updatedAt: serverTimestamp(),
        });
    }
}

// Real-time listener for departments
export function subscribeToDepartments(
    callback: (departments: Department[]) => void
): Unsubscribe {
    return onSnapshot(collection(db, 'departments'), (snapshot) => {
        const departments = snapshot.docs.map((d) =>
            deptFromDoc(d.id, d.data() as Record<string, unknown>)
        );
        callback(departments);
    });
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
    const snap = await getDocs(collection(db, 'categories'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
}

export async function createCategory(category: Omit<Category, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'categories'), category);
    return docRef.id;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    await updateDoc(doc(db, 'categories', id), updates);
}
