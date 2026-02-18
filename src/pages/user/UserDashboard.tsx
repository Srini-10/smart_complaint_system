/**
 * User Dashboard - Complaint tracking overview
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle2, AlertCircle, XCircle, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useComplaintsStore } from '@/stores/complaints.store';
import { subscribeToUserComplaints } from '@/services/complaints.service';
import { getCategoryIcon, getCategoryLabel, getPriorityColor, getStatusColor, getStatusLabel, timeAgo } from '@/lib/utils';
import type { Complaint } from '@/types';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            </div>
        </div>
    );
}

function ComplaintRow({ complaint }: { complaint: Complaint }) {
    return (
        <Link
            to={`/complaint/${complaint.id}`}
            className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition group"
        >
            <span className="text-2xl">{getCategoryIcon(complaint.category)}</span>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {complaint.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{getCategoryLabel(complaint.category)} • {timeAgo(complaint.createdAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getStatusColor(complaint.status)}`}>
                    {getStatusLabel(complaint.status)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority}
                </span>
            </div>
        </Link>
    );
}

export default function UserDashboard() {
    const { user } = useAuthStore();
    const { complaints, setComplaints } = useComplaintsStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToUserComplaints(user.uid, (data) => {
            setComplaints(data);
            setIsLoading(false);
        });
        return unsub;
    }, [user, setComplaints]);

    const stats = {
        total: complaints.length,
        pending: complaints.filter((c) => c.status === 'pending').length,
        inProgress: complaints.filter((c) => c.status === 'in_progress').length,
        resolved: complaints.filter((c) => c.status === 'resolved').length,
    };

    const recent = complaints.slice(0, 5);

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage your complaints</p>
                </div>
                <Link
                    to="/submit"
                    className="inline-flex items-center gap-2 px-4 py-2.5 gradient-primary text-white font-semibold rounded-lg hover:opacity-90 transition shadow-sm"
                >
                    <PlusCircle className="w-4 h-4" />
                    New Complaint
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total" value={stats.total} icon={TrendingUp} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
                <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" />
                <StatCard label="In Progress" value={stats.inProgress} icon={AlertCircle} color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />
                <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
            </div>

            {/* Recent Complaints */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Complaints</h2>
                    <Link to="/my-complaints" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline">View all</Link>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        Loading complaints...
                    </div>
                ) : recent.length === 0 ? (
                    <div className="p-12 text-center">
                        <XCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No complaints yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Submit your first complaint to get started</p>
                        <Link to="/submit" className="inline-flex items-center gap-2 mt-4 px-4 py-2 gradient-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
                            <PlusCircle className="w-4 h-4" />
                            Submit Complaint
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {recent.map((c) => <ComplaintRow key={c.id} complaint={c} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
