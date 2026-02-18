// @ts-nocheck
/**
 * Submit Complaint Page - Multi-step form with AI category suggestion
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import {
    Upload, X, Loader2, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, MapPin
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useDepartmentsStore } from '@/stores/departments.store';
import { createComplaint } from '@/services/complaints.service';
import { subscribeToDepartments } from '@/services/departments.service';
import { classifyComplaint } from '@/lib/ai-engine';
import { validateImageFile, fileToDataUrl } from '@/lib/image-utils';
import { getCategoryIcon, getCategoryLabel, getPriorityColor, cn } from '@/lib/utils';
import type { ComplaintCategory, Priority, AIClassificationResult } from '@/types';

const CATEGORIES: ComplaintCategory[] = [
    'water', 'electrical', 'internet', 'infrastructure', 'sanitation', 'security', 'maintenance', 'other'
];
const PRIORITIES: Priority[] = ['urgent', 'high', 'normal', 'low'];

const schema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(100),
    description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
    category: z.enum(['water', 'electrical', 'internet', 'infrastructure', 'sanitation', 'security', 'maintenance', 'other']),
    priority: z.enum(['urgent', 'high', 'normal', 'low']),
    location: z.string().optional(),
});

type FormData = any;

interface ImagePreview {
    file: File;
    preview: string;
}

export default function SubmitComplaint() {
    const { user } = useAuthStore();
    const { departments, setDepartments } = useDepartmentsStore();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [aiResult, setAiResult] = useState<AIClassificationResult | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        control,
        setValue,
        trigger,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { priority: 'normal', category: 'other' },
    });

    const title = watch('title');
    const description = watch('description');

    // Load departments
    useEffect(() => {
        const unsub = subscribeToDepartments(setDepartments);
        return unsub;
    }, [setDepartments]);

    // AI classification with debounce
    useEffect(() => {
        if (!title && !description) return;
        if ((title?.length ?? 0) < 5 && (description?.length ?? 0) < 10) return;

        setAiLoading(true);
        const timer = setTimeout(() => {
            const result = classifyComplaint(title ?? '', description ?? '', departments);
            setAiResult(result);
            setAiLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, [title, description, departments]);

    const applyAISuggestion = () => {
        if (!aiResult) return;
        setValue('category', aiResult.category);
        setValue('priority', aiResult.priority);
        toast.success('AI suggestion applied!');
    };

    // Image dropzone
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const valid: ImagePreview[] = [];
        for (const file of acceptedFiles) {
            const { valid: isValid, error } = validateImageFile(file);
            if (!isValid) { toast.error(error); continue; }
            const preview = await fileToDataUrl(file);
            valid.push({ file, preview });
        }
        setImages((prev) => [...prev, ...valid].slice(0, 5));
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 5,
    });

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: FormData) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            console.log('Submitting complaint...', {
                userId: user.uid,
                departmentsCount: departments.length,
                formData: data
            });

            if (departments.length === 0) {
                console.warn('No departments found! Complaint will be assigned to default/empty department.');
            }

            const id = await createComplaint(
                { ...data, images: images.map((i) => i.file) },
                user.uid,
                user.name,
                user.email,
                departments.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    categories: d.categories,
                    slaHours: d.slaHours,
                }))
            );
            toast.success('Complaint submitted successfully!');
            navigate(`/complaint/${id}`);
        } catch (error: any) {
            console.error('Complaint Submission Error:', error);
            // Show more specific error to user
            let message = 'Failed to submit complaint.';
            if (error.code === 'permission-denied') message = 'Permission denied. Check Firestore rules.';
            if (error.code === 'unavailable') message = 'Network issue. Check your connection.';
            toast.error(`${message} (${error.message || 'Unknown error'})`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = (hasError: boolean) =>
        cn(
            'w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm',
            hasError ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'
        );

    return (
        <div className="max-w-2xl mx-auto animate-slide-up">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submit a Complaint</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Our AI will automatically categorize and route your complaint</p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                            step >= s
                                ? 'gradient-primary text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        )}>
                            {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                        </div>
                        <span className={cn('text-sm font-medium hidden sm:block', step >= s ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400')}>
                            {s === 1 ? 'Details' : s === 2 ? 'Category' : s === 3 ? 'Images' : 'Review'}
                        </span>
                        {s < 4 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">

                    {/* Step 1: Details */}
                    {step === 1 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Complaint Title *
                                </label>
                                <input
                                    {...register('title')}
                                    placeholder="Brief title describing the issue..."
                                    className={inputClass(!!errors.title)}
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    {...register('description')}
                                    rows={5}
                                    placeholder="Describe the issue in detail. Include when it started, how it affects you, and any other relevant information..."
                                    className={cn(inputClass(!!errors.description), 'resize-none')}
                                />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                <p className="text-xs text-gray-400 mt-1">{description?.length ?? 0}/2000 characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    Location (optional)
                                </label>
                                <input
                                    {...register('location')}
                                    placeholder="Building, floor, room number..."
                                    className={inputClass(false)}
                                />
                            </div>

                            {/* AI Suggestion */}
                            {(aiLoading || aiResult) && (
                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 animate-fade-in">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">AI Suggestion</span>
                                        {aiLoading && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                                    </div>
                                    {aiResult && !aiLoading && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="text-sm text-blue-700 dark:text-blue-300">
                                                {getCategoryIcon(aiResult.category)} {getCategoryLabel(aiResult.category)}
                                                <span className="text-xs ml-1 opacity-70">({Math.round(aiResult.confidence * 100)}% confidence)</span>
                                            </span>
                                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', getPriorityColor(aiResult.priority))}>
                                                {aiResult.priority} priority
                                            </span>
                                            <button
                                                type="button"
                                                onClick={applyAISuggestion}
                                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-medium"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Step 2: Category & Priority */}
                    {step === 2 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Category *</label>
                                <Controller
                                    name="category"
                                    control={control}
                                    render={({ field }: { field: any }) => (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {CATEGORIES.map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => field.onChange(cat)}
                                                    className={cn(
                                                        'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm font-medium transition-all',
                                                        field.value === cat
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                                                    )}
                                                >
                                                    <span className="text-xl">{getCategoryIcon(cat)}</span>
                                                    <span className="text-xs text-center leading-tight">{getCategoryLabel(cat)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Priority *</label>
                                <Controller
                                    name="priority"
                                    control={control}
                                    render={({ field }: { field: any }) => (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {PRIORITIES.map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => field.onChange(p)}
                                                    className={cn(
                                                        'px-3 py-2.5 rounded-lg border text-sm font-medium capitalize transition-all',
                                                        field.value === p
                                                            ? getPriorityColor(p) + ' border-current'
                                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                                    )}
                                                >
                                                    {p === 'urgent' && '🚨 '}
                                                    {p === 'high' && '🔴 '}
                                                    {p === 'normal' && '🔵 '}
                                                    {p === 'low' && '🟢 '}
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                />
                            </div>

                            {watch('priority') === 'urgent' && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        Urgent complaints are escalated immediately and require immediate attention.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Step 3: Images */}
                    {step === 3 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Attach Images (optional, max 5)
                                </label>
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                                        isDragActive
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {isDragActive ? 'Drop images here...' : 'Drag & drop images, or click to select'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP up to 10MB each. Images will be compressed automatically.</p>
                                </div>

                                {images.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
                                        {images.map((img, i) => (
                                            <div key={i} className="relative group aspect-square">
                                                <img src={img.preview} alt="" className="w-full h-full object-cover rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i)}
                                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Review & Submit
                                </h3>
                                <div className="space-y-4 text-sm">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase tracking-wide">Title</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{title}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase tracking-wide">Category</span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-lg">{getCategoryIcon(watch('category'))}</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{getCategoryLabel(watch('category'))}</span>
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="text-gray-500 block text-xs uppercase tracking-wide">Description</span>
                                            <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">{description}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase tracking-wide">Priority</span>
                                            <span className={cn('inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border', getPriorityColor(watch('priority')))}>
                                                {watch('priority')}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase tracking-wide">Location</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{watch('location') || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase tracking-wide">Attached Images</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{images.length} images</p>
                                        </div>
                                    </div>

                                    {images.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {images.map((img, i) => (
                                                <img key={i} src={img.preview} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                    <button
                        type="button"
                        onClick={() => setStep((s) => s - 1)}
                        disabled={step === 1}
                        className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>

                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={async () => {
                                let valid = false;
                                if (step === 1) valid = await trigger(['title', 'description']);
                                if (step === 2) valid = await trigger(['category', 'priority']);
                                if (step === 3) valid = true; // No validation needed for images (optional)
                                if (valid) setStep((s) => s + 1);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-white font-semibold rounded-lg hover:opacity-90 transition"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Submit Complaint
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
