// Core TypeScript type definitions for Smart Complaint System

export type UserRole = 'user' | 'admin' | 'super_admin';

export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

export type Priority = 'urgent' | 'high' | 'normal' | 'low';

export type ComplaintCategory =
    | 'water'
    | 'electrical'
    | 'internet'
    | 'infrastructure'
    | 'sanitation'
    | 'security'
    | 'maintenance'
    | 'other';

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    departmentId?: string; // for admins
    photoURL?: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Department ───────────────────────────────────────────────────────────────
export interface Department {
    id: string;
    name: string;
    description: string;
    categories: ComplaintCategory[];
    adminIds: string[];
    location?: string;
    email?: string;
    phone?: string;
    slaHours: number; // SLA in hours
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
    id: string;
    name: string;
    slug: ComplaintCategory;
    keywords: string[];
    departmentId: string;
    icon: string;
    description: string;
    isActive: boolean;
}

// ─── Complaint ────────────────────────────────────────────────────────────────
export interface StatusHistory {
    status: ComplaintStatus;
    changedAt: Date;
    changedBy: string;
    changedByName: string;
    note?: string;
}

export interface Complaint {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    title: string;
    description: string;
    category: ComplaintCategory;
    departmentId: string;
    departmentName: string;
    priority: Priority;
    status: ComplaintStatus;
    images: string[]; // Storage URLs
    resolutionImages: string[];
    resolutionNote?: string;
    aiConfidence: number; // 0-1
    aiSuggestedCategory?: ComplaintCategory;
    keywords: string[];
    location?: string;
    assignedAdminId?: string;
    assignedAdminName?: string;
    statusHistory: StatusHistory[];
    slaDeadline?: Date;
    resolvedAt?: Date;
    closedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface DailyMetrics {
    date: string; // YYYY-MM-DD
    departmentId: string;
    totalComplaints: number;
    resolvedComplaints: number;
    pendingComplaints: number;
    avgResolutionHours: number;
    slaBreaches: number;
    categoryBreakdown: Record<ComplaintCategory, number>;
    priorityBreakdown: Record<Priority, number>;
}

// ─── AI Engine ────────────────────────────────────────────────────────────────
export interface AIClassificationResult {
    category: ComplaintCategory;
    confidence: number;
    priority: Priority;
    keywords: string[];
    suggestedDepartmentId?: string;
}

export interface PatternInsight {
    category: ComplaintCategory;
    frequency: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    peakDays: string[];
    recommendation: string;
}

// ─── Form Types ───────────────────────────────────────────────────────────────
export interface ComplaintFormData {
    title: string;
    description: string;
    category: ComplaintCategory;
    priority: Priority;
    location?: string;
    images: File[];
}

export interface DepartmentFormData {
    name: string;
    description: string;
    categories: ComplaintCategory[];
    location?: string;
    email?: string;
    phone?: string;
    slaHours: number;
}

export interface LoginFormData {
    email: string;
    password: string;
}

export interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

// ─── Filter/Search ────────────────────────────────────────────────────────────
export interface ComplaintFilters {
    status?: ComplaintStatus;
    category?: ComplaintCategory;
    priority?: Priority;
    departmentId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'status_update' | 'assignment' | 'sla_breach' | 'system';
    complaintId?: string;
    isRead: boolean;
    createdAt: Date;
}
