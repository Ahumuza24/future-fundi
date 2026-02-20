import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { teacherApi } from "@/lib/api";
import {
    Calendar,
    CheckCircle,
    Clock,
    Users,
    UserPlus,
    Camera,
    AlertCircle,
    Play,
    CheckCheck,
    GraduationCap,
    ListTodo,
    CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";

interface Session {
    id: string;
    module_name: string;
    date: string;
    start_time?: string;
    end_time?: string;
    status: string;
    attendance_marked: boolean;
    learner_count: number;
    attendance_count: number;
}

interface DashboardData {
    today: {
        date: string;
        sessions: Session[];
        total: number;
        completed: number;
        pending: number;
    };
    pending_tasks: {
        attendance_needed: number;
        artifacts_needed: number;
        total: number;
    };
    quick_stats: {
        sessions_this_week: number;
        sessions_this_month: number;
        sessions_this_month_completed: number;
        total_sessions: number;
        total_completed: number;
        week_start: string;
        week_end: string;
        month_start: string;
        month_end: string;
    };
}

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const response = await teacherApi.getDashboard();
            setDashboardData(response.data);
        } catch (err: any) {
            setError("Failed to load dashboard");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSession = async (sessionId: string) => {
        try {
            await teacherApi.startSession(sessionId);
            fetchDashboard();
        } catch (err: any) {
            console.error("Failed to start session:", err);
        }
    };

    const handleCompleteSession = async (sessionId: string) => {
        try {
            await teacherApi.completeSession(sessionId);
            fetchDashboard();
        } catch (err: any) {
            console.error("Failed to complete session:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-cyan)] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !dashboardData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={fetchDashboard} style={{ backgroundColor: "var(--fundi-cyan)" }}>
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 md:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header>
                    <h1 className="heading-font text-3xl md:text-4xl font-bold mb-2" style={{ color: "var(--fundi-black)" }}>
                        Teacher Dashboard
                    </h1>
                    <p className="text-gray-600">Welcome back! Here's what you need to do today.</p>
                </header>

                {/* Quick Stats — now 4 columns */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Today's Sessions */}
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-cyan)" }}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Today's Sessions</p>
                                    <p className="text-3xl font-bold" style={{ color: "var(--fundi-cyan)" }}>
                                        {dashboardData.today.total}
                                    </p>
                                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                                        <p>{dashboardData.today.completed} completed</p>
                                        {dashboardData.today.pending > 0 && (
                                            <p className="text-amber-500 font-medium">{dashboardData.today.pending} still pending</p>
                                        )}
                                    </div>
                                </div>
                                <Calendar className="h-12 w-12" style={{ color: "var(--fundi-cyan)", opacity: 0.2 }} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Tasks */}
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-orange)" }}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Pending Tasks</p>
                                    <p className="text-3xl font-bold" style={{ color: "var(--fundi-orange)" }}>
                                        {dashboardData.pending_tasks.total}
                                    </p>
                                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                                        <p>{dashboardData.pending_tasks.attendance_needed} attendance needed</p>
                                        {dashboardData.pending_tasks.artifacts_needed > 0 && (
                                            <p>{dashboardData.pending_tasks.artifacts_needed} artifacts needed</p>
                                        )}
                                    </div>
                                </div>
                                <AlertCircle className="h-12 w-12" style={{ color: "var(--fundi-orange)", opacity: 0.2 }} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* This Week */}
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-lime)" }}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">This Week</p>
                                    <p className="text-3xl font-bold" style={{ color: "var(--fundi-lime)" }}>
                                        {dashboardData.quick_stats.sessions_this_week}
                                    </p>
                                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                                        <p>sessions scheduled</p>
                                        <p>{dashboardData.quick_stats.total_completed ?? 0} completed all-time</p>
                                    </div>
                                </div>
                                <CheckCircle className="h-12 w-12" style={{ color: "var(--fundi-lime)", opacity: 0.2 }} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* This Month — new card */}
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">This Month</p>
                                    <p className="text-3xl font-bold" style={{ color: "var(--fundi-purple)" }}>
                                        {dashboardData.quick_stats.sessions_this_month ?? 0}
                                    </p>
                                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                                        <p>
                                            {dashboardData.quick_stats.sessions_this_month_completed ?? 0} completed
                                        </p>
                                        <p className="capitalize">
                                            {new Date().toLocaleString("default", { month: "long" })}
                                        </p>
                                    </div>
                                </div>
                                <CalendarDays className="h-12 w-12" style={{ color: "var(--fundi-purple)", opacity: 0.2 }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Today's Sessions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-6 w-6" style={{ color: "var(--fundi-cyan)" }} />
                            Today's Sessions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dashboardData.today.sessions.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600 text-lg">No sessions scheduled for today</p>
                                <p className="text-gray-500 text-sm mt-2">Enjoy your day off!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {dashboardData.today.sessions.map((session, index) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        <Card className="border-2 hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-lg mb-1">{session.module_name}</h3>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-4 w-4" />
                                                                {session.start_time || "Not started"}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Users className="h-4 w-4" />
                                                                {session.learner_count} learners
                                                            </span>
                                                            {session.attendance_marked && (
                                                                <span className="flex items-center gap-1 text-green-600">
                                                                    <CheckCircle className="h-4 w-4" />
                                                                    Attendance marked
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            onClick={() => navigate(`/teacher/attendance/${session.id}`)}
                                                            variant="outline"
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Users className="h-4 w-4" />
                                                            Attendance
                                                        </Button>

                                                        {session.status === "scheduled" && (
                                                            <Button
                                                                onClick={() => handleStartSession(session.id)}
                                                                style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Play className="h-4 w-4" />
                                                                Start
                                                            </Button>
                                                        )}
                                                        {session.status === "in_progress" && (
                                                            <Button
                                                                onClick={() => handleCompleteSession(session.id)}
                                                                style={{ backgroundColor: "var(--fundi-lime)", color: "white" }}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <CheckCheck className="h-4 w-4" />
                                                                Complete
                                                            </Button>
                                                        )}
                                                        {session.status === "completed" && (
                                                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                                                                Completed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Button
                                onClick={() => navigate("/teacher/sessions")}
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                            >
                                <CalendarDays className="h-8 w-8" />
                                <span className="font-semibold">My Sessions</span>
                            </Button>
                            <Button
                                onClick={() => navigate("/teacher/tasks")}
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                style={{ backgroundColor: "var(--fundi-purple)", color: "white" }}
                            >
                                <ListTodo className="h-8 w-8" />
                                <span className="font-semibold">My Tasks</span>
                            </Button>
                            <Button
                                onClick={() => navigate("/teacher/students")}
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
                            >
                                <UserPlus className="h-8 w-8" />
                                <span className="font-semibold">Add Student</span>
                            </Button>
                            <Button
                                onClick={() => navigate("/teacher/capture-artifact")}
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                style={{ backgroundColor: "var(--fundi-lime)", color: "white" }}
                            >
                                <Camera className="h-8 w-8" />
                                <span className="font-semibold">Capture Artifact</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Tasks Alert */}
                {dashboardData.pending_tasks.total > 0 && (
                    <Card className="border-2 border-orange-200 bg-orange-50">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-2 text-orange-900">Pending Tasks</h3>
                                    <ul className="space-y-1 text-orange-800">
                                        {dashboardData.pending_tasks.attendance_needed > 0 && (
                                            <li>• {dashboardData.pending_tasks.attendance_needed} sessions need attendance marking</li>
                                        )}
                                        {dashboardData.pending_tasks.artifacts_needed > 0 && (
                                            <li>• {dashboardData.pending_tasks.artifacts_needed} sessions need artifact capture</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
