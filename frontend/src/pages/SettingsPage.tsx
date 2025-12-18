import { useState } from "react";
import { User, Mail, Lock, Bell, Shield, Save } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";

const SettingsPage = () => {
  const user = getCurrentUser();
  const setUser = useAuthStore((state: any) => state.setUser);
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update API call
    console.log("Updating profile:", formData);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      alert("Passwords don't match!");
      return;
    }
    // TODO: Implement password change API call
    console.log("Changing password");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold heading-font mb-2" style={{ color: 'var(--fundi-black)' }}>
          Settings
        </h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="space-y-6">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ focusRing: 'var(--fundi-orange)' }}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ focusRing: 'var(--fundi-orange)' }}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ focusRing: 'var(--fundi-orange)' }}
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
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-all hover:shadow-lg"
              style={{ backgroundColor: 'var(--fundi-orange)' }}
            >
              <Save className="h-4 w-4" />
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
