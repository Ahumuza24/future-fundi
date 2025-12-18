import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users, BookOpen, BarChart3 } from "lucide-react";

const HomePage = () => {
  const dashboards = [
    {
      title: "Student Dashboard",
      description: "Track your learning journey, pathway score, and artifacts",
      icon: User,
      path: "/student",
      color: "var(--fundi-orange)",
      delay: "50ms",
    },
    {
      title: "Parent Portal",
      description: "Monitor your child's progress and view their portfolio",
      icon: Users,
      path: "/parent",
      color: "var(--fundi-purple)",
      delay: "100ms",
    },
    {
      title: "Teacher Capture",
      description: "Record attendance, submit artifacts, and track assessments",
      icon: BookOpen,
      path: "/teacher",
      color: "var(--fundi-cyan)",
      delay: "150ms",
    },
    {
      title: "Leader Dashboard",
      description: "School-wide analytics, KPIs, and impact metrics",
      icon: BarChart3,
      path: "/leader",
      color: "var(--fundi-lime)",
      delay: "200ms",
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="stagger text-center" style={{ animationDelay: '0ms' }}>
          <h1 className="heading-font text-5xl font-bold mb-4" style={{ color: 'var(--fundi-black)' }}>
            Future Fundi Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transforming weekly STEM learning into verified skills, credentials, and career pathways
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="mono-font">60,000+ Learners</span>
            <span>•</span>
            <span className="mono-font">500 Schools</span>
            <span>•</span>
            <span className="mono-font">East Africa</span>
          </div>
        </header>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {dashboards.map((dashboard) => {
            const Icon = dashboard.icon;
            return (
              <Link key={dashboard.path} to={dashboard.path}>
                <Card 
                  className="stagger border-l-4 hover:shadow-xl hover:scale-105 transition-all cursor-pointer h-full"
                  style={{ 
                    animationDelay: dashboard.delay,
                    borderLeftColor: dashboard.color
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: `${dashboard.color}20` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: dashboard.color }} />
                      </div>
                      <CardTitle className="text-2xl">{dashboard.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {dashboard.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="inline-flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
                      style={{ color: dashboard.color }}
                    >
                      Open Dashboard →
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Features Overview */}
        <div className="stagger max-w-5xl mx-auto mt-12" style={{ animationDelay: '250ms' }}>
          <h2 className="heading-font text-3xl font-bold text-center mb-8" style={{ color: 'var(--fundi-black)' }}>
            Growth Tree Model
          </h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold"
                   style={{ backgroundColor: 'var(--fundi-orange)', color: 'white' }}>
                1
              </div>
              <h3 className="font-semibold mb-2">Curiosity</h3>
              <p className="text-sm text-gray-600">Weekly hands-on STEM activities</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold"
                   style={{ backgroundColor: 'var(--fundi-cyan)', color: 'white' }}>
                2
              </div>
              <h3 className="font-semibold mb-2">Skills</h3>
              <p className="text-sm text-gray-600">Artifact capture & pathway scoring</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold"
                   style={{ backgroundColor: 'var(--fundi-lime)', color: 'white' }}>
                3
              </div>
              <h3 className="font-semibold mb-2">Credentials</h3>
              <p className="text-sm text-gray-600">Micro-credentials & showcases</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold"
                   style={{ backgroundColor: 'var(--fundi-purple)', color: 'white' }}>
                4
              </div>
              <h3 className="font-semibold mb-2">Work</h3>
              <p className="text-sm text-gray-600">Internships & career pathways</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
