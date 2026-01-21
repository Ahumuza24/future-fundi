import { Button } from "@/components/ui/button";
import { Calendar, Folder, User } from "lucide-react";
import CourseLadder from "@/components/student/CourseLadder";
import AchievementsList from "@/components/student/AchievementsList";
import SuggestedActivities from "@/components/student/SuggestedActivities";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

const StudentDashboard = () => {
  const user = getCurrentUser();

  return (
    <div className="min-h-screen p-3 md:p-4 lg:p-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-font text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--fundi-black)' }}>
              Welcome back{user?.first_name ? `, ${user.first_name}` : ''}!
            </h1>
            <p className="text-gray-600">Ready to continue your learning journey?</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Week 12, Term 2</span>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Course Progress */}
          <div className="lg:col-span-4 space-y-6">
            <CourseLadder />
          </div>

          {/* Right Column - Activities, Achievements, Portfolio */}
          <div className="lg:col-span-8 space-y-6">

            {/* Suggested Next Activities */}
            <SuggestedActivities />

            {/* Achievements Earned */}
            <AchievementsList />

            {/* Student Portfolio */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="heading-font text-2xl font-bold" style={{ color: 'var(--fundi-black)' }}>
                  My Portfolio
                </h2>
                <Button variant="outline" className="gap-2">
                  <Folder className="h-4 w-4" />
                  View Full Portfolio
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card
                    key={i}
                    className="hover:scale-105 hover:shadow-lg transition-all cursor-pointer overflow-hidden group border-0 shadow-md"
                  >
                    <div
                      className="h-32 bg-gradient-to-br rounded-t-lg relative overflow-hidden"
                      style={{
                        background: i === 1
                          ? 'linear-gradient(135deg, var(--fundi-orange), var(--fundi-pink))'
                          : i === 2
                            ? 'linear-gradient(135deg, var(--fundi-cyan), var(--fundi-lime))'
                            : 'linear-gradient(135deg, var(--fundi-purple), var(--fundi-cyan))'
                      }}
                    >
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">Robot Prototype {i}</CardTitle>
                      <CardDescription className="text-xs">Robotics • Oct {10 + i}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
