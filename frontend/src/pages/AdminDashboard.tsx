import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  School,
  Settings,
  Database,
  Activity,
  Shield,
  TrendingUp,
  FileText,
  UserPlus,
  Building,
  RefreshCw
} from "lucide-react";
import { adminApi } from "@/lib/api";

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    learners: number;
    teachers: number;
    parents: number;
    active_today: number;
    new_last_7_days: number;
  };
  schools: {
    total: number;
  };
  courses: {
    total: number;
    modules: number;
  };
  enrollments: {
    total: number;
    new_last_7_days: number;
  };
  activity: {
    sessions: number;
    artifacts: number;
    events: number;
  };
}

interface School {
  id: string;
  name: string;
  code: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch analytics overview
      const analyticsResponse = await adminApi.analytics.overview();

      // Validate response structure
      if (analyticsResponse?.data?.users && analyticsResponse?.data?.schools) {
        setAnalytics(analyticsResponse.data);
      } else {
        console.error('Invalid analytics response structure:', analyticsResponse);
        setError('Invalid data received from server');
        // Set default empty analytics to prevent crashes
        setAnalytics({
          users: { total: 0, active: 0, learners: 0, teachers: 0, parents: 0, active_today: 0, new_last_7_days: 0 },
          schools: { total: 0 },
          courses: { total: 0, modules: 0 },
          enrollments: { total: 0, new_last_7_days: 0 },
          activity: { sessions: 0, artifacts: 0, events: 0 }
        });
      }

      // Fetch schools
      const schoolsResponse = await adminApi.tenants.getAll();
      const schoolsData = Array.isArray(schoolsResponse.data)
        ? schoolsResponse.data
        : schoolsResponse.data.results || [];
      setSchools(schoolsData.slice(0, 3)); // Show first 3 schools
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load dashboard data';
      setError(errorMessage);
      // Set default empty analytics to prevent crashes
      setAnalytics({
        users: { total: 0, active: 0, learners: 0, teachers: 0, parents: 0, active_today: 0, new_last_7_days: 0 },
        schools: { total: 0 },
        courses: { total: 0, modules: 0 },
        enrollments: { total: 0, new_last_7_days: 0 },
        activity: { sessions: 0, artifacts: 0, events: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-[var(--fundi-cyan)] mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <header className="stagger" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(233, 30, 37, 0.1)' }}>
                <Shield className="h-8 w-8" style={{ color: 'var(--fundi-red)' }} />
              </div>
              <div>
                <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: 'var(--fundi-black)' }}>
                  Admin Dashboard
                </h1>
                <p className="text-gray-600">System management and monitoring</p>
              </div>
            </div>
            <Button variant="outline" onClick={fetchData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">Error Loading Dashboard</h3>
                  <p className="text-sm text-red-700">{error}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Showing default values. Please refresh or contact support if the problem persists.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  className="border-red-300 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-4 stagger" style={{ animationDelay: '50ms' }}>
          <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-orange)' }}>
            <CardHeader className="pb-3">
              <CardDescription>Active Users Today</CardDescription>
              <CardTitle className="text-3xl mono-font" style={{ color: 'var(--fundi-orange)' }}>
                {analytics?.users.active_today || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">of {analytics?.users.total || 0} total</p>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-cyan)' }}>
            <CardHeader className="pb-3">
              <CardDescription>Total Schools</CardDescription>
              <CardTitle className="text-3xl mono-font" style={{ color: 'var(--fundi-cyan)' }}>
                {analytics?.schools.total || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Across East Africa</p>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-purple)' }}>
            <CardHeader className="pb-3">
              <CardDescription>Total Learners</CardDescription>
              <CardTitle className="text-3xl mono-font" style={{ color: 'var(--fundi-purple)' }}>
                {analytics?.users.learners || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Active students</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="stagger border-l-4" style={{ animationDelay: '100ms', borderLeftColor: 'var(--fundi-orange)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" style={{ color: 'var(--fundi-orange)' }} />
                User Distribution
              </CardTitle>
              <CardDescription>By role across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" style={{ color: 'var(--fundi-orange)' }} />
                    <span className="font-semibold">Learners</span>
                  </div>
                  <span className="mono-font font-bold" style={{ color: 'var(--fundi-orange)' }}>
                    {analytics?.users.learners || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" style={{ color: 'var(--fundi-cyan)' }} />
                    <span className="font-semibold">Teachers</span>
                  </div>
                  <span className="mono-font font-bold" style={{ color: 'var(--fundi-cyan)' }}>
                    {analytics?.users.teachers || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" style={{ color: 'var(--fundi-purple)' }} />
                    <span className="font-semibold">Parents</span>
                  </div>
                  <span className="mono-font font-bold" style={{ color: 'var(--fundi-purple)' }}>
                    {analytics?.users.parents || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-lime-50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" style={{ color: 'var(--fundi-lime)' }} />
                    <span className="font-semibold">Total Users</span>
                  </div>
                  <span className="mono-font font-bold" style={{ color: 'var(--fundi-lime)' }}>
                    {analytics?.users.total || 0}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate('/admin/users')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </CardContent>
          </Card>

          <Card className="stagger border-l-4" style={{ animationDelay: '150ms', borderLeftColor: 'var(--fundi-cyan)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6" style={{ color: 'var(--fundi-cyan)' }} />
                Platform Activity
              </CardTitle>
              <CardDescription>Recent system statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">New Users (7 days)</span>
                  </div>
                  <span className="mono-font font-bold text-blue-600">
                    {analytics?.users.new_last_7_days || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Total Enrollments</span>
                  </div>
                  <span className="mono-font font-bold text-green-600">
                    {analytics?.enrollments.total || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Total Sessions</span>
                  </div>
                  <span className="mono-font font-bold text-purple-600">
                    {analytics?.activity.sessions || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold">Total Artifacts</span>
                  </div>
                  <span className="mono-font font-bold text-orange-600">
                    {analytics?.activity.artifacts || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* School Management */}
        <Card className="stagger border-l-4" style={{ animationDelay: '200ms', borderLeftColor: 'var(--fundi-purple)' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-6 w-6" style={{ color: 'var(--fundi-purple)' }} />
                  School Management
                </CardTitle>
                <CardDescription>Manage schools and tenants</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/schools')}
              >
                <School className="h-4 w-4 mr-2" />
                View All Schools
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {schools.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {schools.map((school) => (
                  <Card key={school.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{school.name}</CardTitle>
                      <CardDescription>Code: {school.code}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate('/admin/schools')}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <School className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No schools found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/admin/schools')}
                >
                  Add First School
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Actions */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 stagger" style={{ animationDelay: '250ms' }}>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={() => navigate('/admin/users')}
          >
            <Users className="h-6 w-6" />
            <span className="text-sm">User Management</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={() => navigate('/admin/schools')}
          >
            <School className="h-6 w-6" />
            <span className="text-sm">School Management</span>
          </Button>

          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-sm">Export Reports</span>
          </Button>

          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <TrendingUp className="h-6 w-6" />
            <span className="text-sm">Analytics</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
