import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { childApi, courseApi } from "@/lib/api";
import {
    Plus, Edit, Trash2, User, Calendar, CheckCircle,
    AlertCircle, School, GraduationCap, Key
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Interfaces ---

/**
 * Represents a course or pathway available for enrollment.
 */
interface Course {
    id: string;
    name: string;
    description: string;
}

/**
 * Represents a Child/Learner entity.
 */
interface Child {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    date_of_birth?: string;
    age?: number;
    current_school?: string;
    current_class?: string;
    consent_media: boolean;
    equity_flag: boolean;
    joined_at?: string;
}

/**
 * Form data structure for creating or updating a child.
 */
interface ChildFormData {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    current_school: string;
    current_class: string;
    username?: string; // Required for new child, optional for edit
    password?: string; // Required for new child, optional for edit
    password_confirm?: string; // Required for new child, optional for edit
    new_password?: string; // Only for editing existing child's password
    new_password_confirm?: string; // Only for editing existing child's password
    consent_media: boolean;
    equity_flag: boolean;
    pathway_ids?: string[];
}

/**
 * Error structure from API responses.
 */
interface ApiError {
    response?: {
        data?: {
            [key: string]: string[] | string | undefined;
            detail?: string;
        };
    };
}

// --- Component ---

/**
 * ChildManagement Component
 * 
 * Allows parents to manage their children: list, add, edit, and delete.
 * handles form validation, API interactions, and state management.
 */
export default function ChildManagement() {
    // State
    const [children, setChildren] = useState<Child[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingChild, setEditingChild] = useState<Child | null>(null);

    // Form State
    const [formData, setFormData] = useState<ChildFormData>({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        current_school: "",
        current_class: "",
        username: "",
        password: "",
        password_confirm: "",
        consent_media: true,
        equity_flag: false,
        pathway_ids: [],
    });

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        fetchChildren();
        fetchCourses();
    }, []);

    /**
     * Fetches all available courses/pathways.
     */
    const fetchCourses = async () => {
        try {
            const response = await courseApi.getAll();
            const data = response.data.results || response.data || [];
            setCourses(Array.isArray(data) ? data : []);
        } catch (err: unknown) {
            console.error("Failed to fetch courses", err);
            // Optionally, set a user-facing error for courses
        }
    };

    /**
     * Fetches the list of children associated with the parent.
     */
    const fetchChildren = async () => {
        try {
            setLoading(true);
            const response = await childApi.getAll();
            // Handle both paginated and non-paginated responses
            const childrenData = response.data.results || response.data;
            setChildren(Array.isArray(childrenData) ? childrenData : []);
        } catch (err: unknown) {
            setError("Failed to load children");
            console.error(err);
            setChildren([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Calculates age from date of birth.
     * @param dobString - Date of birth in string format (e.g., "YYYY-MM-DD").
     * @returns The calculated age in years.
     */
    const calculateAge = (dobString: string): number => {
        if (!dobString) return 0;
        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    };

    /**
     * Validates that the child is between 6 and 18 years old.
     * @param dob - Date of birth in string format.
     * @returns True if age is valid, false otherwise.
     */
    const validateAge = (dob: string): boolean => {
        const age = calculateAge(dob);
        if (age < 6 || age > 18) {
            setError("Child must be between 6 and 18 years old.");
            return false;
        }
        return true;
    };

    /**
     * Handles specific error messages from the backend.
     * @param err - The error object caught from an API call.
     */
    const handleApiError = (err: unknown) => {
        const errorObj = err as ApiError;
        const data = errorObj.response?.data;

        let errorMsg = "An unexpected error occurred.";

        if (data) {
            if (data.detail && typeof data.detail === 'string') {
                errorMsg = data.detail;
            } else {
                // Check for specific field errors
                const fields = ['date_of_birth', 'username', 'password', 'new_password', 'password_confirm', 'new_password_confirm'];
                for (const field of fields) {
                    if (Array.isArray(data[field])) {
                        errorMsg = (data[field] as string[])[0];
                        break;
                    } else if (typeof data[field] === 'string') {
                        errorMsg = data[field] as string;
                        break;
                    }
                }
            }
        }
        setError(errorMsg);
    };

    /**
     * Submits the form to add a new child.
     * @param e - The form event.
     */
    const handleAddChild = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!validateAge(formData.date_of_birth)) {
            return;
        }

        // Ensure required fields for new child are present
        if (!formData.username || !formData.password || !formData.password_confirm) {
            setError("Username, password, and password confirmation are required for a new child.");
            return;
        }

        try {
            await childApi.create({
                first_name: formData.first_name,
                last_name: formData.last_name,
                date_of_birth: formData.date_of_birth,
                current_school: formData.current_school,
                current_class: formData.current_class,
                username: formData.username,
                password: formData.password,
                password_confirm: formData.password_confirm,
                consent_media: formData.consent_media,
                equity_flag: formData.equity_flag,
                pathway_ids: formData.pathway_ids,
            });
            setSuccess("Child added successfully!");
            setShowAddForm(false);
            resetForm();
            fetchChildren();
        } catch (err: unknown) {
            handleApiError(err);
        }
    };

    /**
     * Submits the form to update an existing child.
     * @param e - The form event.
     */
    const handleEditChild = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChild) return;

        setError(null);
        setSuccess(null);

        if (!validateAge(formData.date_of_birth)) {
            return;
        }

        try {
            const updateData: Partial<ChildFormData> = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                date_of_birth: formData.date_of_birth,
                current_school: formData.current_school,
                current_class: formData.current_class,
                consent_media: formData.consent_media,
                equity_flag: formData.equity_flag,
            };

            // Only include password if it's being changed
            if (formData.new_password) {
                updateData.new_password = formData.new_password;
                updateData.new_password_confirm = formData.new_password_confirm;
            }

            await childApi.update(editingChild.id, updateData);
            setSuccess("Child updated successfully!");
            setEditingChild(null);
            resetForm();
            fetchChildren();
        } catch (err: unknown) {
            handleApiError(err);
        }
    };

    /**
     * Deletes a child profile.
     * @param id - The ID of the child to delete.
     * @param name - The full name of the child for confirmation message.
     */
    const handleDeleteChild = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to remove ${name}?`)) {
            return;
        }

        try {
            await childApi.delete(id);
            setSuccess("Child removed successfully");
            fetchChildren();
        } catch (err: unknown) {
            setError("Failed to remove child"); // Generic error for delete, as specific messages might not be critical here
            console.error(err);
        }
    };

    /**
     * Populates the form to edit a child.
     * @param child - The child object to be edited.
     */
    const startEdit = (child: Child) => {
        setEditingChild(child);
        setFormData({
            first_name: child.first_name,
            last_name: child.last_name,
            date_of_birth: child.date_of_birth || "",
            current_school: child.current_school || "",
            current_class: child.current_class || "",
            consent_media: child.consent_media,
            equity_flag: child.equity_flag,
            new_password: "",
            new_password_confirm: "",
            username: "", // Username usually isn't editable or not shown here
            password: "",
            password_confirm: "",
            pathway_ids: [], // Pathways are not editable via this form for existing children
        });
        setShowAddForm(false);
    };

    /**
     * Resets the form fields to their initial empty state.
     */
    const resetForm = () => {
        setFormData({
            first_name: "",
            last_name: "",
            date_of_birth: "",
            current_school: "",
            current_class: "",
            username: "",
            password: "",
            password_confirm: "",
            consent_media: true,
            equity_flag: false,
            pathway_ids: [],
        });
    };

    /**
     * Cancels the edit operation and resets the form.
     */
    const cancelEdit = () => {
        setEditingChild(null);
        resetForm();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-[var(--fundi-orange)] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading children...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="heading-font text-2xl font-bold" style={{ color: "var(--fundi-black)" }}>
                        My Children
                    </h2>
                    <p className="text-gray-600 mt-1">Manage your children's profiles</p>
                </div>
                <Button
                    onClick={() => {
                        setShowAddForm(!showAddForm);
                        setEditingChild(null);
                        resetForm();
                    }}
                    style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Add Child
                </Button>
            </div>

            {/* Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-red-600">{error}</span>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-600">{success}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add/Edit Child Form */}
            <AnimatePresence>
                {(showAddForm || editingChild) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card className="border-2" style={{ borderColor: "var(--fundi-orange)" }}>
                            <CardHeader>
                                <CardTitle>{editingChild ? "Edit Child" : "Add New Child"}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={editingChild ? handleEditChild : handleAddChild} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">First Name</label>
                                            <input
                                                type="text"
                                                value={formData.first_name}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, first_name: e.target.value })}
                                                className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={formData.last_name}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, last_name: e.target.value })}
                                                className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={formData.date_of_birth}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                            className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                                                <School className="h-4 w-4" />
                                                Current School
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.current_school}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, current_school: e.target.value })}
                                                className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                                placeholder="e.g., Kampala Primary School"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                                                <GraduationCap className="h-4 w-4" />
                                                Current Class/Grade
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.current_class}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, current_class: e.target.value })}
                                                className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                                placeholder="e.g., Primary 5"
                                            />
                                        </div>
                                    </div>

                                    {/* Login Credentials Section - Only for new children */}
                                    {!editingChild && (
                                        <div className="pt-4 border-t-2 border-gray-200">
                                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2" style={{ color: "var(--fundi-black)" }}>
                                                <Key className="h-5 w-5" />
                                                Student Login Credentials
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Create a username and password for your child to log in to their student dashboard
                                            </p>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">Username</label>
                                                    <input
                                                        type="text"
                                                        value={formData.username}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value })}
                                                        className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                                        placeholder="e.g., cedric_ahumuza"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-2">Password</label>
                                                        <input
                                                            type="password"
                                                            value={formData.password}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                                                            className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                                            placeholder="Min. 8 characters"
                                                            minLength={8}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                                                        <input
                                                            type="password"
                                                            value={formData.password_confirm}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password_confirm: e.target.value })}
                                                            className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                                            placeholder="Re-enter password"
                                                            minLength={8}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Change Password Section - Only for editing */}
                                    {editingChild && (
                                        <div className="pt-4 border-t-2 border-gray-200">
                                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2" style={{ color: "var(--fundi-black)" }}>
                                                <Key className="h-5 w-5" />
                                                Change Password (Optional)
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Leave blank to keep the current password
                                            </p>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">New Password</label>
                                                    <input
                                                        type="password"
                                                        value={formData.new_password}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, new_password: e.target.value })}
                                                        className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                                        placeholder="Min. 8 characters"
                                                        minLength={8}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">Confirm New Password</label>
                                                    <input
                                                        type="password"
                                                        value={formData.new_password_confirm}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, new_password_confirm: e.target.value })}
                                                        className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                                        placeholder="Re-enter new password"
                                                        minLength={8}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="consent_media"
                                            checked={formData.consent_media}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, consent_media: e.target.checked })}
                                            className="h-4 w-4"
                                        />
                                        <label htmlFor="consent_media" className="text-sm">
                                            I consent to media capture (photos/videos) for educational purposes
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="equity_flag"
                                            checked={formData.equity_flag}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, equity_flag: e.target.checked })}
                                            className="h-4 w-4"
                                        />
                                        <label htmlFor="equity_flag" className="text-sm">
                                            My child requires additional support
                                        </label>
                                    </div>

                                    {/* Pathway Selection (Only for new children for now) */}
                                    {!editingChild && (
                                        <div className="pt-4 border-t-2 border-gray-200">
                                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2" style={{ color: "var(--fundi-black)" }}>
                                                <GraduationCap className="h-5 w-5" />
                                                Select Pathways (Max 2)
                                            </h3>
                                            <div className="space-y-4">
                                                {/* Primary Pathway */}
                                                <div>
                                                    <label className="block text-sm font-semibold mb-1">Primary Pathway</label>
                                                    <select
                                                        value={formData.pathway_ids?.[0] || ""}
                                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                            const newId = e.target.value;
                                                            const currentIds = formData.pathway_ids || [];
                                                            const secondId = currentIds.length > 1 ? currentIds[1] : undefined;

                                                            const newIds: string[] = [];
                                                            if (newId) newIds.push(newId);
                                                            if (secondId && secondId !== newId) newIds.push(secondId);

                                                            setFormData({ ...formData, pathway_ids: newIds });
                                                        }}
                                                        className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)] bg-white"
                                                    >
                                                        <option value="">Select a pathway...</option>
                                                        {courses.map(course => (
                                                            <option
                                                                key={course.id}
                                                                value={course.id}
                                                                // Disable if this course is already selected as the secondary pathway
                                                                disabled={(formData.pathway_ids?.length || 0) > 1 && formData.pathway_ids?.[1] === course.id}
                                                            >
                                                                {course.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Secondary Pathway */}
                                                <div>
                                                    <label className="block text-sm font-semibold mb-1">Secondary Pathway (Optional)</label>
                                                    <select
                                                        value={(formData.pathway_ids?.length || 0) > 1 ? formData.pathway_ids?.[1] : ""}
                                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                            const newId = e.target.value;
                                                            const currentIds = formData.pathway_ids || [];
                                                            const firstId = currentIds[0];

                                                            const newIds: string[] = [];
                                                            if (firstId) newIds.push(firstId);
                                                            if (newId && newId !== firstId) newIds.push(newId);

                                                            setFormData({ ...formData, pathway_ids: newIds });
                                                        }}
                                                        className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)] bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                                        disabled={!formData.pathway_ids || formData.pathway_ids.length === 0}
                                                    >
                                                        <option value="">Select a second pathway...</option>
                                                        {courses.map(course => (
                                                            <option
                                                                key={course.id}
                                                                value={course.id}
                                                                // Disable if this course is already selected as the primary pathway
                                                                disabled={formData.pathway_ids?.[0] === course.id}
                                                            >
                                                                {course.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            {courses.length === 0 && (
                                                <p className="text-sm text-gray-500 italic">Loading available pathways...</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Button
                                            type="submit"
                                            style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
                                            className="flex-1"
                                        >
                                            {editingChild ? "Update Child" : "Add Child"}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={editingChild ? cancelEdit : () => setShowAddForm(false)}
                                            className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Children List */}
            {children.length === 0 ? (
                <Card className="text-center p-8">
                    <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No Children Added</h3>
                    <p className="text-gray-600 mb-4">Add your first child to get started</p>
                    <Button
                        onClick={() => setShowAddForm(true)}
                        style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Your First Child
                    </Button>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map((child) => (
                        <motion.div
                            key={child.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="p-3 rounded-full"
                                                style={{ backgroundColor: "rgba(240, 87, 34, 0.1)" }}
                                            >
                                                <User className="h-6 w-6" style={{ color: "var(--fundi-orange)" }} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{child.full_name}</CardTitle>
                                                {child.age && (
                                                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {child.age} years old
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 mb-4">
                                        {child.current_school && (
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <School className="h-4 w-4 text-blue-600" />
                                                {child.current_school}
                                            </div>
                                        )}
                                        {child.current_class && (
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <GraduationCap className="h-4 w-4 text-purple-600" />
                                                {child.current_class}
                                            </div>
                                        )}
                                        {child.consent_media && (
                                            <div className="flex items-center gap-2 text-sm text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                Media consent given
                                            </div>
                                        )}
                                        {child.equity_flag && (
                                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                                <AlertCircle className="h-4 w-4" />
                                                Additional support
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => startEdit(child)}
                                            className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteChild(child.id, child.full_name)}
                                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Remove
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
