/**
 * Notifications Firebase Service
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    writeBatch,
    getDocs,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification } from '@/types';

const COLLECTION = 'notifications';

function notificationFromDoc(id: string, data: Record<string, unknown>): Notification {
    return {
        id,
        userId: data.userId as string,
        title: data.title as string,
        message: data.message as string,
        type: data.type as Notification['type'],
        complaintId: data.complaintId as string | undefined,
        isRead: (data.isRead as boolean) ?? false,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    };
}

export async function createNotification(
    notification: Omit<Notification, 'id' | 'createdAt'>
): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
        ...notification,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export function subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
): Unsubscribe {
    const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map((d) =>
            notificationFromDoc(d.id, d.data() as Record<string, unknown>)
        );
        callback(notifications);
    }, (error) => {
        console.error("Error subscribing to notifications:", error);
    });
}

export async function markAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, notificationId);
    await updateDoc(docRef, { isRead: true });
}

export async function markAllAsRead(userId: string): Promise<void> {
    const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('isRead', '==', false)
    );

    const snap = await getDocs(q);
    const batch = writeBatch(db);

    snap.docs.forEach((d) => {
        batch.update(d.ref, { isRead: true });
    });

    await batch.commit();
}
