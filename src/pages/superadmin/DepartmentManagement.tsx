/**
 * Department Management - Super Admin CRUD for departments
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Building2, X, Loader2, Check } from 'lucide-react';
import { useDepartmentsStore } from '@/stores/departments.store';
import {
    subscribeToDepartments, createDepartment, updateDepartment, deleteDepartment
} from '@/services/departments.service';
import { getCategoryLabel, cn } from '@/lib/utils';
import type { Department, ComplaintCategory } from '@/types';

const CATEGORIES: ComplaintCategory[] = [
    'water', 'electrical', 'internet', 'infrastructure', 'sanitation', 'security', 'maintenance', 'other'
];

const schema = z.object({
    name: z.string().min(2, 'Name required'),
    description: z.string().min(5, 'Description required'),
    location: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    slaHours: z.number().min(1).max(720),
    categories: z.array(z.string()).min(1, 'Select at least one category'),
});

type FormData = z.infer<typeof schema>;

function DepartmentModal({
    dept,
    onClose,
    onSave,
}: {
    dept: Department | null;
    onClose: () => void;
    onSave: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: dept
            ? { ...dept, categories: dept.categories as string[] }
            : { slaHours: 48, categories: [] },
    });

    const selectedCategories = watch('categories') ?? [];

    const toggleCategory = (cat: ComplaintCategory) => {
        const current = selectedCategories as ComplaintCategory[];
        if (current.includes(cat)) {
            setValue('categories', current.filter((c) => c !== cat));
        } else {
            setValue('categories', [...current, cat]);
        }
    };

    const onSubmit = async (data: FormData) => {
        setSaving(true);
        try {
            if (dept) {
                await updateDepartment(dept.id, data as Parameters<typeof updateDepartment>[1]);
                toast.success('Department updated');
            } else {
                await createDepartment(data as Parameters<typeof createDepartment>[0]);
                toast.success('Department created');
            }
            onSave();
            onClose();
        } catch {
            toast.error('Failed to save department');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                        {dept ? 'Edit Department' : 'New Department'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                        <input {...register('name')} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                        <textarea {...register('description')} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input {...register('email')} type="email" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SLA Hours *</label>
                            <input {...register('slaHours', { valueAsNumber: true })} type="number" min={1} max={720} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => toggleCategory(cat)}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition',
                                        selectedCategories.includes(cat)
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'
                                    )}
                                >
                                    {selectedCategories.includes(cat) && <Check className="w-3 h-3" />}
                                    {getCategoryLabel(cat)}
                                </button>
                            ))}
                        </div>
                        {errors.categories && <p className="text-red-500 text-xs mt-1">{errors.categories.message}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="px-4 py-2 gradient-primary text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-60 transition flex items-center gap-2">
                            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                            {dept ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function DepartmentManagement() {
    const { departments, setDepartments } = useDepartmentsStore();
    const [modal, setModal] = useState<{ open: boolean; dept: Department | null }>({ open: false, dept: null });

    useEffect(() => {
        const unsub = subscribeToDepartments(setDepartments);
        return unsub;
    }, [setDepartments]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete department "${name}"? This cannot be undone.`)) return;
        try {
            await deleteDepartment(id);
            toast.success('Department deleted');
        } catch {
            toast.error('Failed to delete department');
        }
    };

    return (
        <div className="space-y-5 animate-slide-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{departments.length} department{departments.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => setModal({ open: true, dept: null })}
                    className="inline-flex items-center gap-2 px-4 py-2.5 gradient-primary text-white font-semibold rounded-lg hover:opacity-90 transition"
                >
                    <Plus className="w-4 h-4" />
                    New Department
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                    <div key={dept.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">SLA: {dept.slaHours}h</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => setModal({ open: true, dept })} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(dept.id, dept.name)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{dept.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {dept.categories.map((cat) => (
                                <span key={cat} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                                    {getCategoryLabel(cat)}
                                </span>
                            ))}
                        </div>
                        {dept.email && <p className="text-xs text-gray-400 mt-2">{dept.email}</p>}
                    </div>
                ))}
            </div>

            {modal.open && (
                <DepartmentModal
                    dept={modal.dept}
                    onClose={() => setModal({ open: false, dept: null })}
                    onSave={() => { }}
                />
            )}
        </div>
    );
}
