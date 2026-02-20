import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import StudentDashboard from "@/pages/student/StudentDashboard";
import PathwayLearning from "@/pages/student/PathwayLearning";
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

import MarkAttendance from "@/pages/teacher/MarkAttendance";
import StudentDetail from "@/pages/teacher/StudentDetail";
import TeacherAssessments from "@/pages/teacher/TeacherAssessments";
import TeacherLearnerPortfolio from "@/pages/teacher/TeacherLearnerPortfolio";
import TeacherCommunication from "@/pages/teacher/TeacherCommunication";
import LeaderDashboard from "@/pages/school/LeaderDashboard";
import SchoolDashboard from "@/pages/school/SchoolDashboard";
import SchoolStudents from "@/pages/school/SchoolStudents";
import SchoolTeachers from "@/pages/school/SchoolTeachers";
import SchoolPathways from "@/pages/school/SchoolPathways";
import SchoolProgress from "@/pages/school/SchoolProgress";
import SchoolBadges from "@/pages/school/SchoolBadges";
import SchoolAnalytics from "@/pages/school/SchoolAnalytics";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminCourseManagement from "@/pages/admin/AdminCourseManagement";
import UserManagement from "@/pages/admin/UserManagement";
import SchoolManagement from "@/pages/admin/SchoolManagement";
import CurriculumDataEntry from "@/pages/admin/CurriculumDataEntry";
import ActivityManagement from "@/pages/admin/ActivityManagement";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";

const router = createBrowserRouter([
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
          <ProtectedRoute allowedRoles={['learner', 'admin']}>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "student/pathway/:enrollmentId",
        element: (
          <ProtectedRoute allowedRoles={['learner', 'admin']}>
            <PathwayLearning />
          </ProtectedRoute>
        ),
      },
      // Parent Routes
      {
        path: "parent",
        element: (
          <ProtectedRoute allowedRoles={['parent', 'admin']}>
            <ParentPortal />
          </ProtectedRoute>
        ),
      },
      {
        path: "parent/children",
        element: (
          <ProtectedRoute allowedRoles={['parent', 'admin']}>
            <ParentMyChildren />
          </ProtectedRoute>
        ),
      },
      {
        path: "parent/updates",
        element: (
          <ProtectedRoute allowedRoles={['parent', 'admin']}>
            <ParentWeeklyUpdates />
          </ProtectedRoute>
        ),
      },
      // Teacher Routes
      {
        path: "teacher/select-school",
        element: (
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherSchoolSelect />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/students",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherStudents />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/students/:id",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <StudentDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/pathways",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherPathways />
          </ProtectedRoute>
        ),
      },

      {
        path: "teacher/mark-attendance",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <MarkAttendance />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/attendance",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherAttendance />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/attendance/:sessionId",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherAttendance />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/capture-artifact",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherArtifactCapture />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/classes",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherClasses />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/student/:id",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <StudentDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/assessments",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherAssessments />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/learner/:learnerId",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherLearnerPortfolio />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/communication",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherCommunication />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/sessions",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherSessions />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher/tasks",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherTasks />
          </ProtectedRoute>
        ),
      },
      // Leader Routes
      {
        path: "leader",
        element: (
          <ProtectedRoute allowedRoles={['leader', 'admin']}>
            <LeaderDashboard />
          </ProtectedRoute>
        ),
      },
      // School Routes
      {
        path: "school",
        element: (
          <ProtectedRoute allowedRoles={['school', 'admin']}>
            <SchoolDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/students",
        element: (
          <ProtectedRoute allowedRoles={['school', 'admin']}>
            <SchoolStudents />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/teachers",
        element: (
          <ProtectedRoute allowedRoles={['school', 'admin']}>
            <SchoolTeachers />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/pathways",
        element: (
          <ProtectedRoute allowedRoles={['school', 'admin']}>
            <SchoolPathways />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/progress",
        element: (
          <ProtectedRoute allowedRoles={['school', 'admin']}>
            <SchoolProgress />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/badges",
        element: (
          <ProtectedRoute allowedRoles={['school', 'admin']}>
            <SchoolBadges />
          </ProtectedRoute>
        ),
      },
      {
        path: "school/analytics",
        element: (
          <ProtectedRoute allowedRoles={['school', 'admin']}>
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
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/courses",
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCourseManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/curriculum-entry",
        element: (
          <ProtectedRoute allowedRoles={['admin', 'data_entry']}>
            <CurriculumDataEntry />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/activities",
        element: (
          <ProtectedRoute allowedRoles={['admin', 'data_entry']}>
            <ActivityManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/schools",
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SchoolManagement />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // 404 fallback
  {
    path: "*",
    element: <NotFoundPage />,
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
