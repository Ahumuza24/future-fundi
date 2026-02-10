import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import StudentDashboard from "@/pages/StudentDashboard";
import PathwayLearning from "@/pages/PathwayLearning";
import ParentPortal from "@/pages/ParentPortal";
import ParentMyChildren from "@/pages/ParentMyChildren";
import ParentWeeklyUpdates from "@/pages/ParentWeeklyUpdates";
import TeacherDashboard from "@/pages/TeacherDashboard";
import TeacherAttendance from "@/pages/TeacherAttendance";
import TeacherArtifactCapture from "@/pages/TeacherArtifactCapture";
import TeacherClasses from "@/pages/TeacherClasses";
import TeacherStudents from "@/pages/TeacherStudents";
import TeacherPathways from "@/pages/TeacherPathways";
import AddStudent from "@/pages/AddStudent";
import MarkAttendance from "@/pages/MarkAttendance";
import StudentDetail from "@/pages/StudentDetail";
import TeacherAssessments from "@/pages/TeacherAssessments";
import TeacherLearnerPortfolio from "@/pages/TeacherLearnerPortfolio";
import TeacherCommunication from "@/pages/TeacherCommunication";
import LeaderDashboard from "@/pages/LeaderDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminCourseManagement from "@/pages/AdminCourseManagement";
import UserManagement from "@/pages/UserManagement";
import SchoolManagement from "@/pages/SchoolManagement";
import CurriculumDataEntry from "@/pages/CurriculumDataEntry";
import ActivityManagement from "@/pages/ActivityManagement";
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
        path: "teacher/add-student",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <AddStudent />
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
      // Leader Routes
      {
        path: "leader",
        element: (
          <ProtectedRoute allowedRoles={['leader', 'admin']}>
            <LeaderDashboard />
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
