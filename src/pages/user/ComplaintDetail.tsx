// @ts-nocheck
/**
 * Complaint Detail - Full view with status timeline
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, XCircle, User, Building2, Sparkles } from 'lucide-react';
import { getComplaint } from '@/services/complaints.service';
import {
    getCategoryIcon, getCategoryLabel, getPriorityColor, getStatusColor,
    getStatusLabel, getPriorityLabel, formatDateTime, timeAgo, getSLAStatus, cn
} from '@/lib/utils';
import type { Complaint } from '@/types';

function StatusIcon({ status }: { status: string }) {
    if (status === 'resolved') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === 'in_progress') return <AlertCircle className="w-4 h-4 text-blue-500" />;
    if (status === 'closed') return <XCircle className="w-4 h-4 text-gray-400" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
}

export default function ComplaintDetail() {
    const { id } = useParams<{ id: string }>();
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        getComplaint(id).then((c) => {
            setComplaint(c);
            setIsLoading(false);
        });
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500 dark:text-gray-400">Complaint not found.</p>
                <Link to="/my-complaints" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-2 inline-block">
                    ← Back to complaints
                </Link>
            </div>
        );
    }

    const slaStatus = complaint.slaDeadline ? getSLAStatus(complaint.slaDeadline) : 'ok';

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
            {/* Back */}
            <Link to="/my-complaints" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
                <ArrowLeft className="w-4 h-4" />
                Back to complaints
            </Link>

            {/* Header */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                        <span className="text-3xl">{getCategoryIcon(complaint.category)}</span>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{complaint.title}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {getCategoryLabel(complaint.category)} • Submitted {timeAgo(complaint.createdAt)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium border', getStatusColor(complaint.status))}>
                            {getStatusLabel(complaint.status)}
                        </span>
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium border', getPriorityColor(complaint.priority))}>
                            {getPriorityLabel(complaint.priority)}
                        </span>
                    </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{complaint.description}</p>

                {/* Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-400">Department</p>
                            <p className="font-medium text-gray-900 dark:text-white">{complaint.departmentName || 'Unassigned'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-400">Assigned To</p>
                            <p className="font-medium text-gray-900 dark:text-white">{complaint.assignedAdminName || 'Unassigned'}</p>
                        </div>
                    </div>
                    {complaint.slaDeadline && (
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-400">SLA Deadline</p>
                                <p className={cn('font-medium', slaStatus === 'breached' ? 'text-red-600' : slaStatus === 'warning' ? 'text-orange-500' : 'text-gray-900 dark:text-white')}>
                                    {formatDateTime(complaint.slaDeadline)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* AI Info */}
                {complaint.aiConfidence > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI classified with {Math.round(complaint.aiConfidence * 100)}% confidence
                        {complaint.keywords.length > 0 && (
                            <span className="text-gray-500 dark:text-gray-400">
                                • Keywords: {complaint.keywords.slice(0, 4).join(', ')}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Images */}
            {complaint.images.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Attached Images</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {complaint.images.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={`Complaint image ${i + 1}`} className="w-full aspect-video object-cover rounded-lg hover:opacity-90 transition" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Resolution */}
            {complaint.resolutionNote && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
                    <h2 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Resolution Notes
                    </h2>
                    <p className="text-green-700 dark:text-green-400 text-sm">{complaint.resolutionNote}</p>
                    {complaint.resolvedAt && (
                        <p className="text-xs text-green-600 dark:text-green-500 mt-2">Resolved {formatDateTime(complaint.resolvedAt)}</p>
                    )}
                    {complaint.resolutionImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {complaint.resolutionImages.map((url, i) => (
                                <img key={i} src={url} alt="" className="w-full aspect-video object-cover rounded-lg" />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Status Timeline */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Status Timeline</h2>
                <div className="space-y-4">
                    {complaint.statusHistory.map((entry, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <StatusIcon status={entry.status} />
                                </div>
                                {i < complaint.statusHistory.length - 1 && (
                                    <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />
                                )}
                            </div>
                            <div className="pb-4">
                                <p className="font-medium text-gray-900 dark:text-white text-sm capitalize">
                                    {getStatusLabel(entry.status)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    by {entry.changedByName} • {formatDateTime(entry.changedAt)}
                                </p>
                                {entry.note && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                        {entry.note}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
