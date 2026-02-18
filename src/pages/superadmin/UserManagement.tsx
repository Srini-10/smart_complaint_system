// @ts-nocheck
/**
 * User Management - Super Admin role assignment
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Users, Shield, User, Building2, Loader2 } from 'lucide-react';
import { getAllUsers, updateUserRole } from '@/services/users.service';
import { useDepartmentsStore } from '@/stores/departments.store';
import { subscribeToDepartments } from '@/services/departments.service';
import { formatDate, cn } from '@/lib/utils';
import type { User as UserType, UserRole } from '@/types';

const ROLE_COLORS: Record<UserRole, string> = {
    user: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function UserManagement() {
    const [users, setUsers] = useState<UserType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const { departments, setDepartments } = useDepartmentsStore();

    useEffect(() => {
        getAllUsers().then((u) => { setUsers(u); setIsLoading(false); });
        const unsub = subscribeToDepartments(setDepartments);
        return unsub;
    }, [setDepartments]);

    const handleRoleChange = async (uid: string, role: UserRole, departmentId?: string) => {
        setUpdating(uid);
        try {
            await updateUserRole(uid, role, departmentId);
            setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, role, departmentId } : u));
            toast.success('Role updated successfully');
        } catch {
            toast.error('Failed to update role');
        } finally {
            setUpdating(null);
        }
    };

    const filtered = users.filter((u) =>
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const RoleIcon = ({ role }: { role: UserRole }) => {
        if (role === 'super_admin') return <Shield className="w-4 h-4" />;
        if (role === 'admin') return <Building2 className="w-4 h-4" />;
        return <User className="w-4 h-4" />;
    };

    return (
        <div className="space-y-5 animate-slide-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{users.length} registered users</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg">
                    <Users className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 w-48"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">User</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current Role</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Change Role</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Department</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filtered.map((user) => (
                                    <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={cn('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium', ROLE_COLORS[user.role])}>
                                                <RoleIcon role={user.role} />
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    defaultValue={user.role}
                                                    onChange={(e) => {
                                                        const newRole = e.target.value as UserRole;
                                                        const deptId = newRole === 'admin' ? user.departmentId : undefined;
                                                        handleRoleChange(user.uid, newRole, deptId);
                                                    }}
                                                    disabled={updating === user.uid}
                                                    className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="super_admin">Super Admin</option>
                                                </select>
                                                {updating === user.uid && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {user.role === 'admin' ? (
                                                <select
                                                    defaultValue={user.departmentId ?? ''}
                                                    onChange={(e) => handleRoleChange(user.uid, 'admin', e.target.value || undefined)}
                                                    className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select dept...</option>
                                                    {departments.map((d) => (
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(user.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
