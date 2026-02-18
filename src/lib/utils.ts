import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';
import type { ComplaintCategory, ComplaintStatus, Priority } from '@/types';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
    return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: Date | string): string {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function timeAgo(date: Date | string): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getPriorityColor(priority: Priority): string {
    const colors: Record<Priority, string> = {
        urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
        normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    };
    return colors[priority];
}

export function getStatusColor(status: ComplaintStatus): string {
    const colors: Record<ComplaintStatus, string> = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
    };
    return colors[status];
}

export function getCategoryIcon(category: ComplaintCategory): string {
    const icons: Record<ComplaintCategory, string> = {
        water: '💧',
        electrical: '⚡',
        internet: '🌐',
        infrastructure: '🏗️',
        sanitation: '🧹',
        security: '🔒',
        maintenance: '🔧',
        other: '📋',
    };
    return icons[category];
}

export function getCategoryLabel(category: ComplaintCategory): string {
    const labels: Record<ComplaintCategory, string> = {
        water: 'Water & Plumbing',
        electrical: 'Electrical',
        internet: 'Internet & Network',
        infrastructure: 'Infrastructure',
        sanitation: 'Sanitation',
        security: 'Security',
        maintenance: 'Maintenance',
        other: 'Other',
    };
    return labels[category];
}

export function getStatusLabel(status: ComplaintStatus): string {
    const labels: Record<ComplaintStatus, string> = {
        pending: 'Pending',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed',
    };
    return labels[status];
}

export function getPriorityLabel(priority: Priority): string {
    const labels: Record<Priority, string> = {
        urgent: 'Urgent',
        high: 'High',
        normal: 'Normal',
        low: 'Low',
    };
    return labels[priority];
}

export function truncate(str: string, length: number): string {
    return str.length > length ? `${str.slice(0, length)}...` : str;
}

export function generateId(): string {
    return Math.random().toString(36).slice(2, 11);
}

export function calculateSLADeadline(createdAt: Date, slaHours: number): Date {
    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + slaHours);
    return deadline;
}

export function isSLABreached(deadline: Date): boolean {
    return new Date() > deadline;
}

export function getSLAStatus(deadline: Date): 'ok' | 'warning' | 'breached' {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hoursLeft = diff / (1000 * 60 * 60);

    if (hoursLeft < 0) return 'breached';
    if (hoursLeft < 4) return 'warning';
    return 'ok';
}
