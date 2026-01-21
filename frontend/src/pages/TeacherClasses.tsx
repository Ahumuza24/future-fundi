import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { teacherApi } from "@/lib/api";
import {
    Users, Search, Filter, ChevronRight, User,
    BookOpen, CheckCircle, Clock, AlertTriangle,
    Eye, MoreHorizontal
} from "lucide-react";
import { motion } from "framer-motion";

interface Learner {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    age?: number;
    current_level?: string;
    attendance_rate?: number;
    last_session?: string;
    pending_artifacts?: number;
    avatar_url?: string;
}

interface ClassGroup {
    id: string;
    name: string;
    learner_count: number;
    schedule?: string;
    next_session?: string;
    learners: Learner[];
}

export default function TeacherClasses() {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [allLearners, setAllLearners] = useState<Learner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"classes" | "learners">("classes");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch sessions to get class/learner info
            const sessionsResponse = await teacherApi.getSessions();
            const sessions = sessionsResponse.data.results || sessionsResponse.data || [];

            // Group sessions into classes and extract learners
            const classMap = new Map<string, ClassGroup>();
            const learnerMap = new Map<string, Learner>();

            sessions.forEach((session: any) => {
                const className = session.module_name || "General Class";
                if (!classMap.has(className)) {
                    classMap.set(className, {
                        id: session.module || className,
                        name: className,
                        learner_count: 0,
                        schedule: session.start_time ? `${session.date} ${session.start_time}` : session.date,
                        next_session: session.date,
                        learners: []
                    });
                }

                // Add learners from session
                if (session.learners) {
                    session.learners.forEach((learner: any) => {
                        if (!learnerMap.has(learner.id)) {
                            learnerMap.set(learner.id, {
                                id: learner.id,
                                first_name: learner.first_name,
                                last_name: learner.last_name,
                                full_name: learner.full_name || `${learner.first_name} ${learner.last_name}`,
                                age: learner.age,
                                current_level: "Level 1",
                                attendance_rate: Math.floor(Math.random() * 30) + 70, // Demo
                                last_session: session.date,
                                pending_artifacts: Math.floor(Math.random() * 3),
                            });
                        }
                    });
                }
            });

            // If no real data, generate demo data
            if (classMap.size === 0) {
                classMap.set("Robotics Beginners", {
                    id: "1",
                    name: "Robotics Beginners",
                    learner_count: 12,
                    schedule: "Mon & Wed, 2:00 PM",
                    next_session: "Today, 2:00 PM",
                    learners: []
                });
                classMap.set("Coding Foundations", {
                    id: "2",
                    name: "Coding Foundations",
                    learner_count: 8,
                    schedule: "Tue & Thu, 3:30 PM",
                    next_session: "Tomorrow, 3:30 PM",
                    learners: []
                });
            }

            if (learnerMap.size === 0) {
                // Demo learners
                const demoLearners = [
                    { id: "1", first_name: "Alex", last_name: "Kato", age: 10, attendance_rate: 95 },
                    { id: "2", first_name: "Bella", last_name: "Nakato", age: 11, attendance_rate: 88 },
                    { id: "3", first_name: "Charles", last_name: "Mugisha", age: 9, attendance_rate: 92 },
                    { id: "4", first_name: "Diana", last_name: "Asiimwe", age: 12, attendance_rate: 78 },
                    { id: "5", first_name: "Emmanuel", last_name: "Okello", age: 10, attendance_rate: 100 },
                    { id: "6", first_name: "Faith", last_name: "Nambi", age: 11, attendance_rate: 85 },
                ];
                demoLearners.forEach(l => {
                    learnerMap.set(l.id, {
                        ...l,
                        full_name: `${l.first_name} ${l.last_name}`,
                        current_level: "Level 1",
                        last_session: "Yesterday",
                        pending_artifacts: Math.floor(Math.random() * 3),
                    });
                });
            }

            setClasses(Array.from(classMap.values()));
            setAllLearners(Array.from(learnerMap.values()));
        } catch (error) {
            console.error("Failed to fetch classes:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLearners = allLearners.filter(l =>
        l.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getAttendanceColor = (rate: number) => {
        if (rate >= 90) return "var(--fundi-lime)";
        if (rate >= 70) return "var(--fundi-orange)";
        return "var(--fundi-pink)";
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-gray-200 rounded w-1/3" />
                        <div className="grid md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-40 bg-gray-200 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            Classes & Learners
                        </h1>
                        <p className="text-gray-600">Manage your classes and track learner progress</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === "classes" ? "default" : "outline"}
                            onClick={() => setViewMode("classes")}
                            className={viewMode === "classes" ? "bg-[var(--fundi-cyan)] text-white" : ""}
                        >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Classes
                        </Button>
                        <Button
                            variant={viewMode === "learners" ? "default" : "outline"}
                            onClick={() => setViewMode("learners")}
                            className={viewMode === "learners" ? "bg-[var(--fundi-cyan)] text-white" : ""}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            All Learners
                        </Button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Search learners by name..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                    </Button>
                </div>

                {/* Classes View */}
                {viewMode === "classes" && (
                    <div className="grid md:grid-cols-2 gap-4">
                        {classes.map((cls, index) => (
                            <motion.div
                                key={cls.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card
                                    className="hover:shadow-lg transition-all cursor-pointer border-l-4"
                                    style={{ borderLeftColor: "var(--fundi-cyan)" }}
                                    onClick={() => {
                                        setSelectedClass(cls.id);
                                        setViewMode("learners");
                                    }}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl">{cls.name}</CardTitle>
                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <CardDescription>{cls.schedule}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-5 w-5 text-gray-500" />
                                                    <span className="font-bold">{cls.learner_count}</span>
                                                    <span className="text-gray-500">learners</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Next session</p>
                                                <p className="font-medium" style={{ color: "var(--fundi-cyan)" }}>{cls.next_session}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Learners View */}
                {viewMode === "learners" && (
                    <div className="space-y-4">
                        {/* Stats Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-cyan)" }}>
                                <CardHeader className="p-4 pb-2">
                                    <CardDescription>Total Learners</CardDescription>
                                    <CardTitle className="text-2xl">{allLearners.length}</CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-lime)" }}>
                                <CardHeader className="p-4 pb-2">
                                    <CardDescription>Good Attendance</CardDescription>
                                    <CardTitle className="text-2xl">{allLearners.filter(l => (l.attendance_rate || 0) >= 90).length}</CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-orange)" }}>
                                <CardHeader className="p-4 pb-2">
                                    <CardDescription>Needs Attention</CardDescription>
                                    <CardTitle className="text-2xl">{allLearners.filter(l => (l.attendance_rate || 0) < 80).length}</CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
                                <CardHeader className="p-4 pb-2">
                                    <CardDescription>Pending Artifacts</CardDescription>
                                    <CardTitle className="text-2xl">{allLearners.reduce((sum, l) => sum + (l.pending_artifacts || 0), 0)}</CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        {/* Learner List */}
                        <div className="bg-white rounded-xl border overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-semibold text-sm text-gray-600">
                                <div className="col-span-4">Learner</div>
                                <div className="col-span-2 text-center">Age</div>
                                <div className="col-span-2 text-center">Level</div>
                                <div className="col-span-2 text-center">Attendance</div>
                                <div className="col-span-2 text-center">Actions</div>
                            </div>

                            {filteredLearners.map((learner, index) => (
                                <motion.div
                                    key={learner.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 hover:bg-gray-50 items-center"
                                >
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                            style={{ backgroundColor: "var(--fundi-cyan)" }}
                                        >
                                            {learner.first_name[0]}{learner.last_name[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium">{learner.full_name}</p>
                                            <p className="text-xs text-gray-500">Last: {learner.last_session || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-center">{learner.age || "—"} yrs</div>
                                    <div className="col-span-2 text-center">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                            {learner.current_level || "Level 1"}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span
                                            className="font-bold"
                                            style={{ color: getAttendanceColor(learner.attendance_rate || 0) }}
                                        >
                                            {learner.attendance_rate || 0}%
                                        </span>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigate(`/teacher/learner/${learner.id}`)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}

                            {filteredLearners.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>No learners found matching "{searchTerm}"</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Attendance Button */}
                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Quick Attendance</h3>
                                    <p className="opacity-90">Mark attendance for today's current session</p>
                                </div>
                                <Button
                                    className="bg-white text-purple-600 hover:bg-gray-100"
                                    onClick={() => navigate("/teacher/attendance")}
                                >
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Mark Now
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
