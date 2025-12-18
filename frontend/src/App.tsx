import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import StudentDashboard from "@/pages/StudentDashboard";
import ParentPortal from "@/pages/ParentPortal";
import TeacherCapture from "@/pages/TeacherCapture";
import LeaderDashboard from "@/pages/LeaderDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
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
        path: "teacher",
        element: (
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherCapture />
          </ProtectedRoute>
        ),
      },
      {
        path: "leader",
        element: (
          <ProtectedRoute allowedRoles={['leader', 'admin']}>
            <LeaderDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
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
