// @ts-nocheck
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2, Clock, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/types';
import { markAsRead } from '@/services/notifications.service';

interface NotificationListProps {
    notifications: Notification[];
    onClose: () => void;
}

export default function NotificationList({ notifications, onClose }: NotificationListProps) {
    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'status_update':
                return <Info className="w-4 h-4 text-blue-500" />;
            case 'assignment':
                return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'sla_breach':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await markAsRead(id);
    };

    if (notifications.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">We'll notify you when something happens</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    className={cn(
                        "p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition relative group",
                        !n.isRead && "bg-blue-50/30 dark:bg-blue-900/10"
                    )}
                >
                    <Link
                        to={n.complaintId ? `/complaint/${n.complaintId}` : '#'}
                        onClick={onClose}
                        className="flex gap-3"
                    >
                        <div className="mt-1 flex-shrink-0">
                            {getTypeIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className={cn(
                                    "text-sm font-semibold truncate pr-6",
                                    !n.isRead ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                                )}>
                                    {n.title}
                                </p>
                                {!n.isRead && (
                                    <button
                                        onClick={(e) => handleMarkAsRead(n.id, e)}
                                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-white dark:hover:bg-gray-700 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Mark as read"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {n.message}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {formatDate(n.createdAt)}
                            </div>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    );
}
