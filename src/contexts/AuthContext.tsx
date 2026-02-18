/**
 * AuthContext - Firebase Auth state management
 * Wraps the entire app to provide auth state
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { createUserProfile, getUserProfile } from '@/services/users.service';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@/types';

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { user, isLoading, setUser, setLoading, logout: clearUser } = useAuthStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            try {
                setError(null);
                if (firebaseUser) {
                    // Fetch full user profile from Firestore
                    const profile = await getUserProfile(firebaseUser.uid);
                    if (profile) {
                        setUser(profile);
                    } else {
                        // Create profile if it doesn't exist (e.g., Google sign-in)
                        const newUser = await createUserProfile(
                            firebaseUser.uid,
                            firebaseUser.displayName ?? 'User',
                            firebaseUser.email ?? '',
                            'user',
                            firebaseUser.photoURL ?? undefined
                        );
                        setUser(newUser);
                    }
                } else {
                    clearUser();
                }
            } catch (error: any) {
                console.error('Error syncing auth state:', error);
                if (error.code === 'unavailable' || error.message.includes('offline')) {
                    setError('Database connection failed. Please check your internet or Firestore configuration.');
                } else {
                    setError('Failed to load user profile.');
                }
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, [setUser, setLoading, clearUser]);

    const loginWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const loginWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider);
    };

    const register = async (name: string, email: string, password: string) => {
        const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(firebaseUser, { displayName: name });
        await createUserProfile(firebaseUser.uid, name, email, 'user');
    };

    const logout = async () => {
        await signOut(auth);
        clearUser();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, error, loginWithEmail, loginWithGoogle, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
