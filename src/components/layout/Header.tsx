// @ts-nocheck
/**
 * Header - Top bar with dark mode, notifications, menu toggle
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, Bell, Search, CheckCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationsStore } from '@/stores/notifications.store';
import { subscribeToNotifications, markAllAsRead } from '@/services/notifications.service';
import NotificationList from '../notifications/NotificationList';
import { cn } from '@/lib/utils';

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user } = useAuthStore();
    const { notifications, unreadCount, setNotifications } = useNotificationsStore();
    const navigate = useNavigate();
    const notificationRef = useRef<HTMLDivElement>(null);

    const [isDark, setIsDark] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToNotifications(user.uid, (data) => {
            setNotifications(data);
        });
        return unsub;
    }, [user, setNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/my-complaints?search=${encodeURIComponent(searchTerm)}`);
        }
    };

    const handleMarkAllRead = async () => {
        if (user) {
            await markAllAsRead(user.uid);
        }
    };

    return (
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
                {/* Left: Menu + Search */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Search bar */}
                    <form onSubmit={handleSearch} className={cn(
                        'hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm transition-all',
                        searchOpen ? 'w-64' : 'w-48'
                    )}>
                        <Search className="w-4 h-4 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Search complaints..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setSearchOpen(true)}
                            onBlur={() => setSearchOpen(false)}
                            className="bg-transparent outline-none w-full placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                        />
                    </form>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className={cn(
                                "relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition",
                                notificationsOpen && "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
                            )}
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {notificationsOpen && (
                            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                                        >
                                            <CheckCheck className="w-3 h-3" />
                                            Mark all as read
                                        </button>
                                    )}
                                </div>
                                <NotificationList
                                    notifications={notifications}
                                    onClose={() => setNotificationsOpen(false)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Dark mode toggle */}
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        aria-label="Toggle dark mode"
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            user?.name?.charAt(0).toUpperCase() ?? 'U'
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
