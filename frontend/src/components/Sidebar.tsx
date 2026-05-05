import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore, useUIStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { allNavItems, COLOR_CLASSES, type NavItem } from "./sidebar-nav-items";


function NavLink({
  item,
  active,
  collapsed,
  onClose,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClose: () => void;
}) {
  const colors = COLOR_CLASSES[item.colorKey] ?? COLOR_CLASSES.orange;
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onClose}
      title={collapsed ? item.title : undefined}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl border-l-4 transition-all duration-200",
        active
          ? cn(colors.bg, colors.border)
          : "border-transparent hover:bg-[#f6f6f6]",
        collapsed && "justify-center"
      )}
    >
      <div className={cn("p-1.5 rounded-lg shrink-0 transition-colors", active ? colors.iconBg : "")}>
        <Icon className={cn("h-4 w-4", active ? colors.text : "text-[#5b5b5b]")} />
      </div>

      {!collapsed && (
        <span className={cn("text-sm truncate", active ? cn(colors.text, "font-semibold") : "font-medium text-[#2f2f2f]")}>
          {item.title}
        </span>
      )}

      {active && !collapsed && (
        <div className={cn("ml-auto h-1.5 w-1.5 rounded-full shrink-0", colors.bg.replace("/10", "").replace("bg-", "bg-"))} />
      )}

      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-[#2f2f2f] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          {item.title}
        </div>
      )}
    </Link>
  );
}

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const user = getCurrentUser();
  const isSidebarCollapsed = useUIStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const navItems = useMemo(() => {
    if (!user) return [];
    return allNavItems.filter((item) => item.roles.includes(user.role));
  }, [user]);

  const roleColorKey = navItems[0]?.colorKey ?? "orange";
  const colors = COLOR_CLASSES[roleColorKey] ?? COLOR_CLASSES.orange;

  const handleLogout = async () => {
    const refreshToken = sessionStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // ignore — proceed to clear local state
      }
    }
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    const exactPaths = ["/student", "/parent", "/teacher", "/school", "/admin"];
    if (exactPaths.includes(path)) return location.pathname === path;
    return location.pathname.startsWith(path);
  };


  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-lg bg-fundi-orange text-white"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-white z-40 flex flex-col",
          "shadow-[4px_0_24px_rgba(0,0,0,0.06)] border-r border-[#f1f1f1]",
          "transform transition-all duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isSidebarCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="group relative flex items-center gap-3 px-4 py-4 border-b border-[#f1f1f1]">
          <div className={cn("flex items-center gap-3 flex-1 min-w-0", isSidebarCollapsed && "justify-center")}>
            <img
              src="/fundi_bots_logo.png"
              alt="Fundi Bots"
              className={cn("object-contain shrink-0 transition-all", isSidebarCollapsed ? "h-9 w-9" : "h-7 w-auto")}
            />
            {!isSidebarCollapsed && (
              <span className="heading-font text-lg font-bold text-[#2f2f2f] whitespace-nowrap truncate">
                Future Fundi
              </span>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center h-5 w-5 rounded-full border border-[#e8e8e8] bg-white shadow-sm text-[#5b5b5b] hover:text-fundi-orange hover:border-fundi-orange absolute -right-2.5 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 transition-all"
          >
            {isSidebarCollapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
          </button>
        </div>


        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              item={item}
              active={isActive(item.path)}
              collapsed={isSidebarCollapsed}
              onClose={() => setIsOpen(false)}
            />
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-[#f1f1f1] px-3 py-3 space-y-0.5">
          <Link
            to="/help"
            title={isSidebarCollapsed ? "Help Center" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#5b5b5b] hover:bg-[#f6f6f6] transition-colors border-l-4 border-transparent",
              isSidebarCollapsed && "justify-center"
            )}
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span className="text-sm font-medium">Help Center</span>}
          </Link>

          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? "Log Out" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#5b5b5b] hover:bg-red-50 hover:text-red-500 transition-colors border-l-4 border-transparent",
              isSidebarCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span className="text-sm font-medium">Log Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
