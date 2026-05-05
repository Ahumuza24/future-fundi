import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { activityApi, courseApi } from "@/lib/api";
import { Plus, Calendar, Clock, MapPin, Image, BookOpen, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ActivityForm } from "./components/ActivityForm";
import { ActivityDetailPanel } from "./components/ActivityDetailPanel";
import { STATUS_COLORS } from "./components/activity-management-types";
import type { Activity, Course } from "./components/activity-management-types";

export default function ActivityManagement() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const params = statusFilter !== 'all' ? { status: statusFilter } : {};
            const res = await activityApi.getAll(params);
            setActivities(Array.isArray(res.data) ? res.data : (res.data.results ?? []));
        } catch {
            showMessage('error', 'Failed to load activities');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await courseApi.getAll();
            setCourses(Array.isArray(res.data) ? res.data : (res.data.results ?? []));
        } catch {
            // Courses are optional context; silently ignore
        }
    }, []);

    useEffect(() => { void fetchActivities(); void fetchCourses(); }, [fetchActivities, fetchCourses]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await activityApi.delete(id);
            showMessage('success', 'Activity deleted successfully');
            setExpandedId(null);
            void fetchActivities();
        } catch {
            showMessage('error', 'Failed to delete activity');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-fundi-cyan border-t-transparent mx-auto mb-4" />
                    <p className="text-gray-500">Loading activities...</p>
                </div>
            </div>
        );
    }

    const selectedActivity = activities.find((a) => a.id === expandedId) ?? null;

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                count={activities.length}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                onNew={() => setIsCreating(true)}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}
                        >
                            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isCreating && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-8">
                            <ActivityForm
                                courses={courses}
                                onClose={() => setIsCreating(false)}
                                onSuccess={() => {
                                    setIsCreating(false);
                                    showMessage('success', 'Activity created successfully');
                                    void fetchActivities();
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {activities.length === 0 && !isCreating && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-fundi-cyan to-fundi-lime flex items-center justify-center">
                            <Calendar className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activities Yet</h3>
                        <p className="text-gray-500 mb-6">Create your first activity to get started</p>
                        <Button onClick={() => setIsCreating(true)} className="gap-2">
                            <Plus className="h-4 w-4" /> Create First Activity
                        </Button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activities.map((activity) => (
                        <ActivityCard
                            key={activity.id}
                            activity={activity}
                            isSelected={expandedId === activity.id}
                            onSelect={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                        />
                    ))}
                </div>

                <AnimatePresence>
                    {selectedActivity && (
                        <motion.div
                            key="detail-panel"
                            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6"
                        >
                            <ActivityDetailPanel
                                activity={selectedActivity}
                                courses={courses}
                                isEditing={editingId === selectedActivity.id}
                                onEdit={() => setEditingId(selectedActivity.id)}
                                onCloseEdit={() => setEditingId(null)}
                                onClose={() => setExpandedId(null)}
                                onUpdate={() => {
                                    setEditingId(null);
                                    showMessage('success', 'Activity updated successfully');
                                    void fetchActivities();
                                }}
                                onDelete={() => handleDelete(selectedActivity.id, selectedActivity.name)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function PageHeader({
    count,
    statusFilter,
    onStatusChange,
    onNew,
}: {
    count: number;
    statusFilter: string;
    onStatusChange: (v: string) => void;
    onNew: () => void;
}) {
    return (
        <div className="bg-white border-b sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-fundi-black">Activity Management</h1>
                        <p className="text-sm text-gray-500 mt-1">{count} activities • Manage upcoming events and programs</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fundi-cyan"
                        >
                            <option value="all">All Statuses</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <Button onClick={onNew} className="gap-2">
                            <Plus className="h-4 w-4" /> New Activity
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActivityCard({
    activity,
    isSelected,
    onSelect,
}: {
    activity: Activity;
    isSelected: boolean;
    onSelect: () => void;
}) {
    const statusStyle = STATUS_COLORS[activity.status] ?? STATUS_COLORS.upcoming;
    const mediaCount = activity.media_files?.length ?? 0;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelect}
            className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 bg-white ${isSelected ? 'border-fundi-cyan/50 shadow-lg ring-2 ring-offset-2 ring-fundi-cyan' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}
        >
            <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-fundi-cyan to-fundi-lime flex items-center justify-center shadow-lg flex-shrink-0">
                    <Calendar className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight truncate mb-1">{activity.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{format(new Date(activity.date), 'MMM d, yyyy')}</span>
                </div>
                {activity.start_time && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{activity.start_time.slice(0, 5)}{activity.end_time && ` - ${activity.end_time.slice(0, 5)}`}</span>
                    </div>
                )}
                {activity.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{activity.location}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                {activity.course_name && (
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${isSelected ? 'bg-cyan-100' : 'bg-gray-100'} flex items-center justify-center`}>
                            <BookOpen className={`h-4 w-4 ${isSelected ? 'text-cyan-600' : 'text-gray-500'}`} />
                        </div>
                        <span className="text-xs text-gray-500 truncate max-w-[100px]">{activity.course_name}</span>
                    </div>
                )}
                {mediaCount > 0 && (
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${isSelected ? 'bg-purple-100' : 'bg-gray-100'} flex items-center justify-center`}>
                            <Image className={`h-4 w-4 ${isSelected ? 'text-purple-600' : 'text-gray-500'}`} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">{mediaCount}</p>
                            <p className="text-xs text-gray-500">Media</p>
                        </div>
                    </div>
                )}
            </div>

            {isSelected && (
                <div className="mt-4 pt-3 border-t border-fundi-cyan/20">
                    <span className="text-xs font-medium text-fundi-cyan flex items-center gap-1">
                        <ChevronDown className="h-3 w-3" /> Viewing details below
                    </span>
                </div>
            )}
        </motion.div>
    );
}
