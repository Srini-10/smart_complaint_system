/**
 * Super Admin Dashboard - System-wide analytics
 */

import { useEffect, useState } from 'react';
import {
    Users, Building2, ClipboardList, TrendingUp, BarChart3, PieChart as PieIcon
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useComplaintsStore } from '@/stores/complaints.store';
import { useDepartmentsStore } from '@/stores/departments.store';
import { subscribeToAllComplaints } from '@/services/complaints.service';
import { subscribeToDepartments } from '@/services/departments.service';
import { getAllUsers } from '@/services/users.service';
import { getCategoryLabel } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import type { ComplaintCategory } from '@/types';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6b7280'];

export default function SuperAdminDashboard() {
    const { complaints, setComplaints } = useComplaintsStore();
    const { departments, setDepartments } = useDepartmentsStore();
    const [userCount, setUserCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsub1 = subscribeToAllComplaints((data) => {
            setComplaints(data);
            setIsLoading(false);
        });
        const unsub2 = subscribeToDepartments(setDepartments);
        getAllUsers().then((users) => setUserCount(users.length));
        return () => { unsub1(); unsub2(); };
    }, [setComplaints, setDepartments]);

    // Trend data: last 7 days
    const trendData = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const count = complaints.filter((c) =>
            format(new Date(c.createdAt), 'yyyy-MM-dd') === dateStr
        ).length;
        return { date: format(date, 'MMM d'), count };
    });

    // Department performance
    const deptData = departments.map((d) => {
        const deptComplaints = complaints.filter((c) => c.departmentId === d.id);
        const resolved = deptComplaints.filter((c) => c.status === 'resolved').length;
        return {
            name: d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name,
            total: deptComplaints.length,
            resolved,
            rate: deptComplaints.length > 0 ? Math.round((resolved / deptComplaints.length) * 100) : 0,
        };
    });

    // Category breakdown
    const categoryData = Object.entries(
        complaints.reduce((acc, c) => {
            acc[c.category] = (acc[c.category] ?? 0) + 1;
            return acc;
        }, {} as Record<ComplaintCategory, number>)
    ).map(([name, value]) => ({ name: getCategoryLabel(name as ComplaintCategory), value }));

    const stats = {
        total: complaints.length,
        resolved: complaints.filter((c) => c.status === 'resolved').length,
        pending: complaints.filter((c) => c.status === 'pending').length,
        departments: departments.length,
        users: userCount,
        resolutionRate: complaints.length > 0
            ? Math.round((complaints.filter((c) => c.status === 'resolved').length / complaints.length) * 100)
            : 0,
    };

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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Analytics</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Platform-wide complaint management overview</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Complaints', value: stats.total, icon: ClipboardList, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                    { label: 'Resolved', value: stats.resolved, icon: TrendingUp, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
                    { label: 'Pending', value: stats.pending, icon: BarChart3, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
                    { label: 'Departments', value: stats.departments, icon: Building2, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
                    { label: 'Users', value: stats.users, icon: Users, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Resolution Rate */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 text-sm font-medium">Overall Resolution Rate</p>
                        <p className="text-5xl font-bold mt-1">{stats.resolutionRate}%</p>
                        <p className="text-blue-200 text-sm mt-2">{stats.resolved} of {stats.total} complaints resolved</p>
                    </div>
                    <div className="w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center">
                        <span className="text-2xl font-bold">{stats.resolutionRate}%</span>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Complaint Trend (7 days)</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Pie */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <PieIcon className="w-5 h-5 text-blue-500" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Category Distribution</h2>
                    </div>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
                    )}
                </div>
            </div>

            {/* Department Performance */}
            {deptData.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Department Performance</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={deptData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
