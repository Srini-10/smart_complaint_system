/**
 * Complaint Queue - Admin complaint management with status updates
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, Filter, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useComplaintsStore } from '@/stores/complaints.store';
import { subscribeToDepartmentComplaints, updateComplaintStatus } from '@/services/complaints.service';
import {
    getCategoryIcon, getCategoryLabel, getPriorityColor, getStatusColor,
    getStatusLabel, timeAgo, cn
} from '@/lib/utils';
import type { ComplaintStatus, Complaint } from '@/types';

const STATUS_OPTIONS: ComplaintStatus[] = ['pending', 'in_progress', 'resolved', 'closed'];



function ComplaintCard({ complaint, onStatusUpdate }: {
    complaint: Complaint;
    onStatusUpdate: (id: string, status: ComplaintStatus, note: string) => Promise<void>;
}) {
    const [updating, setUpdating] = useState(false);
    const [showNote, setShowNote] = useState(false);
    const [note, setNote] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>(complaint.status);

    const handleUpdate = async () => {
        if (selectedStatus === complaint.status) return;
        setUpdating(true);
        await onStatusUpdate(complaint.id, selectedStatus, note);
        setUpdating(false);
        setShowNote(false);
        setNote('');
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">{getCategoryIcon(complaint.category)}</span>
                    <div>
                        <Link to={`/complaint/${complaint.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">
                            {complaint.title}
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {complaint.userName} • {getCategoryLabel(complaint.category)} • {timeAgo(complaint.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', getStatusColor(complaint.status))}>
                        {getStatusLabel(complaint.status)}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', getPriorityColor(complaint.priority))}>
                        {complaint.priority}
                    </span>
                </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{complaint.description}</p>

            {/* Status Update */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <select
                    value={selectedStatus}
                    onChange={(e) => {
                        setSelectedStatus(e.target.value as ComplaintStatus);
                        setShowNote(true);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{getStatusLabel(s)}</option>
                    ))}
                </select>

                {showNote && (
                    <input
                        type="text"
                        placeholder="Add a note (optional)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="flex-1 min-w-32 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                )}

                {selectedStatus !== complaint.status && (
                    <button
                        onClick={handleUpdate}
                        disabled={updating}
                        className="px-3 py-1.5 gradient-primary text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-60 transition flex items-center gap-1.5"
                    >
                        {updating && <Loader2 className="w-3 h-3 animate-spin" />}
                        Update
                    </button>
                )}
            </div>
        </div>
    );
}

export default function ComplaintQueue() {
    const { user } = useAuthStore();
    const { complaints, setComplaints } = useComplaintsStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('pending');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.departmentId) return;
        const unsub = subscribeToDepartmentComplaints(user.departmentId, (data) => {
            setComplaints(data);
            setIsLoading(false);
        });
        return unsub;
    }, [user, setComplaints]);

    const handleStatusUpdate = async (id: string, status: ComplaintStatus, note: string) => {
        if (!user) return;
        try {
            await updateComplaintStatus(id, status, user.uid, user.name, note || undefined);
            toast.success('Status updated successfully');
        } catch {
            toast.error('Failed to update status');
        }
    };

    const filtered = complaints.filter((c) => {
        const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.userName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="space-y-5 animate-slide-up">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complaint Queue</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{filtered.length} complaint{filtered.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-48">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by title or user..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    {(['', ...STATUS_OPTIONS] as (ComplaintStatus | '')[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-sm font-medium transition',
                                statusFilter === s
                                    ? 'gradient-primary text-white'
                                    : 'border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            )}
                        >
                            {s ? getStatusLabel(s) : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Complaints */}
            {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
                    <p className="font-medium">No complaints in this queue</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((c) => (
                        <ComplaintCard key={c.id} complaint={c} onStatusUpdate={handleStatusUpdate} />
                    ))}
                </div>
            )}
        </div>
    );
}
