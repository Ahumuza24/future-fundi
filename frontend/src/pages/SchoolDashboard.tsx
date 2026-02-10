import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users, GraduationCap, Award, TrendingUp, BookOpen,
    UserPlus, School, BarChart3, Medal, FileText
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardStats {
    total_students: number;
    total_teachers: number;
    total_badges: number;
    total_artifacts: number;
    active_enrollments: number;
    average_progress: number;
}

export default function SchoolDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        total_students: 0,
        total_teachers: 0,
        total_badges: 0,
        total_artifacts: 0,
        active_enrollments: 0,
        average_progress: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual API call
            // const response = await schoolApi.getDashboard();
            // setStats(response.data);

            // Mock data for now
            setTimeout(() => {
                setStats({
                    total_students: 156,
                    total_teachers: 12,
                    total_badges: 342,
                    total_artifacts: 489,
                    active_enrollments: 234,
                    average_progress: 68
                });
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: "Total Students",
            value: stats.total_students,
            icon: Users,
            color: "var(--fundi-purple)",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-200",
            link: "/school/students"
        },
        {
            title: "Total Teachers",
            value: stats.total_teachers,
            icon: GraduationCap,
            color: "var(--fundi-cyan)",
            bgColor: "bg-cyan-50",
            borderColor: "border-cyan-200",
            link: "/school/teachers"
        },
        {
            title: "Badges Awarded",
            value: stats.total_badges,
            icon: Award,
            color: "var(--fundi-orange)",
            bgColor: "bg-orange-50",
            borderColor: "border-orange-200",
            link: "/school/badges"
        },
        {
            title: "Artifacts Submitted",
            value: stats.total_artifacts,
            icon: FileText,
            color: "var(--fundi-lime)",
            bgColor: "bg-lime-50",
            borderColor: "border-lime-200",
            link: "/school/badges"
        },
        {
            title: "Active Enrollments",
            value: stats.active_enrollments,
            icon: BookOpen,
            color: "var(--fundi-pink)",
            bgColor: "bg-pink-50",
            borderColor: "border-pink-200",
            link: "/school/progress"
        },
        {
            title: "Average Progress",
            value: `${stats.average_progress}%`,
            icon: TrendingUp,
            color: "var(--fundi-purple)",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-200",
            link: "/school/analytics"
        }
    ];

    const quickActions = [
        {
            title: "Add Student",
            description: "Register a new student",
            icon: UserPlus,
            color: "var(--fundi-purple)",
            onClick: () => navigate("/school/students?action=add")
        },
        {
            title: "Add Teacher",
            description: "Add a new teacher",
            icon: GraduationCap,
            color: "var(--fundi-cyan)",
            onClick: () => navigate("/school/teachers?action=add")
        },
        {
            title: "View Microcredentials",
            description: "Browse available courses",
            icon: BookOpen,
            color: "var(--fundi-lime)",
            onClick: () => navigate("/school/pathways")
        },
        {
            title: "Analytics",
            description: "View detailed reports",
            icon: BarChart3,
            color: "var(--fundi-orange)",
            onClick: () => navigate("/school/analytics")
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-purple)] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <School className="h-10 w-10" style={{ color: "var(--fundi-purple)" }} />
                    <div>
                        <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            School Dashboard
                        </h1>
                        <p className="text-gray-600">Manage your school's students, teachers, and track progress</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Card
                                    className={`${stat.bgColor} border-2 ${stat.borderColor} cursor-pointer hover:shadow-lg transition-shadow`}
                                    onClick={() => navigate(stat.link)}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                                <p className="text-3xl font-bold mt-2" style={{ color: stat.color }}>
                                                    {stat.value}
                                                </p>
                                            </div>
                                            <Icon className="h-12 w-12" style={{ color: stat.color }} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Medal className="h-5 w-5" style={{ color: "var(--fundi-purple)" }} />
                            Quick Actions
                        </CardTitle>
                        <CardDescription>Common tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {quickActions.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <motion.div
                                        key={action.title}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full h-auto p-6 flex flex-col items-center gap-3 hover:shadow-md transition-shadow"
                                            onClick={action.onClick}
                                        >
                                            <Icon className="h-8 w-8" style={{ color: action.color }} />
                                            <div className="text-center">
                                                <p className="font-semibold">{action.title}</p>
                                                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                                            </div>
                                        </Button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity Placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" style={{ color: "var(--fundi-lime)" }} />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Latest updates from your school</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-gray-500">
                            <p>Recent activity will appear here</p>
                            <p className="text-sm mt-2">Student enrollments, badge awards, and more</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
