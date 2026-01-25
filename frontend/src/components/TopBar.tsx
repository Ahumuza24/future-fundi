import { Bell, ChevronDown, Settings } from "lucide-react";
import { getCurrentUser, getRoleDisplayName } from "@/lib/auth";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";

interface UserData {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  role: string;
  tenant_name?: string;
  avatar_url?: string | null;
}

const TopBar = () => {
  const user = getCurrentUser() as UserData | null;
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'User';

  return (
    <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Page Title / Breadcrumb */}
      <div>
        <h2 className="text-xl font-bold heading-font" style={{ color: 'var(--fundi-black)' }}>
          Welcome back, {user.first_name || user.username}!
        </h2>
        <p className="text-sm text-gray-500">
          {getRoleDisplayName(user.role as any)} Dashboard
        </p>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Avatar */}
            <Avatar
              src={user.avatar_url}
              name={fullName}
              size="md"
            />

            {/* User Info */}
            <div className="text-left hidden md:block">
              <p className="text-sm font-semibold" style={{ color: 'var(--fundi-black)' }}>
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-gray-500">{getRoleDisplayName(user.role as any)}</p>
            </div>

            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <Settings className="h-4 w-4 text-gray-600" />
                  <span className="text-m text-gray-800"> Settings</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
