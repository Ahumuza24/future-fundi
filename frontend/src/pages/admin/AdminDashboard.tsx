import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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

// ── Types ─────────────────────────────────────────────────────────────────────

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
  schools: { total: number };
  courses: { total: number; modules: number };
  enrollments: { total: number; new_last_7_days: number };
  activity: { sessions: number; artifacts: number; events: number };
}

interface SchoolItem {
  id: string;
  name: string;
  code: string;
}

const EMPTY_ANALYTICS: AnalyticsData = {
  users: { total: 0, active: 0, learners: 0, teachers: 0, parents: 0, active_today: 0, new_last_7_days: 0 },
  schools: { total: 0 },
  courses: { total: 0, modules: 0 },
  enrollments: { total: 0, new_last_7_days: 0 },
  activity: { sessions: 0, artifacts: 0, events: 0 },
};

// ── Query helpers ─────────────────────────────────────────────────────────────

async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await adminApi.analytics.overview();
  const data = res?.data;
  if (data?.users) return data as AnalyticsData;
  return {
    users: data?.users ?? EMPTY_ANALYTICS.users,
    schools: data?.schools ?? EMPTY_ANALYTICS.schools,
    courses: data?.courses ?? EMPTY_ANALYTICS.courses,
    enrollments: data?.enrollments ?? EMPTY_ANALYTICS.enrollments,
    activity: data?.activity ?? EMPTY_ANALYTICS.activity,
  };
}

async function fetchSchools(): Promise<SchoolItem[]> {
  const res = await adminApi.tenants.getAll();
  const raw = res?.data;
  const list: SchoolItem[] = Array.isArray(raw) ? raw : (raw?.results ?? []);
  return list.slice(0, 3);
}

// ── Component ─────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const navigate = useNavigate();

  const {
    data: analytics = EMPTY_ANALYTICS,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AnalyticsData>({
    queryKey: ["admin", "analytics", "overview"],
    queryFn: fetchAnalytics,
  });

  const { data: schools = [] } = useQuery<SchoolItem[]>({
    queryKey: ["admin", "tenants", "list"],
    queryFn: fetchSchools,
  });

  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? "Failed to load dashboard data"
        : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-fundi-cyan mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">

        {/* Header */}
        <header className="stagger [animation-delay:0ms]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-fundi-red/10">
                <Shield className="h-8 w-8 text-fundi-red" />
              </div>
              <div>
                <h1 className="heading-font text-3xl md:text-4xl font-bold text-fundi-black">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600">System management and monitoring</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        {/* Error Banner */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">Error Loading Dashboard</h3>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Showing default values. Please refresh or contact support if the problem persists.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
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
        <div className="grid md:grid-cols-3 gap-4 stagger [animation-delay:50ms]">
          <Card className="border-l-4 border-l-fundi-orange">
            <CardHeader className="pb-3">
              <CardDescription>Active Users Today</CardDescription>
              <CardTitle className="text-3xl mono-font text-fundi-orange">
                {analytics.users.active_today}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">of {analytics.users.total} total</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-fundi-cyan">
            <CardHeader className="pb-3">
              <CardDescription>Total Schools</CardDescription>
              <CardTitle className="text-3xl mono-font text-fundi-cyan">
                {analytics.schools.total}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Across East Africa</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-fundi-purple">
            <CardHeader className="pb-3">
              <CardDescription>Total Learners</CardDescription>
              <CardTitle className="text-3xl mono-font text-fundi-purple">
                {analytics.users.learners}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Active students</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="stagger [animation-delay:100ms] border-l-4 border-l-fundi-orange">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-fundi-orange" />
                User Distribution
              </CardTitle>
              <CardDescription>By role across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-fundi-orange" />
                    <span className="font-semibold">Learners</span>
                  </div>
                  <span className="mono-font font-bold text-fundi-orange">
                    {analytics.users.learners}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-fundi-cyan" />
                    <span className="font-semibold">Teachers</span>
                  </div>
                  <span className="mono-font font-bold text-fundi-cyan">
                    {analytics.users.teachers}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-fundi-purple" />
                    <span className="font-semibold">Parents</span>
                  </div>
                  <span className="mono-font font-bold text-fundi-purple">
                    {analytics.users.parents}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-lime-50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-fundi-lime" />
                    <span className="font-semibold">Total Users</span>
                  </div>
                  <span className="mono-font font-bold text-fundi-lime">
                    {analytics.users.total}
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

          <Card className="stagger [animation-delay:150ms] border-l-4 border-l-fundi-cyan">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-fundi-cyan" />
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
                    {analytics.users.new_last_7_days}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Total Enrollments</span>
                  </div>
                  <span className="mono-font font-bold text-green-600">
                    {analytics.enrollments.total}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Total Sessions</span>
                  </div>
                  <span className="mono-font font-bold text-purple-600">
                    {analytics.activity.sessions}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold">Total Artifacts</span>
                  </div>
                  <span className="mono-font font-bold text-orange-600">
                    {analytics.activity.artifacts}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* School Management */}
        <Card className="stagger [animation-delay:200ms] border-l-4 border-l-fundi-purple">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-6 w-6 text-fundi-purple" />
                  School Management
                </CardTitle>
                <CardDescription>Manage schools and tenants</CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate('/admin/schools')}>
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
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 stagger [animation-delay:250ms]">
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

          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2 border-fundi-cyan text-fundi-cyan hover:bg-cyan-50"
            onClick={() => navigate('/admin/monitor')}
          >
            <Activity className="h-6 w-6" />
            <span className="text-sm">Activity Monitor</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={() => navigate('/admin/analytics')}
          >
            <TrendingUp className="h-6 w-6" />
            <span className="text-sm">Analytics</span>
          </Button>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
