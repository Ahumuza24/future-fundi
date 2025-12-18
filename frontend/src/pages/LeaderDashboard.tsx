import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  TrendingUp, 
  Award, 
  AlertTriangle,
  Download,
  BarChart3,
  Target
} from "lucide-react";

const LeaderDashboard = () => {
  // Mock data - will be replaced with React Query
  const kpis = {
    totalLearners: 1247,
    averageAttendance: 94.5,
    artifactsPerLearner: 4.2,
    assessmentDelta: 12.3,
    safetyIncidents: 0,
    credentialsIssued: 89,
  };

  const trendData = [
    { month: "Sep", artifacts: 3200, attendance: 92 },
    { month: "Oct", artifacts: 3800, attendance: 94 },
    { month: "Nov", artifacts: 4100, attendance: 95 },
    { month: "Dec", artifacts: 5200, attendance: 94.5 },
  ];

  const topPerformers = [
    { name: "Amina Nakato", score: 92, gate: "Thrive" },
    { name: "David Okello", score: 88, gate: "Thrive" },
    { name: "Sarah Achieng", score: 85, gate: "Grow" },
  ];

  const equityMetrics = {
    female: 52,
    male: 48,
    equityFlag: 23,
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <header className="stagger flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={{ animationDelay: '0ms' }}>
          <div>
            <h1 className="heading-font text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--fundi-black)' }}>
              Leader Dashboard
            </h1>
            <p className="text-gray-600 text-sm md:text-base">School-wide impact and performance metrics</p>
          </div>
          <Button 
            variant="orange" 
            size="lg"
            className="font-semibold shadow-md hover:shadow-lg transition-shadow"
          >
            <Download className="h-5 w-5 mr-2" />
            Impact Brief
          </Button>
        </header>

        {/* KPI Tiles - Enhanced */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="stagger border-l-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1" style={{ 
            animationDelay: '50ms',
            borderLeftColor: 'var(--fundi-orange)',
            borderLeftWidth: '6px'
          }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Learners</CardTitle>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(240, 87, 34, 0.1)' }}>
                  <Users className="h-5 w-5" style={{ color: 'var(--fundi-orange)' }} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mono-font text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--fundi-orange)' }}>
                {kpis.totalLearners.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">Active this term</p>
              <div className="mt-3 flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-semibold">+5.2%</span>
                <span className="text-gray-500">vs last term</span>
              </div>
            </CardContent>
          </Card>

          <Card className="stagger border-l-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1" style={{ 
            animationDelay: '100ms',
            borderLeftColor: 'var(--fundi-lime)',
            borderLeftWidth: '6px'
          }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Attendance</CardTitle>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(158, 203, 58, 0.1)' }}>
                  <TrendingUp className="h-5 w-5" style={{ color: 'var(--fundi-lime)' }} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mono-font text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--fundi-lime)' }}>
                {kpis.averageAttendance}%
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full" 
                     style={{ 
                       width: `${kpis.averageAttendance}%`,
                       backgroundColor: 'var(--fundi-lime)'
                     }}>
                </div>
              </div>
              <p className="text-xs text-green-600 font-semibold">↑ 2.3% from last month</p>
            </CardContent>
          </Card>

          <Card className="stagger border-l-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1" style={{ 
            animationDelay: '150ms',
            borderLeftColor: 'var(--fundi-cyan)',
            borderLeftWidth: '6px'
          }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Artifacts/Learner</CardTitle>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(21, 189, 219, 0.1)' }}>
                  <BarChart3 className="h-5 w-5" style={{ color: 'var(--fundi-cyan)' }} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mono-font text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--fundi-cyan)' }}>
                {kpis.artifactsPerLearner}
              </div>
              <p className="text-xs text-gray-500 mb-2">Average per learner</p>
              <p className="text-xs text-green-600 font-semibold">↑ 0.8 from last month</p>
            </CardContent>
          </Card>

          <Card className="stagger border-l-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1" style={{ 
            animationDelay: '200ms',
            borderLeftColor: kpis.safetyIncidents === 0 ? 'var(--fundi-lime)' : 'var(--fundi-red)',
            borderLeftWidth: '6px'
          }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Safety Incidents</CardTitle>
                <div className="p-2 rounded-lg" style={{ 
                  backgroundColor: kpis.safetyIncidents === 0 
                    ? 'rgba(158, 203, 58, 0.1)' 
                    : 'rgba(233, 30, 37, 0.1)' 
                }}>
                  <AlertTriangle className={`h-5 w-5 ${kpis.safetyIncidents === 0 ? '' : ''}`} 
                                 style={{ color: kpis.safetyIncidents === 0 ? 'var(--fundi-lime)' : 'var(--fundi-red)' }} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mono-font text-3xl md:text-4xl font-bold mb-2" style={{ 
                color: kpis.safetyIncidents === 0 ? 'var(--fundi-lime)' : 'var(--fundi-red)' 
              }}>
                {kpis.safetyIncidents}
              </div>
              <p className="text-xs text-green-600 font-semibold">✓ Safe environment</p>
            </CardContent>
          </Card>
        </div>

        {/* Trend Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="stagger" style={{ animationDelay: '250ms' }}>
            <CardHeader>
              <CardTitle>Artifact Submissions Trend</CardTitle>
              <CardDescription>Monthly artifact submissions across all learners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendData.map((data, index) => (
                  <div key={data.month} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-semibold text-gray-600">{data.month}</div>
                    <div className="flex-1">
                      <div className="h-8 bg-gradient-to-r from-[var(--fundi-orange)] to-[var(--fundi-cyan)] rounded-lg relative"
                           style={{ width: `${(data.artifacts / 5500) * 100}%` }}>
                        <span className="absolute right-2 top-1 text-white text-sm font-semibold">
                          {data.artifacts}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="stagger" style={{ animationDelay: '300ms' }}>
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
              <CardDescription>Monthly average attendance percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendData.map((data, index) => (
                  <div key={data.month} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-semibold text-gray-600">{data.month}</div>
                    <div className="flex-1">
                      <div className="h-8 bg-gradient-to-r from-[var(--fundi-lime)] to-[var(--fundi-cyan)] rounded-lg relative"
                           style={{ width: `${data.attendance}%` }}>
                        <span className="absolute right-2 top-1 text-white text-sm font-semibold">
                          {data.attendance}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance & Equity */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="stagger" style={{ animationDelay: '350ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6" style={{ color: 'var(--fundi-yellow-dark)' }} />
                Top Performers
              </CardTitle>
              <CardDescription>Highest pathway scores this term</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((student, index) => (
                  <div key={student.name} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                         style={{ backgroundColor: 'var(--fundi-orange)' }}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{student.name}</div>
                      <div className="text-sm text-gray-600">Pathway Score: {student.score}</div>
                    </div>
                    <div className="px-3 py-1 rounded-full text-sm font-semibold"
                         style={{ 
                           backgroundColor: 'var(--fundi-lime)', 
                           color: 'var(--fundi-black)' 
                         }}>
                      {student.gate}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="stagger" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6" style={{ color: 'var(--fundi-purple)' }} />
                Equity Metrics
              </CardTitle>
              <CardDescription>Diversity and inclusion tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold">Gender Distribution</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 bg-[var(--fundi-pink)] rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                         style={{ width: `${equityMetrics.female}%` }}>
                      Female {equityMetrics.female}%
                    </div>
                    <div className="flex-1 h-8 bg-[var(--fundi-cyan)] rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                         style={{ width: `${equityMetrics.male}%` }}>
                      Male {equityMetrics.male}%
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold">Equity Flag Learners</span>
                    <span className="text-sm font-semibold mono-font">{equityMetrics.equityFlag}%</span>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                    <div className="h-full bg-[var(--fundi-purple)] flex items-center justify-center text-white font-semibold text-sm"
                         style={{ width: `${equityMetrics.equityFlag}%` }}>
                      {equityMetrics.equityFlag}%
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Learners receiving additional support
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Credentials Issued</div>
                      <div className="text-sm text-gray-600">This term</div>
                    </div>
                    <div className="mono-font text-3xl font-bold" style={{ color: 'var(--fundi-purple)' }}>
                      {kpis.credentialsIssued}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Delta */}
        <Card className="stagger" style={{ animationDelay: '450ms' }}>
          <CardHeader>
            <CardTitle>Assessment Performance Delta</CardTitle>
            <CardDescription>Average improvement in assessment scores over the term</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="mono-font text-6xl font-bold" style={{ color: 'var(--fundi-lime)' }}>
                  +{kpis.assessmentDelta}%
                </div>
                <p className="text-gray-600 mt-2">Average score improvement</p>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold w-32">Problem Solving</span>
                  <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--fundi-lime)] flex items-center justify-end pr-2"
                         style={{ width: '85%' }}>
                      <span className="text-xs font-semibold text-white">+15%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold w-32">Technical Skills</span>
                  <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--fundi-cyan)] flex items-center justify-end pr-2"
                         style={{ width: '78%' }}>
                      <span className="text-xs font-semibold text-white">+12%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold w-32">Communication</span>
                  <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--fundi-purple)] flex items-center justify-end pr-2"
                         style={{ width: '70%' }}>
                      <span className="text-xs font-semibold text-white">+10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="stagger flex justify-center gap-4" style={{ animationDelay: '500ms' }}>
          <Button variant="orange" size="lg">
            <Download className="h-5 w-5 mr-2" />
            Download Full Impact Brief
          </Button>
          <Button variant="outline" size="lg">
            View Detailed Analytics
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeaderDashboard;
