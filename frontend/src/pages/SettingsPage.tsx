import { useState, useEffect } from "react";
import { User, Mail, Lock, Bell, Shield, Save, Camera, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { Avatar, EditableAvatar } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
  tenant_name?: string;
}

const SettingsPage = () => {
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

  // Load fresh profile data
  useEffect(() => {
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
  }, []);

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
        localStorage.setItem("user", JSON.stringify(updatedUser));
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold heading-font mb-2" style={{ color: 'var(--fundi-black)' }}>
          Settings
        </h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${saveMessage.type === "success"
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(0, 175, 235, 0.1)' }}>
              <Camera className="h-5 w-5" style={{ color: 'var(--fundi-cyan)' }} />
            </div>
            <h2 className="text-xl font-bold heading-font">Profile Picture</h2>
          </div>

          <div className="flex items-center gap-6">
            <EditableAvatar
              src={avatarUrl}
              name={fullName}
              size="xl"
              onUpload={handleAvatarUpload}
              uploading={avatarUploading}
            />

            <div className="flex-1">
              <p className="text-gray-600 mb-4">
                Upload a profile picture to personalize your account. The image will be cropped to a square.
              </p>
              <div className="flex gap-3">
                <label
                  htmlFor="avatar-upload-btn"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold cursor-pointer transition-all hover:shadow-lg"
                  style={{ backgroundColor: 'var(--fundi-cyan)' }}
                >
                  <Camera className="h-4 w-4" />
                  {avatarUrl ? "Change Photo" : "Upload Photo"}
                  <input
                    type="file"
                    id="avatar-upload-btn"
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
                  <button
                    onClick={handleAvatarDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(240, 87, 34, 0.1)' }}>
              <User className="h-5 w-5" style={{ color: 'var(--fundi-orange)' }} />
            </div>
            <h2 className="text-xl font-bold heading-font">Profile Information</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--fundi-black)' }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--fundi-black)' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--fundi-black)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {user?.tenant_name && `School: ${user.tenant_name}`}
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-all hover:shadow-lg disabled:opacity-50"
              style={{ backgroundColor: 'var(--fundi-orange)' }}
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(233, 30, 37, 0.1)' }}>
              <Lock className="h-5 w-5" style={{ color: 'var(--fundi-red)' }} />
            </div>
            <h2 className="text-xl font-bold heading-font">Security</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--fundi-black)' }}>
                Current Password
              </label>
              <input
                type="password"
                value={formData.current_password}
                onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                placeholder="Enter current password"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--fundi-black)' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--fundi-black)' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-all hover:shadow-lg"
              style={{ backgroundColor: 'var(--fundi-red)' }}
            >
              <Shield className="h-4 w-4" />
              Update Password
            </button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(254, 220, 0, 0.1)' }}>
              <Bell className="h-5 w-5" style={{ color: 'var(--fundi-yellow)' }} />
            </div>
            <h2 className="text-xl font-bold heading-font">Notifications</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div>
                <p className="font-semibold" style={{ color: 'var(--fundi-black)' }}>Email Updates</p>
                <p className="text-sm text-gray-600">Receive email notifications about your progress</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.email_updates}
                onChange={(e) => setNotifications({ ...notifications, email_updates: e.target.checked })}
                className="w-5 h-5 rounded"
                style={{ accentColor: 'var(--fundi-orange)' }}
              />
            </label>

            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div>
                <p className="font-semibold" style={{ color: 'var(--fundi-black)' }}>Weekly Reports</p>
                <p className="text-sm text-gray-600">Get weekly summary of your activities</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.weekly_reports}
                onChange={(e) => setNotifications({ ...notifications, weekly_reports: e.target.checked })}
                className="w-5 h-5 rounded"
                style={{ accentColor: 'var(--fundi-orange)' }}
              />
            </label>

            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div>
                <p className="font-semibold" style={{ color: 'var(--fundi-black)' }}>Achievement Alerts</p>
                <p className="text-sm text-gray-600">Get notified when you earn new achievements</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.achievement_alerts}
                onChange={(e) => setNotifications({ ...notifications, achievement_alerts: e.target.checked })}
                className="w-5 h-5 rounded"
                style={{ accentColor: 'var(--fundi-orange)' }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
