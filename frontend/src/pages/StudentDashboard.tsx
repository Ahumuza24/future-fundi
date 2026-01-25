import {
  Calendar,
  MapPin,
  School,
  ArrowRight,
  User,
  Star,
  Award,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { motion } from "framer-motion";
import { PathwayCard } from "@/components/student/PathwayCard";
import { MicroCredentialBadge } from "@/components/student/MicroCredentialBadge";
import { Avatar } from "@/components/ui/avatar";
import {
  upcomingEvents,
  mockPathways,
  earnedBadges,
  nextBadge,
  activeProjects
} from "@/data/studentDashboardData";

const StudentDashboard = () => {
  const user = getCurrentUser();
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Student';

  return (
    <div className="min-h-screen p-4 lg:p-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={user?.avatar_url}
              name={fullName}
              size="xl"
              className="hidden md:flex border-4 border-white shadow-lg"
            />
            <div>
              <h1 className="heading-font text-3xl md:text-4xl font-bold mb-2 text-[var(--fundi-black)]">
                Welcome back, {user?.first_name || 'Student'}!
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-100">
                  <School className="h-4 w-4 text-gray-500" />
                  {user?.tenant_name || 'Future Fundi Academy'}
                </span>
                <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-100">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  Year 9 • Class 9B
                </span>
                <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-100">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Term 2, Week 12
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
            <p className="text-sm font-medium text-gray-500">Upcoming Activities</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto md:flex">
              {upcomingEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white px-3 py-2 rounded-lg shadow-sm border-l-4 text-xs flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start gap-2 md:gap-0"
                  style={{ borderLeftColor: event.color }}
                >
                  <p className="font-bold">{event.date}</p>
                  <p className="text-gray-600 line-clamp-1">{event.title}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content Info Grid */}
        <div className="grid lg:grid-cols-12 gap-8">

          {/* Main Column: Pathways & Projects */}
          <div className="lg:col-span-8 space-y-8">

            {/* My Pathways Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-font text-2xl font-bold text-[var(--fundi-black)]">
                  My Pathways
                </h2>
                <Button variant="ghost" className="text-sm hover:text-[var(--fundi-orange)]">View All</Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {mockPathways.map((pathway, i) => (
                  <motion.div
                    key={pathway.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <PathwayCard pathway={pathway} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Projects (Artifacts) Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-font text-2xl font-bold text-[var(--fundi-black)]">
                  Active Projects
                </h2>
              </div>

              <div className="space-y-4">
                {activeProjects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                  >
                    <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden border-l-4 group" style={{ borderLeftColor: project.color }}>
                      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              {project.pathway}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">• Due {project.dueDate}</span>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-[var(--fundi-orange)] transition-colors">{project.title}</h3>
                          <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
                        </div>

                        <div className="flex items-center gap-4 min-w-[140px] pt-2 sm:pt-0 border-t sm:border-0 border-gray-100 mt-2 sm:mt-0">
                          <div className="flex-1 space-y-1.5 ">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-gray-500">{project.status}</span>
                              <span style={{ color: project.color }}>{project.progress}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                              />
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-600 shrink-0">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar: Microcredentials & Recommended */}
          <div className="lg:col-span-4 space-y-8">

            {/* Recommended Next Step */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-l-4 bg-gradient-to-br from-white to-blue-50/50" style={{ borderLeftColor: 'var(--fundi-orange)' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 fill-orange-400 text-orange-400" />
                    Recommended Step
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm border">
                    <p className="font-semibold text-gray-800">Advanced Sensors Module</p>
                    <p className="text-sm text-gray-500">Robotics Pathway • 2 hrs remaining</p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs font-bold text-orange-600">Earn "Sensor Wizard" Badge</span>
                      <Button size="sm" className="bg-[var(--fundi-orange)] hover:bg-orange-600 text-white">
                        Start Now <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Badges & Microcredentials */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-gray-400" />
                    My Badges & Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {earnedBadges.map((badge) => (
                      <MicroCredentialBadge key={badge.id} credential={badge} />
                    ))}
                    <MicroCredentialBadge credential={nextBadge} />
                  </div>
                  <Button variant="outline" className="w-full mt-4 text-xs font-medium hover:text-[var(--fundi-orange)]">
                    View Full Credential Passport
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Dates Vertical (Optional extra) */}
            <div className="pt-4">
              <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                <Circle className="h-3 w-3 fill-current" />
                Timeline
              </h3>
              <div className="border-l-2 border-gray-100 ml-1.5 space-y-6">
                {upcomingEvents.map((event, i) => (
                  <div key={`tl-${event.id}`} className="relative pl-6">
                    <div
                      className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: event.color }}
                    />
                    <p className="text-xs text-gray-400 mb-0.5">{event.date}</p>
                    <p className="text-sm font-semibold text-gray-700">{event.title}</p>
                  </div>
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
