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
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  UserPlus,
  Building
} from "lucide-react";

const AdminDashboard = () => {
  const systemStats = {
    totalUsers: 1547,
    totalSchools: 12,
    totalLearners: 1247,
    totalTeachers: 89,
    totalParents: 156,
    totalLeaders: 43,
    activeToday: 892,
    systemUptime: "99.8%",
  };

  const recentActivity = [
    { type: "user", action: "New teacher registered", school: "Kampala Primary", time: "5 min ago" },
    { type: "school", action: "School added", school: "Jinja Secondary", time: "1 hour ago" },
    { type: "system", action: "Database backup completed", school: "System", time: "2 hours ago" },
    { type: "user", action: "Bulk learner import", school: "Entebbe Academy", time: "3 hours ago" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <header className="stagger" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-3 mb-2">
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
        </header>

        {/* System Health */}
        <div className="grid md:grid-cols-4 gap-4 stagger" style={{ animationDelay: '50ms' }}>
          <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-lime)' }}>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                System Status
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-green-600">Healthy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Uptime: {systemStats.systemUptime}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-orange)' }}>
            <CardHeader className="pb-3">
              <CardDescription>Active Users Today</CardDescription>
              <CardTitle className="text-3xl mono-font" style={{ color: 'var(--fundi-orange)' }}>
                {systemStats.activeToday}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">of {systemStats.totalUsers} total</p>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-cyan)' }}>
            <CardHeader className="pb-3">
              <CardDescription>Total Schools</CardDescription>
              <CardTitle className="text-3xl mono-font" style={{ color: 'var(--fundi-cyan)' }}>
                {systemStats.totalSchools}
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
                {systemStats.totalLearners}
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
                    {systemStats.totalLearners}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" style={{ color: 'var(--fundi-cyan)' }} />
                    <span className="font-semibold">Teachers</span>
                  </div>
                  <span className="mono-font font-bold" style={{ color: 'var(--fundi-cyan)' }}>
                    {systemStats.totalTeachers}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" style={{ color: 'var(--fundi-purple)' }} />
                    <span className="font-semibold">Parents</span>
                  </div>
                  <span className="mono-font font-bold" style={{ color: 'var(--fundi-purple)' }}>
                    {systemStats.totalParents}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-lime-50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" style={{ color: 'var(--fundi-lime)' }} />
                    <span className="font-semibold">Leaders</span>
                  </div>
                  <span className="mono-font font-bold" style={{ color: 'var(--fundi-lime)' }}>
                    {systemStats.totalLeaders}
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </CardContent>
          </Card>

          <Card className="stagger border-l-4" style={{ animationDelay: '150ms', borderLeftColor: 'var(--fundi-cyan)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6" style={{ color: 'var(--fundi-cyan)' }} />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="p-2 rounded-lg bg-white">
                      {activity.type === 'user' && <Users className="h-4 w-4 text-orange-600" />}
                      {activity.type === 'school' && <School className="h-4 w-4 text-cyan-600" />}
                      {activity.type === 'system' && <Database className="h-4 w-4 text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{activity.action}</p>
                      <p className="text-xs text-gray-600">{activity.school}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
              <Button variant="outline">
                <School className="h-4 w-4 mr-2" />
                Add School
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {['Kampala Primary', 'Jinja Secondary', 'Entebbe Academy'].map((school, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{school}</CardTitle>
                    <CardDescription>Active • 120 learners</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="h-3 w-3 mr-1" />
                        Reports
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Actions */}
        <div className="grid md:grid-cols-4 gap-4 stagger" style={{ animationDelay: '250ms' }}>
          <Button variant="orange" className="h-20 flex flex-col gap-2">
            <Database className="h-6 w-6" />
            <span className="text-sm">Backup Database</span>
          </Button>

          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-sm">Export Reports</span>
          </Button>

          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <Settings className="h-6 w-6" />
            <span className="text-sm">System Settings</span>
          </Button>

          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <TrendingUp className="h-6 w-6" />
            <span className="text-sm">Analytics</span>
          </Button>
        </div>

        {/* Alerts */}
        <Card className="stagger border-l-4" style={{ animationDelay: '300ms', borderLeftColor: 'var(--fundi-yellow)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6" style={{ color: 'var(--fundi-yellow)' }} />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Database backup scheduled</p>
                  <p className="text-xs text-gray-600">Next backup in 2 hours</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">All systems operational</p>
                  <p className="text-xs text-gray-600">No issues detected</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
