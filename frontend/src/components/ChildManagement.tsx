import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { childApi, courseApi } from "@/lib/api";
import { Plus, User, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChildForm } from "./ChildForm";
import { ChildCard } from "./ChildCard";
import { EMPTY_FORM } from "./child-management-types";
import type { Child, Course, ChildFormData, ApiError } from "./child-management-types";

const ERROR_FIELDS = ['date_of_birth', 'username', 'password', 'new_password', 'password_confirm', 'new_password_confirm'] as const;

export default function ChildManagement() {
    const [children, setChildren] = useState<Child[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [formData, setFormData] = useState<ChildFormData>(EMPTY_FORM);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => { fetchChildren(); fetchCourses(); }, []);

    const fetchChildren = async () => {
        setLoading(true);
        try {
            const res = await childApi.getAll();
            const data = res.data.results ?? res.data;
            setChildren(Array.isArray(data) ? data : []);
        } catch {
            setError('Failed to load children');
            setChildren([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await courseApi.getAll();
            const data = res.data.results ?? res.data ?? [];
            setCourses(Array.isArray(data) ? data : []);
        } catch {
            // Courses are optional context; silently ignore
        }
    };

    const calculateAge = (dobString: string): number => {
        if (!dobString) return 0;
        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
        return age;
    };

    const validateAge = (dob: string): boolean => {
        const age = calculateAge(dob);
        if (age < 6 || age > 18) { setError('Child must be between 6 and 18 years old.'); return false; }
        return true;
    };

    const extractApiError = (err: unknown): string => {
        const data = (err as ApiError).response?.data;
        if (!data) return 'An unexpected error occurred.';
        if (typeof data.detail === 'string') return data.detail;
        for (const field of ERROR_FIELDS) {
            const value = data[field];
            if (Array.isArray(value)) return value[0];
            if (typeof value === 'string') return value;
        }
        return 'An unexpected error occurred.';
    };

    const handleAddChild = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); setSuccess(null);
        if (!validateAge(formData.date_of_birth)) return;
        if (!formData.username || !formData.password || !formData.password_confirm) {
            setError('Username, password, and password confirmation are required.');
            return;
        }
        try {
            await childApi.create({
                first_name: formData.first_name, last_name: formData.last_name,
                date_of_birth: formData.date_of_birth, current_school: formData.current_school,
                current_class: formData.current_class, username: formData.username,
                password: formData.password, password_confirm: formData.password_confirm,
                consent_media: formData.consent_media, equity_flag: formData.equity_flag,
                pathway_ids: formData.pathway_ids,
            });
            setSuccess('Child added successfully!');
            setShowAddForm(false);
            resetForm();
            fetchChildren();
        } catch (err: unknown) {
            setError(extractApiError(err));
        }
    };

    const handleEditChild = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChild) return;
        setError(null); setSuccess(null);
        if (!validateAge(formData.date_of_birth)) return;
        try {
            const updateData: Partial<ChildFormData> = {
                first_name: formData.first_name, last_name: formData.last_name,
                date_of_birth: formData.date_of_birth, current_school: formData.current_school,
                current_class: formData.current_class, consent_media: formData.consent_media,
                equity_flag: formData.equity_flag,
            };
            if (formData.new_password) {
                updateData.new_password = formData.new_password;
                updateData.new_password_confirm = formData.new_password_confirm;
            }
            await childApi.update(editingChild.id, updateData);
            setSuccess('Child updated successfully!');
            setEditingChild(null);
            resetForm();
            fetchChildren();
        } catch (err: unknown) {
            setError(extractApiError(err));
        }
    };

    const handleDeleteChild = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
        try {
            await childApi.delete(id);
            setSuccess('Child removed successfully');
            fetchChildren();
        } catch {
            setError('Failed to remove child');
        }
    };

    const startEdit = (child: Child) => {
        setEditingChild(child);
        setFormData({
            ...EMPTY_FORM, first_name: child.first_name, last_name: child.last_name,
            date_of_birth: child.date_of_birth ?? '', current_school: child.current_school ?? '',
            current_class: child.current_class ?? '', consent_media: child.consent_media,
            equity_flag: child.equity_flag,
        });
        setShowAddForm(false);
    };

    const resetForm = () => setFormData(EMPTY_FORM);
    const cancelForm = () => { setEditingChild(null); setShowAddForm(false); resetForm(); };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-fundi-orange border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-600">Loading children...</p>
                </div>
            </div>
        );
    }

    const showForm = showAddForm || !!editingChild;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="heading-font text-2xl font-bold text-fundi-black">My Children</h2>
                    <p className="text-gray-600 mt-1">Manage your children's profiles</p>
                </div>
                <Button
                    onClick={() => { setShowAddForm(!showAddForm); setEditingChild(null); resetForm(); }}
                    className="bg-fundi-orange text-white flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" /> Add Child
                </Button>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-red-600">{error}</span>
                    </motion.div>
                )}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-600">{success}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <ChildForm
                            editingChild={editingChild}
                            formData={formData}
                            onChange={setFormData}
                            courses={courses}
                            onSubmit={editingChild ? handleEditChild : handleAddChild}
                            onCancel={cancelForm}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {children.length === 0 ? (
                <Card className="text-center p-8">
                    <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No Children Added</h3>
                    <p className="text-gray-600 mb-4">Add your first child to get started</p>
                    <Button onClick={() => setShowAddForm(true)} className="bg-fundi-orange text-white">
                        <Plus className="h-5 w-5 mr-2" /> Add Your First Child
                    </Button>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map((child) => (
                        <ChildCard key={child.id} child={child} onEdit={startEdit} onDelete={handleDeleteChild} />
                    ))}
                </div>
            )}
        </div>
    );
}
