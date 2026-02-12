import { Bell, ChevronDown, Settings, LogOut } from "lucide-react";
import { getCurrentUser, getRoleDisplayName } from "@/lib/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsModal } from "./SettingsModal";

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
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  if (!user) return null;

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'User';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Page Title / Breadcrumb */}
        <div>
          <h2 className="text-xl font-bold heading-font" style={{ color: 'var(--fundi-black)' }}>
            Welcome back, {user.first_name || user.username}!
          </h2>
          <p className="text-sm text-gray-500">
            {user.tenant_name ? `${user.tenant_name} Dashboard` : `${getRoleDisplayName(user.role as any)} Dashboard`}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors outline-none"
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
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSettingsModal(true)} className="cursor-pointer gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
    </>
  );
};

export default TopBar;
