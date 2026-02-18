import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/lib/store";
import type { ReactNode } from "react";
import {
  getDashboardRoute,
  getCurrentUser,
  getSelectedTeacherSchoolId,
  type UserRole,
} from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const user = getCurrentUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role === "teacher" && location.pathname.startsWith("/teacher")) {
    const isSchoolSelectionRoute = location.pathname.startsWith("/teacher/select-school");
    const assignedSchools = Array.isArray(user.teacher_schools) ? user.teacher_schools : [];
    const selectedSchoolId = getSelectedTeacherSchoolId();

    if (
      !isSchoolSelectionRoute &&
      assignedSchools.length > 1 &&
      (!selectedSchoolId || !assignedSchools.some((school) => school.id === selectedSchoolId))
    ) {
      return <Navigate to="/teacher/select-school" replace />;
    }
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && user) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect to user's appropriate dashboard
      const dashboardRoute = getDashboardRoute(user.role as UserRole);
      return <Navigate to={dashboardRoute} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
