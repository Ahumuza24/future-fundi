import { useState, useEffect } from "react";
import { schoolApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    BarChart3, ArrowLeft, Users, Award, TrendingUp, BookOpen, Target, Calendar
} from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsData {
    overview: {
        total_students: number;
        active_students: number;
        total_teachers: number;
        total_courses: number;
    };
    performance: {
        average_completion_rate: number;
        average_assessment_score: number;
        total_badges_awarded: number;
        total_artifacts_submitted: number;
    };
    trends: {
        enrollments_this_month: number;
        badges_this_month: number;
        completion_this_month: number;
    };
    topPerformers: Array<{
        student_name: string;
        completion_rate: number;
        badges_count: number;
    }>;
    courseStats: Array<{
        course_name: string;
        enrolled_students: number;
        completion_rate: number;
    }>;
}

export default function SchoolAnalytics() {
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await schoolApi.analytics.get();
            setAnalytics(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-purple)] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Failed to load analytics data</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/school")}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            Analytics Dashboard
                        </h1>
                        <p className="text-gray-600">School-wide performance metrics and insights</p>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: "Total Students", value: analytics.overview.total_students, icon: Users, color: "var(--fundi-purple)", bg: "bg-purple-50" },
                        { title: "Active Students", value: analytics.overview.active_students, icon: TrendingUp, color: "var(--fundi-lime)", bg: "bg-lime-50" },
                        { title: "Teachers", value: analytics.overview.total_teachers, icon: Users, color: "var(--fundi-cyan)", bg: "bg-cyan-50" },
                        { title: "Courses", value: analytics.overview.total_courses, icon: BookOpen, color: "var(--fundi-orange)", bg: "bg-orange-50" }
                    ].map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Card className={`${stat.bg} border-2`}>
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

                {/* Performance Metrics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" style={{ color: "var(--fundi-purple)" }} />
                            Performance Metrics
                        </CardTitle>
                        <CardDescription>Overall school performance indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Avg Completion Rate</p>
                                <p className="text-3xl font-bold" style={{ color: "var(--fundi-cyan)" }}>
                                    {analytics.performance.average_completion_rate}%
                                </p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Avg Assessment Score</p>
                                <p className="text-3xl font-bold" style={{ color: "var(--fundi-purple)" }}>
                                    {analytics.performance.average_assessment_score}%
                                </p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Badges Awarded</p>
                                <p className="text-3xl font-bold" style={{ color: "var(--fundi-orange)" }}>
                                    {analytics.performance.total_badges_awarded}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-lime-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Artifacts Submitted</p>
                                <p className="text-3xl font-bold" style={{ color: "var(--fundi-lime)" }}>
                                    {analytics.performance.total_artifacts_submitted}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" style={{ color: "var(--fundi-pink)" }} />
                            This Month's Activity
                        </CardTitle>
                        <CardDescription>Recent trends and activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-pink-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">New Enrollments</p>
                                <p className="text-3xl font-bold" style={{ color: "var(--fundi-pink)" }}>
                                    {analytics.trends.enrollments_this_month}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Badges Awarded</p>
                                <p className="text-3xl font-bold" style={{ color: "var(--fundi-orange)" }}>
                                    {analytics.trends.badges_this_month}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-lime-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Courses Completed</p>
                                <p className="text-3xl font-bold" style={{ color: "var(--fundi-lime)" }}>
                                    {analytics.trends.completion_this_month}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Top Performers */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" style={{ color: "var(--fundi-orange)" }} />
                                Top Performers
                            </CardTitle>
                            <CardDescription>Students with highest completion rates</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.topPerformers.map((student, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                                                style={{ backgroundColor: "var(--fundi-purple)" }}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{student.student_name}</p>
                                                <p className="text-sm text-gray-600">{student.badges_count} badges</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold" style={{ color: "var(--fundi-lime)" }}>
                                                {student.completion_rate}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Course Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                                Course Statistics
                            </CardTitle>
                            <CardDescription>Enrollment and completion by course</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.courseStats.map((course, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-sm">{course.course_name}</p>
                                            <p className="text-sm text-gray-600">{course.enrolled_students} students</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full"
                                                    style={{
                                                        width: `${course.completion_rate}%`,
                                                        backgroundColor: "var(--fundi-cyan)"
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold" style={{ color: "var(--fundi-cyan)" }}>
                                                {course.completion_rate}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
