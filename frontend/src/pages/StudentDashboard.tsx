import { useState } from "react";
import {
  Calendar,
  MapPin,
  School,
  ArrowRight,
  Bot,
  Globe,
  Smartphone,
  Brain,
  Printer,
  PenTool,
  Cpu,
  Wifi,
  Shield,
  Star,
  Award,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { motion } from "framer-motion";
import { PathwayCard, type PathwayProps } from "@/components/student/PathwayCard";
import { MicroCredentialBadge } from "@/components/student/MicroCredentialBadge";
import { Avatar } from "@/components/ui/avatar";

// Mock Data
const upcomingEvents = [
  { id: 1, title: "Robotics Hackathon", date: "Oct 24, 2025", type: "event", color: "var(--fundi-orange)" },
  { id: 2, title: "Web Dev Project Due", date: "Oct 30, 2025", type: "deadline", color: "var(--fundi-purple)" },
  { id: 3, title: "3D Printing Workshop", date: "Nov 05, 2025", type: "workshop", color: "var(--fundi-cyan)" },
];

const mockPathways: PathwayProps[] = [
  {
    id: "rob", title: "Robotics", icon: <Bot className="h-6 w-6" />,
    progress: 65, status: "good", microCredentialsEarned: 2, totalMicroCredentials: 5,
    currentModule: "Advanced Sensors", color: "var(--fundi-orange)"
  },
  {
    id: "web", title: "Web Development", icon: <Globe className="h-6 w-6" />,
    progress: 30, status: "warning", microCredentialsEarned: 1, totalMicroCredentials: 4,
    currentModule: "CSS Flexbox", color: "var(--fundi-purple)"
  },
  {
    id: "app", title: "App Development", icon: <Smartphone className="h-6 w-6" />,
    progress: 10, status: "good", microCredentialsEarned: 0, totalMicroCredentials: 4,
    currentModule: "React Native Basics", color: "var(--fundi-cyan)"
  },
  {
    id: "ai", title: "AI Tools", icon: <Brain className="h-6 w-6" />,
    progress: 5, status: "good", microCredentialsEarned: 0, totalMicroCredentials: 3,
    currentModule: "Intro to LLMs", color: "var(--fundi-lime)"
  },
  {
    id: "ele", title: "Electronics", icon: <Cpu className="h-6 w-6" />,
    progress: 40, status: "good", microCredentialsEarned: 1, totalMicroCredentials: 3,
    currentModule: "Circuit Design 101", color: "var(--fundi-pink)"
  },
  {
    id: "iot", title: "Internet of Things", icon: <Wifi className="h-6 w-6" />,
    progress: 15, status: "warning", microCredentialsEarned: 0, totalMicroCredentials: 3,
    currentModule: "Connecting ESP32", color: "var(--fundi-orange)"
  },
  {
    id: "3dp", title: "3D Printing", icon: <Printer className="h-6 w-6" />,
    progress: 0, status: "critical", microCredentialsEarned: 0, totalMicroCredentials: 2,
    currentModule: "Not Started", color: "var(--fundi-purple)"
  },
  {
    id: "cad", title: "CAD", icon: <PenTool className="h-6 w-6" />,
    progress: 0, status: "critical", microCredentialsEarned: 0, totalMicroCredentials: 2,
    currentModule: "Not Started", color: "var(--fundi-cyan)"
  },
  {
    id: "sec", title: "Data & Security", icon: <Shield className="h-6 w-6" />,
    progress: 0, status: "critical", microCredentialsEarned: 0, totalMicroCredentials: 4,
    currentModule: "Not Started", color: "var(--fundi-lime)"
  },
];

const earnedBadges = [
  { id: "b1", name: "Bot Builder L1", pathway: "Robotics", icon: <Bot className="h-6 w-6" />, color: "var(--fundi-orange)" },
  { id: "b2", name: "Circuit Master", pathway: "Electronics", icon: <Zap className="h-6 w-6" />, color: "var(--fundi-pink)" },
  { id: "b3", name: "HTML Hero", pathway: "Web Dev", icon: <Globe className="h-6 w-6" />, color: "var(--fundi-purple)" },
];

const nextBadge = { id: "b4", name: "Sensor Wizard", pathway: "Robotics", isLocked: true, color: "var(--fundi-orange)" };

const activeProjects = [
  {
    id: 1,
    title: "Line Following Robot",
    pathway: "Robotics",
    description: "Building a robot that follows a black line on a white surface using IR sensors.",
    status: "In Progress",
    progress: 75,
    dueDate: "Oct 28",
    color: "var(--fundi-orange)"
  },
  {
    id: 2,
    title: "Personal Portfolio Site",
    pathway: "Web Development",
    description: "Creating a responsive portfolio website to showcase my projects.",
    status: "Planning",
    progress: 15,
    dueDate: "Nov 10",
    color: "var(--fundi-purple)"
  }
];

const StudentDashboard = () => {
  const user = getCurrentUser();
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Student';

  return (
    <div className="min-h-screen p-3 md:p-4 lg:p-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={user?.avatar_url}
              name={fullName}
              size="xl"
              className="hidden md:flex border-4 border-white shadow-lg"
            />
            <div>
              <h1 className="heading-font text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--fundi-black)' }}>
                Welcome back, {user?.first_name || 'Student'}!
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md shadow-sm">
                  <School className="h-4 w-4 text-gray-500" />
                  {user?.tenant_name || 'Future Fundi Academy'}
                </span>
                <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md shadow-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  Year 9 • Class 9B
                </span>
                <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md shadow-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Term 2, Week 12
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className="text-sm font-medium text-gray-500">Upcoming Activities</p>
            <div className="flex gap-2">
              {upcomingEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white px-3 py-2 rounded-lg shadow-sm border-l-4 text-xs"
                  style={{ borderLeftColor: event.color }}
                >
                  <p className="font-bold">{event.date}</p>
                  <p className="text-gray-600">{event.title}</p>
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
                <h2 className="heading-font text-2xl font-bold" style={{ color: 'var(--fundi-black)' }}>
                  My Pathways
                </h2>
                <Button variant="ghost" className="text-sm">View All</Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
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
                <h2 className="heading-font text-2xl font-bold" style={{ color: 'var(--fundi-black)' }}>
                  Active Projects
                </h2>
                {/* <Button variant="outline" className="text-xs gap-2">
                  <Bot className="h-4 w-4" /> New Project
                </Button> */}
              </div>

              <div className="space-y-4">
                {activeProjects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-l-4" style={{ borderLeftColor: project.color }}>
                      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {project.pathway}
                            </span>
                            <span className="text-xs text-gray-400">• Due {project.dueDate}</span>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900">{project.title}</h3>
                          <p className="text-sm text-gray-600">{project.description}</p>
                        </div>

                        <div className="flex items-center gap-4 min-w-[140px]">
                          <div className="flex-1 space-y-1.5">
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
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-600">
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
                  <Button variant="outline" className="w-full mt-4 text-xs">
                    View Full Credential Passport
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Dates Vertical (Optional extra) */}
            <div className="pt-4">
              <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wide mb-3">Timeline</h3>
              <div className="border-l-2 border-gray-100 ml-3 space-y-6">
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
