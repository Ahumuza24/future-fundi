import * as Sentry from "@sentry/react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { ROLES } from "@/lib/roles";
import PageLayout from "@/components/PageLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import StudentDashboard from "@/features/student/dashboard/StudentDashboard";
import PathwayLearning from "@/features/student/pathways/PathwayLearning";
import ParentPortal from "@/pages/parent/ParentPortal";
import ParentMyChildren from "@/pages/parent/ParentMyChildren";
import ParentWeeklyUpdates from "@/pages/parent/ParentWeeklyUpdates";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TeacherSchoolSelect from "@/pages/teacher/TeacherSchoolSelect";
import TeacherAttendance from "@/pages/teacher/TeacherAttendance";
import TeacherArtifactCapture from "@/pages/teacher/TeacherArtifactCapture";
import TeacherClasses from "@/pages/teacher/TeacherClasses";
import TeacherStudents from "@/pages/teacher/TeacherStudents";
import TeacherPathways from "@/pages/teacher/TeacherPathways";
import TeacherSessions from "@/pages/teacher/TeacherSessions";
import TeacherTasks from "@/pages/teacher/TeacherTasks";
import TeacherReviewSubmissions from "@/pages/teacher/TeacherReviewSubmissions";
import TeacherAttendanceHub from "@/pages/teacher/TeacherAttendanceHub";
import StudentDetail from "@/features/teacher/students/StudentDetail";
import TeacherAssessments from "@/pages/teacher/TeacherAssessments";
import TeacherLearnerPortfolio from "@/pages/teacher/TeacherLearnerPortfolio";
import TeacherCommunication from "@/pages/teacher/TeacherCommunication";
import ProgramManagerDashboard from "@/pages/school/ProgramManagerDashboard";
import BadgesCredentialsPage from "@/features/student/achievements/BadgesCredentialsPage";
import AttendancePage from "@/features/student/attendance/AttendancePage";
import MyPathwaysPage from "@/features/student/pathways/MyPathwaysPage";
import SchoolDashboard from "@/pages/school/SchoolDashboard";
import SchoolStudents from "@/pages/school/SchoolStudents";
import SchoolTeachers from "@/pages/school/SchoolTeachers";
import SchoolPathways from "@/pages/school/SchoolPathways";
import SchoolProgress from "@/pages/school/SchoolProgress";
import SchoolBadges from "@/pages/school/SchoolBadges";
import SchoolAnalytics from "@/pages/school/SchoolAnalytics";
import SchoolStudentDetail from "@/pages/school/SchoolStudentDetail";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminCourseManagement from "@/pages/admin/AdminCourseManagement";
import AdminMonitor from "@/pages/admin/AdminMonitor";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import UserManagement from "@/pages/admin/UserManagement";
import SchoolManagement from "@/pages/admin/SchoolManagement";
import CurriculumDesigner from "@/pages/admin/CurriculumDesigner";
import ActivityManagement from "@/pages/admin/ActivityManagement";
import SettingsPage from "@/pages/SettingsPage";
import ComingSoon from "@/pages/ComingSoon";

const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouterV7(createBrowserRouter);

const router = sentryCreateBrowserRouter([
  // Landing page - no layout (full-screen, no sidebar/topbar)
  {
    path: "/",
    element: <HomePage />,
  },
  // Auth pages - no layout
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  // All app routes with PageLayout (sidebar + topbar)
  {
    path: "/",
    element: <PageLayout />,
    children: [
      // Student Routes
      {
        path: "student",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.LEARNER, ROLES.ADMIN]}>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "student/pathways",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.LEARNER, ROLES.ADMIN]}>
            <MyPathwaysPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "student/achievements",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.LEARNER, ROLES.ADMIN]}>
            <BadgesCredentialsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "student/attendance",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.LEARNER, ROLES.ADMIN]}>
            <AttendancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "student/pathway/:enrollmentId",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.LEARNER, ROLES.ADMIN]}>
            <PathwayLearning />
          </ProtectedRoute>
        ),
      },
      // Parent Routes
      {
        path: "parent",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.PARENT, ROLES.ADMIN]}>
            <ParentPortal />
          </ProtectedRoute>
        ),
      },
      {
        path: "parent/children",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.PARENT, ROLES.ADMIN]}>
            <ParentMyChildren />
          </ProtectedRoute>
        ),
      },
      {
        path: "parent/updates",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.PARENT, ROLES.ADMIN]}>
            <ParentWeeklyUpdates />
          </ProtectedRoute>
        ),
      },
      // Teacher Routes
      {
        path: "teacher/select-school",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
            <TeacherSchoolSelect />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/students",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherStudents />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/students/:id",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <StudentDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/pathways",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherPathways />
          </ProtectedRoute>
        ),
      },

      {
        path: "teacher/mark-attendance/:sessionId",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherAttendance />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/attendance",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherAttendanceHub />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/attendance/:sessionId",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherAttendance />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/capture-artifact",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherArtifactCapture />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/classes",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherClasses />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/student/:id",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <StudentDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/assessments",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherAssessments />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/learner/:learnerId",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherLearnerPortfolio />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/communication",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherCommunication />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/sessions",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherSessions />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/tasks",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherTasks />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/review-pending",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.TEACHER, ROLES.ADMIN]}>
            <TeacherReviewSubmissions />
          </ProtectedRoute>
        ),
      },
      // Program Manager Routes
      {
        path: "program-manager",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.PROGRAM_MANAGER, ROLES.ADMIN]}>
            <ProgramManagerDashboard />
          </ProtectedRoute>
        ),
      },
      // School Routes
      {
        path: "school",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SCHOOL, ROLES.ADMIN]}>
            <SchoolDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/students",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SCHOOL, ROLES.ADMIN]}>
            <SchoolStudents />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/students/:id",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SCHOOL, ROLES.ADMIN]}>
            <SchoolStudentDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/teachers",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SCHOOL, ROLES.ADMIN]}>
            <SchoolTeachers />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/pathways",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SCHOOL, ROLES.ADMIN]}>
            <SchoolPathways />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/progress",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SCHOOL, ROLES.ADMIN]}>
            <SchoolProgress />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/badges",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SCHOOL, ROLES.ADMIN]}>
            <SchoolBadges />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/analytics",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.SCHOOL, ROLES.ADMIN]}>
            <SchoolAnalytics />
          </ProtectedRoute>
        ),
      },
      // Settings
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      // Admin Routes
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/courses",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminCourseManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/curriculum-entry",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CURRICULUM_DESIGNER]}>
            <Navigate to="/admin/curriculum-designer" replace />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/curriculum-designer",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.CURRICULUM_DESIGNER, ROLES.ADMIN]}>
            <CurriculumDesigner />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/activities",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CURRICULUM_DESIGNER]}>
            <ActivityManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <UserManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/schools",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <SchoolManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/monitor",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminMonitor />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/analytics",
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminAnalytics />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Unimplemented or unknown routes
  {
    path: "*",
    element: <ComingSoon />,
  },
]);

import ErrorBoundary from "@/components/ErrorBoundary";

const App = () => {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
};

export default App;
