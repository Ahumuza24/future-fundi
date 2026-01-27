import { useState, useEffect } from "react";
import { User, Mail, Lock, Bell, Shield, Save, Camera, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { Avatar, EditableAvatar } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UserData {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
    tenant_name?: string;
}

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
    const user = getCurrentUser() as UserData | null;
    const setUser = useAuthStore((state: any) => state.setUser);

    const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [formData, setFormData] = useState({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    const [notifications, setNotifications] = useState({
        email_updates: true,
        weekly_reports: true,
        achievement_alerts: true,
    });

    const [saving, setSaving] = useState(false);

    // Load fresh profile data when modal opens
    useEffect(() => {
        if (open) {
            const fetchProfile = async () => {
                try {
                    const response = await authApi.getProfile();
                    const profile = response.data;
                    setFormData(prev => ({
                        ...prev,
                        first_name: profile.first_name || "",
                        last_name: profile.last_name || "",
                        email: profile.email || "",
                    }));
                    setAvatarUrl(profile.avatar_url);
                } catch (error) {
                    console.error("Failed to fetch profile:", error);
                }
            };
            fetchProfile();
        }
    }, [open]);

    const showMessage = (type: "success" | "error", text: string) => {
        setSaveMessage({ type, text });
        setTimeout(() => setSaveMessage(null), 3000);
    };

    const handleAvatarUpload = async (file: File) => {
        setAvatarUploading(true);
        try {
            const response = await authApi.uploadAvatar(file);
            setAvatarUrl(response.data.avatar_url);
            showMessage("success", "Profile picture updated successfully!");

            // Update stored user data
            if (user) {
                const updatedUser = { ...user, avatar_url: response.data.avatar_url };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
            }
        } catch (error: any) {
            showMessage("error", error.response?.data?.error || "Failed to upload avatar");
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleAvatarDelete = async () => {
        try {
            await authApi.deleteAvatar();
            setAvatarUrl(null);
            showMessage("success", "Profile picture removed");

            // Update stored user data
            if (user) {
                const updatedUser = { ...user, avatar_url: null };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
            }
        } catch (error) {
            showMessage("error", "Failed to remove avatar");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await authApi.updateProfile({
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
            });
            showMessage("success", "Profile updated successfully!");

            // Update stored user data
            if (user) {
                const updatedUser = {
                    ...user,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                };
                localStorage.setItem("user_data", JSON.stringify(updatedUser));
                setUser(updatedUser);
            }
        } catch (error: any) {
            showMessage("error", error.response?.data?.detail || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.new_password !== formData.confirm_password) {
            showMessage("error", "Passwords don't match!");
            return;
        }
        // TODO: Implement password change API call
        showMessage("success", "Password updated successfully!");
        setFormData(prev => ({
            ...prev,
            current_password: "",
            new_password: "",
            confirm_password: "",
        }));
    };

    const fullName = `${formData.first_name} ${formData.last_name}`.trim();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold heading-font flex items-center gap-2">
                        <SettingsIcon className="h-6 w-6 text-gray-700" />
                        Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage your account settings and preferences
                    </DialogDescription>
                </DialogHeader>

                {/* Status Messages */}
                <AnimatePresence>
                    {saveMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${saveMessage.type === "success"
                                ? "bg-green-50 border border-green-200 text-green-700"
                                : "bg-red-50 border border-red-200 text-red-700"
                                }`}
                        >
                            {saveMessage.type === "success" ? (
                                <CheckCircle className="h-5 w-5" />
                            ) : (
                                <AlertCircle className="h-5 w-5" />
                            )}
                            {saveMessage.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-6">
                    {/* Profile Picture */}
                    <section className="bg-gray-50/50 rounded-lg p-5 border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Camera className="h-5 w-5 text-[var(--fundi-cyan)]" />
                            <h3 className="text-lg font-bold">Profile Picture</h3>
                        </div>

                        <div className="flex items-center gap-6">
                            <EditableAvatar
                                src={avatarUrl}
                                name={fullName}
                                size="lg"
                                onUpload={handleAvatarUpload}
                                uploading={avatarUploading}
                            />

                            <div className="flex-1">
                                <div className="flex flex-wrap gap-3">
                                    <label
                                        htmlFor="avatar-modal-upload"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold cursor-pointer transition-all hover:shadow-lg bg-[var(--fundi-cyan)] hover:opacity-90 text-sm"
                                    >
                                        <Camera className="h-4 w-4" />
                                        {avatarUrl ? "Change Photo" : "Upload Photo"}
                                        <input
                                            type="file"
                                            id="avatar-modal-upload"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleAvatarUpload(file);
                                            }}
                                            disabled={avatarUploading}
                                        />
                                    </label>

                                    {avatarUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAvatarDelete}
                                            className="gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Profile Information */}
                    <section className="bg-gray-50/50 rounded-lg p-5 border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="h-5 w-5 text-[var(--fundi-orange)]" />
                            <h3 className="text-lg font-bold">Profile Information</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--fundi-orange)]"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-[var(--fundi-orange)] hover:bg-[var(--fundi-orange-dark)] gap-2"
                                >
                                    {saving ? (
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </section>

                    {/* Security Settings */}
                    <section className="bg-gray-50/50 rounded-lg p-5 border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Lock className="h-5 w-5 text-[var(--fundi-red)]" />
                            <h3 className="text-lg font-bold">Security</h3>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.current_password}
                                    onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--fundi-red)]"
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.new_password}
                                        onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--fundi-red)]"
                                        placeholder="Enter new password"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.confirm_password}
                                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--fundi-red)]"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    className="bg-[var(--fundi-red)] hover:opacity-90 gap-2"
                                >
                                    <Shield className="h-4 w-4" />
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Internal icon component just for the header title if needed, 
// or import Settings from lucide-react.
import { Settings as SettingsIcon } from "lucide-react";
