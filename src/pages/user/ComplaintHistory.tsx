// @ts-nocheck
/**
 * Complaint History - Paginated list with search and filters
 */

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Download, Search, Filter, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useComplaintsStore } from '@/stores/complaints.store';
import { subscribeToUserComplaints } from '@/services/complaints.service';
import { exportComplaintsReport } from '@/lib/pdf-export';
import {
    cn,
    getCategoryLabel,
    getCategoryIcon,
    getStatusColor,
    getStatusLabel,
    getPriorityColor,
    getPriorityLabel,
    formatDate
} from '@/lib/utils';
import type { ComplaintStatus, ComplaintCategory, Priority } from '@/types';

const PAGE_SIZE = 10;

export default function ComplaintHistory() {
    const { user } = useAuthStore();
    const { complaints, setComplaints } = useComplaintsStore();
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');
    const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | ''>('');
    const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const query = searchParams.get('search');
        if (query) {
            setSearch(query);
            setPage(1);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!user) return;

        const timer = setTimeout(() => setIsLoading(false), 5000); // 5s timeout safety

        const unsub = subscribeToUserComplaints(user.uid, (data) => {
            setComplaints(data);
            setIsLoading(false);
            clearTimeout(timer);
        });
        return () => {
            unsub();
            clearTimeout(timer);
        };
    }, [user, setComplaints]);

    const filtered = complaints.filter((c) => {
        const matchSearch =
            !search ||
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.description.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || c.status === statusFilter;
        const matchCategory = !categoryFilter || c.category === categoryFilter;
        const matchPriority = !priorityFilter || c.priority === priorityFilter;
        return matchSearch && matchStatus && matchCategory && matchPriority;
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const selectClass = 'px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

    return (
        <div className="space-y-5 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Complaints</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{filtered.length} complaint{filtered.length !== 1 ? 's' : ''} found</p>
                </div>
                <button
                    onClick={() => exportComplaintsReport(filtered, 'My Complaints Report')}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                    <Download className="w-4 h-4" />
                    Export PDF
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-48">
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Search complaints..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as ComplaintStatus | ''); setPage(1); }} className={selectClass}>
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value as ComplaintCategory | ''); setPage(1); }} className={selectClass}>
                            <option value="">All Categories</option>
                            {(['water', 'electrical', 'internet', 'infrastructure', 'sanitation', 'security', 'maintenance', 'other'] as ComplaintCategory[]).map((c) => (
                                <option key={c} value={c}>{getCategoryLabel(c)}</option>
                            ))}
                        </select>
                        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value as Priority | ''); setPage(1); }} className={selectClass}>
                            <option value="">All Priorities</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="normal">Normal</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-400">Loading complaints...</p>
                    </div>
                ) : paginated.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <p className="font-medium">No complaints found</p>
                        <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {paginated.map((c) => (
                            <Link
                                key={c.id}
                                to={`/complaint/${c.id}`}
                                className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group"
                            >
                                <span className="text-2xl mt-0.5">{getCategoryIcon(c.category)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                        {c.title}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{c.description}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', getStatusColor(c.status))}>
                                            {getStatusLabel(c.status)}
                                        </span>
                                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', getPriorityColor(c.priority))}>
                                            {getPriorityLabel(c.priority)}
                                        </span>
                                        <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                                        {c.departmentName && (
                                            <span className="text-xs text-gray-400">• {c.departmentName}</span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
