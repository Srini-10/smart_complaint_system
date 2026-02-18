/**
 * Users Firebase Service
 */

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    getDocs,
    collection,
    query,
    where,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, UserRole } from '@/types';

function fromTs(ts: Timestamp | Date | undefined): Date {
    if (!ts) return new Date();
    if (ts instanceof Timestamp) return ts.toDate();
    return ts;
}

function userFromDoc(id: string, data: Record<string, unknown>): User {
    return {
        uid: id,
        name: data.name as string,
        email: data.email as string,
        role: (data.role as UserRole) ?? 'user',
        departmentId: data.departmentId as string | undefined,
        photoURL: data.photoURL as string | undefined,
        phone: data.phone as string | undefined,
        createdAt: fromTs(data.createdAt as Timestamp),
        updatedAt: fromTs(data.updatedAt as Timestamp),
    };
}

// Create or update user profile
export async function createUserProfile(
    uid: string,
    name: string,
    email: string,
    role: UserRole = 'user',
    photoURL?: string
): Promise<User> {
    const userRef = doc(db, 'users', uid);
    const existing = await getDoc(userRef);

    if (existing.exists()) {
        const data = existing.data() as Record<string, unknown>;
        // Promote to admin if email matches
        if (email === 'admin@gmail.com' && data.role !== 'admin' && data.role !== 'super_admin') {
            await updateDoc(userRef, { role: 'admin', updatedAt: serverTimestamp() });
            return userFromDoc(uid, { ...data, role: 'admin' });
        }
        // Update last seen
        await updateDoc(userRef, { updatedAt: serverTimestamp() });
        return userFromDoc(uid, data);
    }

    const userData = {
        name,
        email,
        role: email === 'admin@gmail.com' ? 'admin' : role,
        photoURL: photoURL ?? null,
        departmentId: null,
        phone: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, userData);
    return { uid, name, email, role, photoURL, createdAt: new Date(), updatedAt: new Date() };
}

// Get user profile
export async function getUserProfile(uid: string): Promise<User | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return userFromDoc(snap.id, snap.data() as Record<string, unknown>);
}

// Update user role
export async function updateUserRole(
    uid: string,
    role: UserRole,
    departmentId?: string
): Promise<void> {
    const updates: Record<string, any> = { role, updatedAt: serverTimestamp() };
    if (departmentId !== undefined) updates.departmentId = departmentId;
    await updateDoc(doc(db, 'users', uid), updates);
}

// Get all users (super admin)
export async function getAllUsers(): Promise<User[]> {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d: any) => userFromDoc(d.id, d.data() as Record<string, unknown>));
}

// Get admins for a department
export async function getDepartmentAdmins(departmentId: string): Promise<User[]> {
    const q = query(
        collection(db, 'users'),
        where('role', '==', 'admin'),
        where('departmentId', '==', departmentId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => userFromDoc(d.id, d.data() as Record<string, unknown>));
}

// Update user profile
export async function updateUserProfile(
    uid: string,
    updates: Partial<Pick<User, 'name' | 'phone' | 'photoURL'>>
): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}
