import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Users,
  BookOpen,
  BarChart3,
  Home,
  Menu,
  X,
  LogOut,
  FileText,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Camera,
  MessageSquare,
  ClipboardCheck
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore, useUIStore } from "@/lib/store";
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
    color: "var(--fundi-orange)",
    roles: ["parent"],
  },
  {
    title: "Weekly Updates",
    path: "/parent/updates",
    icon: Calendar,
    color: "var(--fundi-cyan)",
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
    path: "/teacher/capture-artifact",
    icon: Camera,
    color: "var(--fundi-orange)",
    roles: ["teacher"],
  },
  {
    title: "Assessments",
    path: "/teacher/assessments",
    icon: ClipboardCheck,
    color: "var(--fundi-purple)",
    roles: ["teacher"],
  },
  {
    title: "Communication",
    path: "/teacher/communication",
    icon: MessageSquare,
    color: "var(--fundi-lime)",
    roles: ["teacher"],
  },
  {
    title: "Dashboard",
    path: "/admin",
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
  {
    title: "Course Management",
    path: "/admin/courses",
    icon: BookOpen,
    color: "var(--fundi-orange)",
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
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

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
          "fixed left-0 top-0 h-full bg-white shadow-xl z-40 transform transition-all duration-300 ease-in-out border-r",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isSidebarCollapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-4 border-b flex items-center justify-between relative group">
            <div className={cn("flex items-center gap-3 transition-opacity duration-300", isSidebarCollapsed ? "justify-center w-full" : "")}>
              <div
                className="p-1 rounded-lg"
              >
                <img
                  src="/fundi_bots_logo.png"
                  alt="Fundi Bots Logo"
                  className={cn("object-contain transition-all duration-300", isSidebarCollapsed ? "h-10 w-10" : "h-8 w-auto")}
                />
              </div>
              <div className={cn("transition-opacity duration-300", isSidebarCollapsed ? "hidden opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                <h1 className="heading-font text-xl font-bold whitespace-nowrap" style={{ color: 'var(--fundi-black)' }}>
                  Future Fundi
                </h1>
              </div>
            </div>

            {/* Collapse Button */}
            <button
              onClick={toggleSidebar}
              className={cn(
                "hidden lg:flex items-center justify-center h-6 w-6 rounded-full border bg-white shadow-md text-gray-500 hover:text-[var(--fundi-orange)] hover:border-[var(--fundi-orange)] absolute -right-3 top-9 z-50 transition-all duration-300",
                isSidebarCollapsed ? "-right-3" : "opacity-0 group-hover:opacity-100 -right-3"
              )}
            >
              {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-2 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                    "hover:shadow-md",
                    active
                      ? "shadow-md font-semibold"
                      : "hover:bg-gray-50",
                    isSidebarCollapsed ? "justify-center" : ""
                  )}
                  style={{
                    backgroundColor: active ? `${item.color}15` : "transparent",
                    borderLeft: active && !isSidebarCollapsed ? `4px solid ${item.color}` : "4px solid transparent",
                  }}
                  title={isSidebarCollapsed ? item.title : undefined}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors flex-shrink-0",
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
                    className={cn(
                      "flex-1 transition-all duration-300 whitespace-nowrap overflow-hidden",
                      isSidebarCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                    )}
                    style={{
                      color: active ? item.color : "var(--fundi-black)",
                    }}
                  >
                    {item.title}
                  </span>

                  {active && !isSidebarCollapsed && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                  )}

                  {/* Tooltip for collapsed state */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {item.title}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            {isAuthenticated && (
              <>


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

          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

