/**
 * Complaints Firebase Service
 * CRUD operations for complaints collection
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    type Unsubscribe,
    type QueryConstraint,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Complaint, ComplaintFormData, ComplaintStatus, ComplaintFilters, StatusHistory } from '@/types';
import { compressImage } from '@/lib/image-utils';
import { classifyComplaint } from '@/lib/ai-engine';
import { calculateSLADeadline } from '@/lib/utils';
import { createNotification } from './notifications.service';

const COLLECTION = 'complaints';

// Convert Firestore Timestamp to Date
function fromTimestamp(ts: Timestamp | Date | undefined): Date {
    if (!ts) return new Date();
    if (ts instanceof Timestamp) return ts.toDate();
    return ts;
}

function complaintFromDoc(id: string, data: Record<string, unknown>): Complaint {
    return {
        id,
        userId: data.userId as string,
        userName: data.userName as string,
        userEmail: data.userEmail as string,
        title: data.title as string,
        description: data.description as string,
        category: data.category as Complaint['category'],
        departmentId: data.departmentId as string,
        departmentName: data.departmentName as string,
        priority: data.priority as Complaint['priority'],
        status: data.status as ComplaintStatus,
        images: (data.images as string[]) ?? [],
        resolutionImages: (data.resolutionImages as string[]) ?? [],
        resolutionNote: data.resolutionNote as string | undefined,
        aiConfidence: (data.aiConfidence as number) ?? 0,
        aiSuggestedCategory: data.aiSuggestedCategory as Complaint['aiSuggestedCategory'],
        keywords: (data.keywords as string[]) ?? [],
        location: data.location as string | undefined,
        assignedAdminId: data.assignedAdminId as string | undefined,
        assignedAdminName: data.assignedAdminName as string | undefined,
        statusHistory: ((data.statusHistory as StatusHistory[]) ?? []).map((h) => ({
            ...h,
            changedAt: fromTimestamp(h.changedAt as unknown as Timestamp),
        })),
        slaDeadline: data.slaDeadline ? fromTimestamp(data.slaDeadline as Timestamp) : undefined,
        resolvedAt: data.resolvedAt ? fromTimestamp(data.resolvedAt as Timestamp) : undefined,
        closedAt: data.closedAt ? fromTimestamp(data.closedAt as Timestamp) : undefined,
        createdAt: fromTimestamp(data.createdAt as Timestamp),
        updatedAt: fromTimestamp(data.updatedAt as Timestamp),
    };
}

// Upload images to Firebase Storage
async function uploadImages(files: File[], complaintId: string): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
        const compressed = await compressImage(file);
        const storageRef = ref(storage, `complaints/${complaintId}/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, compressed);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
    }
    return urls;
}

// Create a new complaint
export async function createComplaint(
    formData: ComplaintFormData,
    userId: string,
    userName: string,
    userEmail: string,
    departments: { id: string; name: string; categories: string[]; slaHours: number }[]
): Promise<string> {
    // AI classification
    const aiResult = classifyComplaint(
        formData.title,
        formData.description,
        departments
    );

    const category = formData.category || aiResult.category;
    const priority = formData.priority || aiResult.priority;

    // Find department
    const dept = departments.find(
        (d) => d.id === aiResult.suggestedDepartmentId || d.categories.includes(category)
    ) ?? departments[0];

    const slaDeadline = dept ? calculateSLADeadline(new Date(), dept.slaHours) : undefined;

    const initialStatus: StatusHistory = {
        status: 'pending',
        changedAt: new Date(),
        changedBy: userId,
        changedByName: userName,
        note: 'Complaint submitted',
    };

    // Create doc first to get ID for image upload
    const docRef = await addDoc(collection(db, COLLECTION), {
        userId,
        userName,
        userEmail,
        title: formData.title,
        description: formData.description,
        category,
        departmentId: dept?.id ?? '',
        departmentName: dept?.name ?? '',
        priority,
        status: 'pending',
        images: [],
        resolutionImages: [],
        aiConfidence: aiResult.confidence,
        aiSuggestedCategory: aiResult.category,
        keywords: aiResult.keywords,
        location: formData.location ?? '',
        statusHistory: [{ ...initialStatus }],
        slaDeadline: slaDeadline ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Upload images if any
    if (formData.images.length > 0) {
        const imageUrls = await uploadImages(formData.images, docRef.id);
        await updateDoc(docRef, { images: imageUrls });
    }

    // Trigger notification
    await createNotification({
        userId,
        title: 'Complaint Registered',
        message: `Your complaint "${formData.title}" has been successfully registered.`,
        type: 'status_update',
        complaintId: docRef.id,
        isRead: false,
    });

    return docRef.id;
}

// Get a single complaint
export async function getComplaint(id: string): Promise<Complaint | null> {
    const docRef = doc(db, COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return complaintFromDoc(snap.id, snap.data() as Record<string, unknown>);
}

// Update complaint status
export async function updateComplaintStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    changedBy: string,
    changedByName: string,
    note?: string
): Promise<void> {
    const docRef = doc(db, COLLECTION, complaintId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Complaint not found');

    const data = snap.data();
    const history = (data.statusHistory ?? []) as StatusHistory[];

    const newEntry: StatusHistory = {
        status: newStatus,
        changedAt: new Date(),
        changedBy,
        changedByName,
        note,
    };

    const updates: Record<string, any> = {
        status: newStatus,
        statusHistory: [...history, { ...newEntry, changedAt: new Date() }],
        updatedAt: serverTimestamp(),
    };

    if (newStatus === 'resolved') updates.resolvedAt = serverTimestamp();
    if (newStatus === 'closed') updates.closedAt = serverTimestamp();
    if (note) updates.resolutionNote = note;

    await updateDoc(docRef, updates);

    // Trigger notification
    await createNotification({
        userId: data.userId as string,
        title: 'Complaint Status Updated',
        message: `Your complaint "${data.title}" status has been changed to ${newStatus.replace('_', ' ')}.`,
        type: 'status_update',
        complaintId: complaintId,
        isRead: false,
    });
}

// Upload resolution images
export async function addResolutionImages(
    complaintId: string,
    files: File[]
): Promise<string[]> {
    const urls = await uploadImages(files, `${complaintId}/resolution`);
    const docRef = doc(db, COLLECTION, complaintId);
    const snap = await getDoc(docRef);
    const existing = (snap.data()?.resolutionImages ?? []) as string[];
    await updateDoc(docRef, {
        resolutionImages: [...existing, ...urls],
        updatedAt: serverTimestamp(),
    });
    return urls;
}

// Real-time listener for user's complaints
export function subscribeToUserComplaints(
    userId: string,
    callback: (complaints: Complaint[]) => void
): Unsubscribe {
    const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snapshot: any) => {
        const complaints = snapshot.docs.map((d: any) =>
            complaintFromDoc(d.id, d.data() as Record<string, unknown>)
        );
        callback(complaints);
    }, (error) => {
        console.error("Error fetching user complaints:", error);
        // Fallback or notification could be handled here if callback supported error
        // For now, we just log it. To handle it in UI, we'd need to change the callback signature.
        // Let's call the callback with empty array to verify if it unblocks loading, 
        // but ideally we should expose the error.
        // Given the signature, we can't pass error. 
        // We will notify user via console.
    });
}

// Real-time listener for department complaints (admin)
export function subscribeToDepartmentComplaints(
    departmentId: string,
    callback: (complaints: Complaint[]) => void
): Unsubscribe {
    const q = query(
        collection(db, COLLECTION),
        where('departmentId', '==', departmentId),
        orderBy('createdAt', 'desc'),
        limit(100)
    );

    return onSnapshot(q, (snapshot: any) => {
        const complaints = snapshot.docs.map((d: any) =>
            complaintFromDoc(d.id, d.data() as Record<string, unknown>)
        );
        callback(complaints);
    });
}

// Real-time listener for all complaints (super admin)
export function subscribeToAllComplaints(
    callback: (complaints: Complaint[]) => void
): Unsubscribe {
    const q = query(
        collection(db, COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(200)
    );

    return onSnapshot(q, (snapshot) => {
        const complaints = snapshot.docs.map((d) =>
            complaintFromDoc(d.id, d.data() as Record<string, unknown>)
        );
        callback(complaints);
    });
}

// Get complaints with filters (for reports)
export async function getFilteredComplaints(filters: ComplaintFilters): Promise<Complaint[]> {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(500)];

    if (filters.status) constraints.push(where('status', '==', filters.status));
    if (filters.category) constraints.push(where('category', '==', filters.category));
    if (filters.priority) constraints.push(where('priority', '==', filters.priority));
    if (filters.departmentId) constraints.push(where('departmentId', '==', filters.departmentId));

    const q = query(collection(db, COLLECTION), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => complaintFromDoc(d.id, d.data() as Record<string, unknown>));
}

// Delete a complaint
export async function deleteComplaint(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}
