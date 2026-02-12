import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    Users, GraduationCap, Award, TrendingUp, BookOpen,
    UserPlus, School, BarChart3, Medal, FileText, Map, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { schoolApi } from "@/lib/api";

interface DashboardStats {
    total_students: number;
    total_badges: number;
    total_artifacts: number;
    active_enrollments: number;
    average_progress: number;
}

interface Pathway {
    id: string;
    name: string;
    description: string;
    careers: { id: string; title: string }[];
    level_count: number;
    levels: { id: string; name: string; description: string; level_number: number }[];
}

export default function SchoolDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        total_students: 0,

        total_badges: 0,
        total_artifacts: 0,
        active_enrollments: 0,
        average_progress: 0
    });
    const [pathways, setPathways] = useState<Pathway[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPathway, setSelectedPathway] = useState<Pathway | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Stats
                const statsResponse = await schoolApi.stats();
                if (statsResponse.data && statsResponse.data.overview) {
                    const overview = statsResponse.data.overview;
                    const performance = statsResponse.data.performance || {};

                    setStats({
                        total_students: overview.total_students || 0,

                        total_badges: performance.total_badges_awarded || 0,
                        total_artifacts: performance.total_artifacts_submitted || 0,
                        active_enrollments: overview.active_students || 0,
                        average_progress: performance.average_completion_rate || 0
                    });
                }

                // Fetch Pathways
                const pathwaysResponse = await schoolApi.pathways.getAll();
                const pData = Array.isArray(pathwaysResponse.data)
                    ? pathwaysResponse.data
                    : (pathwaysResponse.data.results || []);
                setPathways(pData);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
            title: "View Pathways",
            description: "Browse available courses",
            icon: Map,
            color: "var(--fundi-lime)",
            onClick: () => {
                document.getElementById('pathways-section')?.scrollIntoView({ behavior: 'smooth' });
            }
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
                        <p className="text-gray-600">Manage your school's students and track progress</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                {/* Pathways Section */}
                <Card id="pathways-section">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Map className="h-5 w-5" style={{ color: "var(--fundi-lime)" }} />
                            Pathways & Microcredentials
                        </CardTitle>
                        <CardDescription>Available learning tracks and career paths from your curriculum</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pathways.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No pathways found. Contact support to configure your curriculum.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pathways.map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => setSelectedPathway(p)}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-[var(--fundi-purple)] transition-all cursor-pointer hover:shadow-md"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-gray-800">{p.name}</h3>
                                            <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                                {p.level_count} Levels
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{p.description}</p>

                                        <div>
                                            <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Career Paths</p>
                                            <div className="flex flex-wrap gap-2">
                                                {p.careers && p.careers.length > 0 ? (
                                                    p.careers.slice(0, 3).map((c) => (
                                                        <span key={c.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                            {c.title}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs italic text-gray-400">Can work on any career</span>
                                                )}
                                                {p.careers && p.careers.length > 3 && (
                                                    <span className="text-xs text-gray-400">+{p.careers.length - 3} more</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pathway Details Dialog */}
                <Dialog open={!!selectedPathway} onOpenChange={(open) => !open && setSelectedPathway(null)}>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Map className="h-6 w-6 text-[var(--fundi-purple)]" />
                                {selectedPathway?.name}
                            </DialogTitle>
                            <DialogDescription className="text-base text-gray-600">
                                {selectedPathway?.description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Careers */}
                            <div>
                                <h4 className="text-sm font-semibold uppercase text-gray-500 mb-3 flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Career Opportunities
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPathway?.careers && selectedPathway.careers.length > 0 ? (
                                        selectedPathway.careers.map((c) => (
                                            <div key={c.id} className="bg-blue-50 text-blue-800 px-3 py-1.5 rounded-md text-sm border border-blue-100">
                                                {c.title}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No specific careers listed.</p>
                                    )}
                                </div>
                            </div>

                            {/* Levels / Microcredentials */}
                            <div>
                                <h4 className="text-sm font-semibold uppercase text-gray-500 mb-3 flex items-center gap-2">
                                    <Medal className="h-4 w-4" />
                                    Microcredentials & Levels
                                </h4>
                                <div className="space-y-3">
                                    {selectedPathway?.levels && selectedPathway.levels.length > 0 ? (
                                        selectedPathway.levels.sort((a, b) => a.level_number - b.level_number).map((lvl) => (
                                            <div key={lvl.id} className="border rounded-lg p-3 bg-gray-50">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h5 className="font-semibold text-gray-900">Level {lvl.level_number}: {lvl.name}</h5>
                                                    <CheckCircle2 className="h-4 w-4 text-green-500 opacity-0" />
                                                </div>
                                                <p className="text-sm text-gray-600">{lvl.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No levels defined yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button onClick={() => setSelectedPathway(null)}>Close</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
