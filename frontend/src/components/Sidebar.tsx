import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  User, 
  Users, 
  BookOpen, 
  BarChart3, 
  Home,
  Menu,
  X,
  Sparkles,
  LogOut,
  Settings,
  FileText,
  TrendingUp,
  Award,
  Calendar
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

interface NavItem {
  title: string;
  path: string;
  icon: typeof User;
  color: string;
  roles: string[];
}

const allNavItems: NavItem[] = [
  {
    title: "Dashboard",
    path: "/student",
    icon: Home,
    color: "var(--fundi-orange)",
    roles: ["learner"],
  },
  {
    title: "My Portfolio",
    path: "/student/portfolio",
    icon: FileText,
    color: "var(--fundi-orange)",
    roles: ["learner"],
  },
  {
    title: "Growth Tree",
    path: "/student/tree",
    icon: TrendingUp,
    color: "var(--fundi-orange)",
    roles: ["learner"],
  },
  {
    title: "Achievements",
    path: "/student/achievements",
    icon: Award,
    color: "var(--fundi-orange)",
    roles: ["learner"],
  },
  {
    title: "Dashboard",
    path: "/parent",
    icon: Home,
    color: "var(--fundi-purple)",
    roles: ["parent"],
  },
  {
    title: "My Children",
    path: "/parent/children",
    icon: Users,
    color: "var(--fundi-purple)",
    roles: ["parent"],
  },
  {
    title: "Weekly Updates",
    path: "/parent/updates",
    icon: Calendar,
    color: "var(--fundi-purple)",
    roles: ["parent"],
  },
  {
    title: "Dashboard",
    path: "/teacher",
    icon: Home,
    color: "var(--fundi-cyan)",
    roles: ["teacher"],
  },
  {
    title: "My Classes",
    path: "/teacher/classes",
    icon: Users,
    color: "var(--fundi-cyan)",
    roles: ["teacher"],
  },
  {
    title: "Capture Artifact",
    path: "/teacher/capture",
    icon: BookOpen,
    color: "var(--fundi-cyan)",
    roles: ["teacher"],
  },
  {
    title: "Assessments",
    path: "/teacher/assessments",
    icon: FileText,
    color: "var(--fundi-cyan)",
    roles: ["teacher"],
  },
  {
    title: "Dashboard",
    path: "/leader",
    icon: Home,
    color: "var(--fundi-lime)",
    roles: ["leader", "admin"],
  },
  {
    title: "Analytics",
    path: "/leader/analytics",
    icon: BarChart3,
    color: "var(--fundi-lime)",
    roles: ["leader", "admin"],
  },
  {
    title: "School Overview",
    path: "/leader/overview",
    icon: Users,
    color: "var(--fundi-lime)",
    roles: ["leader", "admin"],
  },
  {
    title: "Reports",
    path: "/leader/reports",
    icon: FileText,
    color: "var(--fundi-lime)",
    roles: ["leader", "admin"],
  },
  {
    title: "Admin Dashboard",
    path: "/admin",
    icon: Settings,
    color: "var(--fundi-red)",
    roles: ["admin"],
  },
  {
    title: "User Management",
    path: "/admin/users",
    icon: Users,
    color: "var(--fundi-red)",
    roles: ["admin"],
  },
  {
    title: "School Management",
    path: "/admin/schools",
    icon: BarChart3,
    color: "var(--fundi-red)",
    roles: ["admin"],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const user = getCurrentUser();

  const navItems = useMemo(() => {
    if (!user) return [];
    return allNavItems.filter(item => item.roles.includes(user.role));
  }, [user]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-lg"
        style={{ backgroundColor: 'var(--fundi-orange)', color: 'white' }}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(240, 87, 34, 0.1)' }}
              >
                <Sparkles className="h-6 w-6" style={{ color: 'var(--fundi-orange)' }} />
              </div>
              <div>
                <h1 className="heading-font text-xl font-bold" style={{ color: 'var(--fundi-black)' }}>
                  Future Fundi
                </h1>
                <p className="text-xs text-gray-500">Growth Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    "hover:shadow-md",
                    active
                      ? "shadow-md font-semibold"
                      : "hover:bg-gray-50"
                  )}
                  style={{
                    backgroundColor: active ? `${item.color}15` : "transparent",
                    borderLeft: active ? `4px solid ${item.color}` : "4px solid transparent",
                  }}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      active ? "" : "opacity-70"
                    )}
                    style={{
                      backgroundColor: active ? `${item.color}20` : "transparent",
                    }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: active ? item.color : "var(--fundi-black)" }}
                    />
                  </div>
                  <span
                    className="flex-1"
                    style={{
                      color: active ? item.color : "var(--fundi-black)",
                    }}
                  >
                    {item.title}
                  </span>
                  {active && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            {isAuthenticated && (
              <>
                <Link
                  to="/settings"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 text-left"
                >
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Settings className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="flex-1 text-gray-700 font-semibold">Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-red-50 text-left"
                >
                  <div className="p-2 rounded-lg bg-red-100">
                    <LogOut className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="flex-1 text-red-600 font-semibold">Logout</span>
                </button>
              </>
            )}
            <div className="text-xs text-gray-500 text-center pt-2">
              <p className="mono-font font-semibold mb-1">60k+ Learners</p>
              <p>East Africa • 2025</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

