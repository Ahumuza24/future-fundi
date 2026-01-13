import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { childApi } from "@/lib/api";
import { Plus, Edit, Trash2, User, Calendar, CheckCircle, AlertCircle, School, GraduationCap, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

interface ChildFormData {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    current_school: string;
    current_class: string;
    username?: string;
    password?: string;
    password_confirm?: string;
    new_password?: string;
    new_password_confirm?: string;
    consent_media: boolean;
    equity_flag: boolean;
}

export default function ChildManagement() {
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingChild, setEditingChild] = useState<Child | null>(null);
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
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            setLoading(true);
            const response = await childApi.getAll();
            // Handle both paginated and non-paginated responses
            const childrenData = response.data.results || response.data;
            setChildren(Array.isArray(childrenData) ? childrenData : []);
        } catch (err: any) {
            setError("Failed to load children");
            console.error(err);
            setChildren([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateAge = (dobString: string) => {
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

    const validateAge = (dob: string) => {
        const age = calculateAge(dob);
        if (age < 6 || age > 18) {
            setError("Child must be between 6 and 18 years old.");
            return false;
        }
        return true;
    };

    const handleAddChild = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!validateAge(formData.date_of_birth)) {
            return;
        }

        try {
            await childApi.create({
                ...formData,
                username: formData.username!,
                password: formData.password!,
                password_confirm: formData.password_confirm!,
            });
            setSuccess("Child added successfully!");
            setShowAddForm(false);
            resetForm();
            fetchChildren();
        } catch (err: any) {
            const errorMsg = err.response?.data?.date_of_birth?.[0] ||
                err.response?.data?.username?.[0] ||
                err.response?.data?.password?.[0] ||
                err.response?.data?.detail ||
                "Failed to add child";
            setError(errorMsg);
        }
    };

    const handleEditChild = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChild) return;

        setError(null);
        setSuccess(null);

        if (!validateAge(formData.date_of_birth)) {
            return;
        }

        try {
            const updateData: any = {
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
        } catch (err: any) {
            const errorMsg = err.response?.data?.date_of_birth?.[0] ||
                err.response?.data?.new_password?.[0] ||
                err.response?.data?.detail ||
                "Failed to update child";
            setError(errorMsg);
        }
    };

    const handleDeleteChild = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name}?`)) {
            return;
        }

        try {
            await childApi.delete(id);
            setSuccess("Child removed successfully");
            fetchChildren();
        } catch (err: any) {
            setError("Failed to remove child");
        }
    };

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
        });
        setShowAddForm(false);
    };

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
        });
    };

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
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={formData.last_name}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
                                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
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
                                                onChange={(e) => setFormData({ ...formData, current_school: e.target.value })}
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
                                                onChange={(e) => setFormData({ ...formData, current_class: e.target.value })}
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
                                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                        className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                                        placeholder="e.g., emma_j2024"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-2">Password</label>
                                                        <input
                                                            type="password"
                                                            value={formData.password}
                                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                                                            onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
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
                                                        onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
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
                                                        onChange={(e) => setFormData({ ...formData, new_password_confirm: e.target.value })}
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
                                            onChange={(e) => setFormData({ ...formData, consent_media: e.target.checked })}
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
                                            onChange={(e) => setFormData({ ...formData, equity_flag: e.target.checked })}
                                            className="h-4 w-4"
                                        />
                                        <label htmlFor="equity_flag" className="text-sm">
                                            My child requires additional support
                                        </label>
                                    </div>

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
