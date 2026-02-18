/**
 * Admin Dashboard - Department metrics and complaint management
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ClipboardList, Clock, CheckCircle2, AlertTriangle, TrendingUp, BarChart3
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAuthStore } from '@/stores/auth.store';
import { useComplaintsStore } from '@/stores/complaints.store';
import { subscribeToDepartmentComplaints } from '@/services/complaints.service';
import { getCategoryLabel, getStatusLabel } from '@/lib/utils';
import type { ComplaintCategory } from '@/types';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6b7280'];

function StatCard({ label, value, icon: Icon, color, sub }: {
    label: string; value: number | string; icon: React.ElementType; color: string; sub?: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    );
}

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const { complaints, setComplaints } = useComplaintsStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.departmentId) return;
        const unsub = subscribeToDepartmentComplaints(user.departmentId, (data) => {
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
        urgent: complaints.filter((c) => c.priority === 'urgent').length,
    };

    // Resolution rate
    const resolutionRate = stats.total > 0
        ? Math.round((stats.resolved / stats.total) * 100)
        : 0;

    // Avg resolution time (hours)
    const resolved = complaints.filter((c) => c.resolvedAt);
    const avgResolutionHours = resolved.length > 0
        ? Math.round(
            resolved.reduce((sum: number, c: any) => {
                const diff = new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime();
                return sum + diff / (1000 * 60 * 60);
            }, 0) / resolved.length
        )
        : 0;

    // Category breakdown for pie chart
    const categoryData = Object.entries(
        complaints.reduce((acc: Record<string, number>, c: any) => {
            acc[c.category] = (acc[c.category] ?? 0) + 1;
            return acc;
        }, {} as Record<ComplaintCategory, number>)
    ).map(([name, value]) => ({ name: getCategoryLabel(name as ComplaintCategory), value }));

    // Status breakdown for bar chart
    const statusData = [
        { name: 'Pending', value: stats.pending },
        { name: 'In Progress', value: stats.inProgress },
        { name: 'Resolved', value: stats.resolved },
    ];

    // Recent urgent complaints
    const urgentComplaints = complaints
        .filter((c) => c.priority === 'urgent' && c.status !== 'resolved')
        .slice(0, 5);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Department complaint management overview</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Total" value={stats.total} icon={ClipboardList} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
                <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" />
                <StatCard label="In Progress" value={stats.inProgress} icon={TrendingUp} color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />
                <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" sub={`${resolutionRate}% rate`} />
                <StatCard label="Urgent" value={stats.urgent} icon={AlertTriangle} color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Bar Chart */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Status Breakdown</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={statusData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Pie Chart */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Category Distribution</h2>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {categoryData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
                    )}
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 text-center">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{resolutionRate}%</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Resolution Rate</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 text-center">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{avgResolutionHours}h</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Resolution Time</p>
                </div>
            </div>

            {/* Urgent Complaints */}
            {urgentComplaints.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Urgent Complaints Requiring Attention
                        </h2>
                        <Link to="/queue" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View queue</Link>
                    </div>
                    <div className="space-y-2">
                        {urgentComplaints.map((c) => (
                            <Link
                                key={c.id}
                                to={`/complaint/${c.id}`}
                                className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{c.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.userName} • {getStatusLabel(c.status)}</p>
                                </div>
                                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-medium">URGENT</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
