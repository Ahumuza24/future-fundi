import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import StudentDashboard from "@/pages/StudentDashboard";
import ParentPortal from "@/pages/ParentPortal";
import TeacherCapture from "@/pages/TeacherCapture";
import LeaderDashboard from "@/pages/LeaderDashboard";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
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
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "parent",
        element: (
          <ProtectedRoute>
            <ParentPortal />
          </ProtectedRoute>
        ),
      },
      {
        path: "teacher",
        element: (
          <ProtectedRoute>
            <TeacherCapture />
          </ProtectedRoute>
        ),
      },
      {
        path: "leader",
        element: (
          <ProtectedRoute>
            <LeaderDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
