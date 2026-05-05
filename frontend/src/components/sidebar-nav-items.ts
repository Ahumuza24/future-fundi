import type { LucideIcon } from "lucide-react";
import {
  Home,
  Route,
  Award,
  ClipboardList,
  CalendarCheck,
  MessageSquare,
  Settings,
  Users,
  Calendar,
  CalendarDays,
  ListTodo,
  ClipboardCheck,
  BookOpen,
  Camera,
  BarChart3,
  Database,
  MonitorDot,
} from "lucide-react";

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  colorKey: string;
  roles: string[];
}

export const COLOR_CLASSES: Record<
  string,
  { bg: string; text: string; border: string; iconBg: string }
> = {
  orange: {
    bg: "bg-fundi-orange/10",
    text: "text-fundi-orange",
    border: "border-fundi-orange",
    iconBg: "bg-fundi-orange/15",
  },
  cyan: {
    bg: "bg-fundi-cyan/10",
    text: "text-fundi-cyan",
    border: "border-fundi-cyan",
    iconBg: "bg-fundi-cyan/15",
  },
  lime: {
    bg: "bg-fundi-lime/10",
    text: "text-fundi-lime",
    border: "border-fundi-lime",
    iconBg: "bg-fundi-lime/15",
  },
  purple: {
    bg: "bg-fundi-purple/10",
    text: "text-fundi-purple",
    border: "border-fundi-purple",
    iconBg: "bg-fundi-purple/15",
  },
  red: {
    bg: "bg-fundi-red/15",
    text: "text-fundi-red",
    border: "border-fundi-red",
    iconBg: "bg-fundi-red/15",
  },
};

export const ROLE_LABELS: Record<string, string> = {
  learner: "Digital Learner",
  teacher: "Facilitator",
  parent: "Parent",
  school: "School Admin",
  program_manager: "Program Manager",
  admin: "System Admin",
  data_entry: "Data Entry",
  curriculum_designer: "Curriculum Designer",
};

export const allNavItems: NavItem[] = [
  // ── Learner ──────────────────────────────────────────────
  { title: "Home", path: "/student", icon: Home, colorKey: "orange", roles: ["learner"] },
  { title: "My Pathways", path: "/student/pathways", icon: Route, colorKey: "orange", roles: ["learner"] },
  { title: "Badges & Credentials", path: "/student/achievements", icon: Award, colorKey: "orange", roles: ["learner"] },
  { title: "Assessments", path: "/student/assessments", icon: ClipboardList, colorKey: "orange", roles: ["learner"] },
  { title: "Attendance", path: "/student/attendance", icon: CalendarCheck, colorKey: "orange", roles: ["learner"] },
  { title: "Messages", path: "/student/messages", icon: MessageSquare, colorKey: "orange", roles: ["learner"] },
  { title: "Settings", path: "/settings", icon: Settings, colorKey: "orange", roles: ["learner"] },

  // ── Parent ───────────────────────────────────────────────
  { title: "Dashboard", path: "/parent", icon: Home, colorKey: "purple", roles: ["parent"] },
  { title: "My Children", path: "/parent/children", icon: Users, colorKey: "orange", roles: ["parent"] },
  { title: "Weekly Updates", path: "/parent/updates", icon: Calendar, colorKey: "cyan", roles: ["parent"] },

  // ── Teacher ──────────────────────────────────────────────
  { title: "Dashboard", path: "/teacher", icon: Home, colorKey: "cyan", roles: ["teacher"] },
  { title: "My Sessions", path: "/teacher/sessions", icon: CalendarDays, colorKey: "cyan", roles: ["teacher"] },
  { title: "My Tasks", path: "/teacher/tasks", icon: ListTodo, colorKey: "purple", roles: ["teacher"] },
  { title: "Attendance", path: "/teacher/attendance", icon: ClipboardCheck, colorKey: "cyan", roles: ["teacher"] },
  { title: "Pathways", path: "/teacher/pathways", icon: BookOpen, colorKey: "lime", roles: ["teacher"] },
  { title: "My Students", path: "/teacher/classes", icon: Users, colorKey: "cyan", roles: ["teacher"] },
  { title: "Capture Artifact", path: "/teacher/capture-artifact", icon: Camera, colorKey: "orange", roles: ["teacher"] },
  { title: "Assessments", path: "/teacher/assessments", icon: ClipboardList, colorKey: "purple", roles: ["teacher"] },
  { title: "Communication", path: "/teacher/communication", icon: MessageSquare, colorKey: "lime", roles: ["teacher"] },

  // ── Program Manager ─────────────────────────────────────
  { title: "Dashboard", path: "/program-manager", icon: Home, colorKey: "lime", roles: ["program_manager"] },

  // ── School Admin ─────────────────────────────────────────
  { title: "Dashboard", path: "/school", icon: Home, colorKey: "purple", roles: ["school"] },
  { title: "Students", path: "/school/students", icon: Users, colorKey: "cyan", roles: ["school"] },
  { title: "Pathways", path: "/school/pathways", icon: BookOpen, colorKey: "orange", roles: ["school"] },
  { title: "Analytics", path: "/school/analytics", icon: BarChart3, colorKey: "purple", roles: ["school"] },

  // ── System Admin ─────────────────────────────────────────
  { title: "Curriculum Entry", path: "/admin/curriculum-entry", icon: Database, colorKey: "purple", roles: ["admin", "data_entry"] },
  { title: "Activities", path: "/admin/activities", icon: Calendar, colorKey: "cyan", roles: ["admin", "data_entry"] },
  { title: "User Management", path: "/admin/users", icon: Users, colorKey: "red", roles: ["admin"] },
  { title: "School Management", path: "/admin/schools", icon: BarChart3, colorKey: "red", roles: ["admin"] },
  { title: "Course Management", path: "/admin/courses", icon: BookOpen, colorKey: "orange", roles: ["admin"] },
  { title: "Activity Monitor", path: "/admin/monitor", icon: MonitorDot, colorKey: "cyan", roles: ["admin"] },
  { title: "Analytics", path: "/admin/analytics", icon: BarChart3, colorKey: "lime", roles: ["admin"] },
];
