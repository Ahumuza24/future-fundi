import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import StudentDashboard from "@/pages/StudentDashboard";
import ParentPortal from "@/pages/ParentPortal";
import ParentMyChildren from "@/pages/ParentMyChildren";
import ParentWeeklyUpdates from "@/pages/ParentWeeklyUpdates";
import TeacherDashboard from "@/pages/TeacherDashboard";
import TeacherAttendance from "@/pages/TeacherAttendance";
import TeacherArtifactCapture from "@/pages/TeacherArtifactCapture";
import TeacherClasses from "@/pages/TeacherClasses";
import TeacherAssessments from "@/pages/TeacherAssessments";
import TeacherLearnerPortfolio from "@/pages/TeacherLearnerPortfolio";
import TeacherCommunication from "@/pages/TeacherCommunication";
import LeaderDashboard from "@/pages/LeaderDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminCourseManagement from "@/pages/AdminCourseManagement";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/",
    element: <PageLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "student",
        element: (
          <ProtectedRoute allowedRoles={['learner', 'admin']}>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
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
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
