import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { childApi } from "@/lib/api";
import {
  Users, Calendar, BookOpen, Award, CheckCircle,
  MessageSquare, AlertCircle, Clock, Zap, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChildManagement from "@/components/ChildManagement";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  age?: number;
}

interface DashboardData {
  child: Child;
  subscription: {
    status: string;
    tier: string;
    expires_at: string;
  };
  pathways: Array<{
    id: string;
    name: string;
    current_level: string;
    progress: number;
    description: string;
  }>;
  badges: Array<{
    id: string;
    name: string;
    module_name: string;
    earned_at: string;
    icon: string;
  }>;
  artifacts: Array<{
    id: string;
    title: string;
    submitted_at: string;
    learner_name: string;
  }>;
  upcoming_activities: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    end_time: string | null;
    type: string;
    description?: string;
    location?: string;
  }>;
  micro_lessons: Array<{
    id: string;
    title: string;
    category: string;
    duration: string;
  }>;
  teachers: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

const ParentPortal = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showManagement, setShowManagement] = useState(false);

  // Activity Dialog State
  const [selectedActivity, setSelectedActivity] = useState<DashboardData['upcoming_activities'][0] | null>(null);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchDashboard(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchChildren = async () => {
    // ... existing implementation
    try {
      setLoading(true);
      const response = await childApi.getAll();
      const childrenData = response.data.results || response.data;
      const childrenArray = Array.isArray(childrenData) ? childrenData : [];
      setChildren(childrenArray);

      if (childrenArray.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenArray[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch children:", err);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async (childId: string) => {
    try {
      const response = await childApi.getDashboard(childId);
      setDashboardData(response.data);
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-orange)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (showManagement) {
    // ... existing implementation
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gray-50/50">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="heading-font text-3xl font-bold text-[var(--fundi-black)]">
              Manage Children
            </h1>
            <Button
              onClick={() => {
                setShowManagement(false);
                fetchChildren();
              }}
              className="bg-white hover:bg-gray-100 text-gray-700 border"
            >
              Back to Dashboard
            </Button>
          </div>
          <ChildManagement />
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    // ... existing implementation
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-gray-50/50">
        <Card className="max-w-2xl w-full text-center p-12 shadow-xl border-dashed border-4 border-gray-200">
          <div className="w-24 h-24 bg-[var(--fundi-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-12 w-12 text-[var(--fundi-orange)]" />
          </div>
          <h2 className="heading-font text-3xl font-bold mb-4 text-[var(--fundi-black)]">
            Welcome to Future Fundi!
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            Get started by adding your children to track their amazing robotics journey.
          </p>
          <Button
            onClick={() => setShowManagement(true)}
            style={{ backgroundColor: "var(--fundi-orange)" }}
            className="text-white text-lg px-8 py-6 rounded-xl hover:opacity-90 transition-opacity"
          >
            + Add Your First Child
          </Button>
        </Card>
      </div>
    );
  }

  const COLORS = [
    "var(--fundi-orange)",
    "var(--fundi-cyan)",
    "var(--fundi-lime)",
    "var(--fundi-purple)",
    "var(--fundi-pink)",
    "var(--fundi-yellow)"
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="heading-font text-3xl md:text-4xl font-bold text-[var(--fundi-black)]">
              Parent Portal
            </h1>
            <p className="text-gray-600 mt-1">Foundations for the future.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Child Switcher */}
            <div className="flex bg-white rounded-full p-1 shadow-sm border">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    selectedChildId === child.id
                      ? "bg-[var(--fundi-orange)] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {child.first_name}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setShowManagement(true)}
              variant="outline"
              className="rounded-full border-gray-300"
            >
              <Users className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>

        {dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* LEFT COLUMN: Profile & Status */}
            <div className="lg:col-span-4 space-y-8">

              {/* Child Profile Card */}
              <Card className="border-t-4 border-t-[var(--fundi-cyan)] shadow-sm overflow-hidden">
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-24 bg-[var(--fundi-cyan)]/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--fundi-cyan)]">
                    <span className="heading-font text-3xl text-[var(--fundi-cyan)]">
                      {dashboardData.child.first_name[0]}
                    </span>
                  </div>
                  <h2 className="heading-font text-2xl font-bold text-gray-900">
                    {dashboardData.child.full_name}
                  </h2>
                  <p className="text-gray-500 font-medium">Future Innovator • {dashboardData.child.age} Years Old</p>

                  <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-600">Subscription Status</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase tracking-wide">
                        {dashboardData.subscription.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Zap className="h-4 w-4 text-[var(--fundi-yellow)]" />
                      <span>{dashboardData.subscription.tier} Plan</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enrolled Pathways */}
              <div>
                <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-gray-800">
                  <BookOpen className="h-5 w-5 text-[var(--fundi-purple)]" />
                  Current Learning Pathways
                </h3>
                <div className="space-y-4">
                  {dashboardData.pathways.length > 0 ? (
                    dashboardData.pathways.map((pathway, i) => (
                      <Card key={pathway.id} className="border-l-4 hover:shadow-md transition-shadow"
                        style={{ borderLeftColor: i === 0 ? 'var(--fundi-purple)' : 'var(--fundi-pink)' }}>
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900 line-clamp-1">{pathway.name}</h4>
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              L{pathway.current_level.replace(/\D/g, '') || '1'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                            {pathway.description || "Learning logical thinking and problem solving."}
                          </p>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: '35%', // Placeholder progress
                                backgroundColor: i === 0 ? 'var(--fundi-purple)' : 'var(--fundi-pink)'
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-right mt-1 text-gray-400 font-medium">In Progress</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center p-6 bg-white rounded-xl border border-dashed">
                      <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No active pathways</p>
                      <Button variant="ghost" onClick={() => setShowManagement(true)} className="text-[var(--fundi-orange)] hover:bg-orange-50 underline">
                        Enroll in a pathway
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Activities */}
              <div>
                <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-gray-800">
                  <Calendar className="h-5 w-5 text-[var(--fundi-orange)]" />
                  Upcoming Activities
                </h3>
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="p-0">
                    {dashboardData.upcoming_activities.length > 0 ? (
                      <div className="divide-y">
                        {dashboardData.upcoming_activities.map((activity) => (
                          <div
                            key={activity.id}
                            onClick={() => {
                              setSelectedActivity(activity);
                              setIsActivityDialogOpen(true);
                            }}
                            className="p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                          >
                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-[var(--fundi-orange)]/10 text-[var(--fundi-orange)] rounded-lg flex-shrink-0 group-hover:bg-[var(--fundi-orange)] group-hover:text-white transition-colors">
                              <span className="text-xs font-bold uppercase">{format(new Date(activity.date), 'MMM')}</span>
                              <span className="text-lg font-bold">{format(new Date(activity.date), 'd')}</span>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-bold text-gray-900 group-hover:text-[var(--fundi-orange)] transition-colors">{activity.title}</h5>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {activity.time.substring(0, 5)}
                                  {activity.end_time && ` - ${activity.end_time.substring(0, 5)}`}
                                </span>
                                <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                                  {activity.type}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center text-gray-300 group-hover:text-[var(--fundi-orange)]">
                              <Zap className="h-4 w-4 rotate-90" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500 text-sm">
                        No upcoming activities scheduled.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>

            {/* RIGHT COLUMN: Badges, Artifacts, Lessons */}
            <div className="lg:col-span-8 space-y-8">
              {/* Badges Collection */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 font-bold text-lg text-gray-800">
                    <Award className="h-5 w-5 text-[var(--fundi-yellow)]" />
                    Earned Badges
                  </h3>
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border">
                    Total: {dashboardData.badges.length}
                  </span>
                </div>

                {dashboardData.badges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {dashboardData.badges.map((badge, i) => (
                      <motion.div
                        key={badge.id}
                        whileHover={{ scale: 1.05 }}
                        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3"
                      >
                        <div className="w-16 h-16 rounded-full bg-[var(--fundi-yellow)]/20 flex items-center justify-center p-3">
                          <Award className="w-8 h-8 text-[var(--fundi-yellow-dark)]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 leading-tight mb-1">{badge.name}</h4>
                          <p className="text-xs text-gray-500">{format(new Date(badge.earned_at), 'MMM yyyy')}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-8 text-center border border-dashed text-gray-400">
                    <Award className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Completing modules will unlock badges!</p>
                  </div>
                )}
              </section>

              {/* Artifacts Gallery */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 font-bold text-lg text-gray-800">
                    <Star className="h-5 w-5 text-[var(--fundi-lime)]" />
                    Recent Artifacts
                  </h3>
                  <Button variant="ghost" size="sm" className="text-[var(--fundi-lime)] hover:text-green-700 hover:bg-green-50">
                    View All
                  </Button>
                </div>

                {dashboardData.artifacts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {dashboardData.artifacts.map((artifact, i) => (
                      <Card key={artifact.id} className="overflow-hidden hover:shadow-lg transition-shadow border-0 shadow ring-1 ring-gray-100">
                        <div className="h-32 bg-gray-100 relative group">
                          {/* Placeholder for real image since we don't have URLs in this specific payload yet */}
                          <div
                            className="absolute inset-0 flex items-center justify-center text-white font-bold text-4xl opacity-30"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          >
                            {artifact.title[0]}
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <h4 className="font-bold text-gray-900 truncate">{artifact.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{format(new Date(artifact.submitted_at), 'd MMM, yyyy')}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-8 text-center border border-dashed text-gray-400">
                    <Star className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No artifacts captured yet.</p>
                  </div>
                )}
              </section>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Micro Lessons (Parents) */}
                <section>
                  <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-gray-800">
                    <Zap className="h-5 w-5 text-[var(--fundi-pink)]" />
                    Micro Lessons for You
                  </h3>
                  <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <div className="divide-y relative">
                      {dashboardData.micro_lessons.map(lesson => (
                        <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-pink-50 flex items-center justify-center text-pink-500">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-900">{lesson.title}</p>
                              <p className="text-xs text-gray-500">{lesson.category} • {lesson.duration}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 text-[var(--fundi-pink)]">
                            Start
                          </Button>
                        </div>
                      ))}
                      {/* Overlay placeholder message */}
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                    </div>
                  </Card>
                </section>

                {/* Teachers & Contact */}
                <section>
                  <h3 className="flex items-center gap-2 font-bold text-lg mb-4 text-gray-800">
                    <MessageSquare className="h-5 w-5 text-[var(--fundi-red)]" />
                    Your Teachers
                  </h3>
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4 space-y-4">
                      {dashboardData.teachers.map(teacher => (
                        <div key={teacher.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              <UserIcon className="h-6 w-6 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-900">{teacher.name}</p>
                              <p className="text-xs text-gray-500">{teacher.role}</p>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" className="text-[var(--fundi-red)] bg-red-50 hover:bg-red-100 rounded-full h-8 w-8">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="pt-2 text-center">
                        <p className="text-xs text-gray-400 italic">Chat functionality coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* Activity Details Dialog */}
        <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[var(--fundi-orange)]/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-[var(--fundi-orange)]" />
                </div>
                <div className="flex flex-col text-left">
                  <DialogTitle>{selectedActivity?.title}</DialogTitle>
                  <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">
                    {selectedActivity?.type}
                  </span>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-semibold block text-gray-700">Date & Time</span>
                  <p className="text-gray-600">
                    {selectedActivity && format(new Date(selectedActivity.date), 'EEEE, MMMM do, yyyy')}
                  </p>
                  <p className="text-gray-600">
                    {selectedActivity?.time.substring(0, 5)}
                    {selectedActivity?.end_time && ` - ${selectedActivity?.end_time.substring(0, 5)}`}
                  </p>
                </div>
              </div>

              {selectedActivity?.location && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-gray-700">Location</span>
                    <p className="text-gray-600">{selectedActivity.location}</p>
                  </div>
                </div>
              )}

              {selectedActivity?.description && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 border">
                  {selectedActivity.description}
                </div>
              )}
            </div>
            <DialogFooter className="sm:justify-start">
              <Button type="button" variant="secondary" onClick={() => setIsActivityDialogOpen(false)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Helper icons
const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MapPin = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);

export default ParentPortal;
