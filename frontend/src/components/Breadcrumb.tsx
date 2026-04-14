import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

// Route label mappings
const routeLabels: Record<string, string> = {
  student: "Dashboard",
  portfolio: "My Portfolio",
  achievements: "Achievements",
  parent: "Dashboard",
  children: "My Children",
  updates: "Weekly Updates",
  teacher: "Dashboard",
  sessions: "My Sessions",
  tasks: "My Tasks",
  attendance: "Attendance",
  pathways: "Pathways",
  classes: "My Students",
  "capture-artifact": "Capture Artifact",
  assessments: "Assessments",
  communication: "Communication",
  school: "Dashboard",
  students: "Students",
  teachers: "Teachers",
  progress: "Progress Tracking",
  badges: "Badges & Artifacts",
  analytics: "Analytics",
  admin: "Dashboard",
  "curriculum-entry": "Curriculum Entry",
  activities: "Activities",
  users: "User Management",
  schools: "School Management",
  courses: "Course Management",
  monitor: "Activity Monitor",
  leader: "Dashboard",
  reports: "Reports",
  settings: "Settings",
  login: "Login",
  signup: "Sign Up",
};

// Special route patterns with params
const getDynamicLabel = (segment: string, prevSegment: string): string | null => {
  // Check if it looks like an ID (UUID or numeric)
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || /^\d+$/.test(segment);
  
  if (isId && prevSegment) {
    const parentLabel = routeLabels[prevSegment];
    if (parentLabel) {
      return `${parentLabel.slice(0, -1)} Details`; // Remove 's' and add ' Details'
    }
    return "Details";
  }
  return null;
};

interface BreadcrumbItem {
  label: string;
  path: string;
  isLast: boolean;
}

const Breadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Don't show breadcrumb on root or auth pages
  if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  // Build breadcrumb items
  const items: BreadcrumbItem[] = [];
  let currentPath = "";

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const prevSegment = index > 0 ? pathSegments[index - 1] : "";
    
    // Get label: dynamic (for IDs) > static mapping > segment capitalized
    const dynamicLabel = getDynamicLabel(segment, prevSegment);
    const staticLabel = routeLabels[segment];
    const label = dynamicLabel || staticLabel || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    items.push({
      label,
      path: currentPath,
      isLast: index === pathSegments.length - 1,
    });
  });

  // Add Home as first item
  items.unshift({
    label: "Home",
    path: "/",
    isLast: false,
  });

  return (
    <nav aria-label="Breadcrumb" className="px-6 py-3 bg-white/50 border-b border-gray-100">
      <ol className="flex items-center gap-2 text-sm flex-wrap">
        {items.map((item, index) => (
          <li key={item.path} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
            {item.isLast ? (
              <span
                className="font-medium text-[var(--fundi-black)]"
                aria-current="page"
              >
                {index === 0 && <Home className="inline h-4 w-4 mr-1" />}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className={cn(
                  "text-gray-500 hover:text-[var(--fundi-orange)] transition-colors",
                  "flex items-center"
                )}
              >
                {index === 0 && <Home className="inline h-4 w-4 mr-1" />}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
