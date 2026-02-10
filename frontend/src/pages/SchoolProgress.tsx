import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    TrendingUp, Search, ArrowLeft, User, BookOpen, Award, Target
} from "lucide-react";
import { motion } from "framer-motion";

interface StudentProgress {
    id: string;
    student_name: string;
    student_email: string;
    course_name: string;
    current_level: string;
    completion_percentage: number;
    modules_completed: number;
    total_modules: number;
    artifacts_submitted: number;
    assessment_score: number;
    status: 'on_track' | 'needs_attention' | 'completed';
}

export default function SchoolProgress() {
    const navigate = useNavigate();
    const [progressData, setProgressData] = useState<StudentProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        fetchProgressData();
    }, []);

    const fetchProgressData = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual API call
            // const response = await schoolApi.progress.getAll();
            // setProgressData(response.data);

            // Mock data
            setTimeout(() => {
                setProgressData([
                    {
                        id: "1",
                        student_name: "John Doe",
                        student_email: "john.doe@school.com",
                        course_name: "Digital Literacy Fundamentals",
                        current_level: "Level 3",
                        completion_percentage: 65,
                        modules_completed: 8,
                        total_modules: 12,
                        artifacts_submitted: 5,
                        assessment_score: 78,
                        status: 'on_track'
                    },
                    {
                        id: "2",
                        student_name: "Jane Smith",
                        student_email: "jane.smith@school.com",
                        course_name: "Creative Problem Solving",
                        current_level: "Level 2",
                        completion_percentage: 45,
                        modules_completed: 4,
                        total_modules: 10,
                        artifacts_submitted: 2,
                        assessment_score: 62,
                        status: 'needs_attention'
                    },
                    {
                        id: "3",
                        student_name: "Mike Johnson",
                        student_email: "mike.j@school.com",
                        course_name: "Communication Excellence",
                        current_level: "Level 4",
                        completion_percentage: 100,
                        modules_completed: 8,
                        total_modules: 8,
                        artifacts_submitted: 6,
                        assessment_score: 95,
                        status: 'completed'
                    }
                ]);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error("Failed to fetch progress data:", error);
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'on_track':
                return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
            case 'needs_attention':
                return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
            case 'completed':
                return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
            default:
                return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'on_track':
                return 'On Track';
            case 'needs_attention':
                return 'Needs Attention';
            case 'completed':
                return 'Completed';
            default:
                return status;
        }
    };

    const filteredProgress = progressData.filter(item => {
        const matchesSearch = item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.course_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" || item.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-pink)] border-t-transparent rounded-full"></div>
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
                            Progress Tracking
                        </h1>
                        <p className="text-gray-600">Monitor student progress across all courses</p>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Search by student or course..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="on_track">On Track</SelectItem>
                                    <SelectItem value="needs_attention">Needs Attention</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Progress List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" style={{ color: "var(--fundi-pink)" }} />
                            Student Progress ({filteredProgress.length})
                        </CardTitle>
                        <CardDescription>Track student performance and completion</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredProgress.length === 0 ? (
                            <div className="text-center py-12">
                                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600 text-lg font-semibold mb-2">No Progress Data Found</p>
                                <p className="text-gray-500 text-sm">
                                    {searchTerm || filterStatus !== "all" ? "Try adjusting your filters" : "No progress data available"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredProgress.map((item, index) => {
                                    const statusColors = getStatusColor(item.status);
                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                        >
                                            <Card className="border-2 hover:shadow-md transition-shadow">
                                                <CardContent className="p-6">
                                                    <div className="space-y-4">
                                                        {/* Header */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                                                                    style={{ backgroundColor: "var(--fundi-purple)" }}>
                                                                    {item.student_name.split(' ').map(n => n[0]).join('')}
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold">{item.student_name}</h3>
                                                                    <p className="text-sm text-gray-600">{item.student_email}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text} ${statusColors.border} border`}>
                                                                {getStatusLabel(item.status)}
                                                            </div>
                                                        </div>

                                                        {/* Course Info */}
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <BookOpen className="h-4 w-4 text-gray-500" />
                                                            <span className="font-medium">{item.course_name}</span>
                                                            <span className="text-gray-500">•</span>
                                                            <span className="text-gray-600">{item.current_level}</span>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-600">Overall Progress</span>
                                                                <span className="font-bold" style={{ color: "var(--fundi-pink)" }}>
                                                                    {item.completion_percentage}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="h-2 rounded-full transition-all"
                                                                    style={{
                                                                        width: `${item.completion_percentage}%`,
                                                                        backgroundColor: "var(--fundi-pink)"
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Stats Grid */}
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                                <p className="text-xs text-gray-600 mb-1">Modules</p>
                                                                <p className="font-bold" style={{ color: "var(--fundi-purple)" }}>
                                                                    {item.modules_completed}/{item.total_modules}
                                                                </p>
                                                            </div>
                                                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                                <p className="text-xs text-gray-600 mb-1">Artifacts</p>
                                                                <p className="font-bold" style={{ color: "var(--fundi-orange)" }}>
                                                                    {item.artifacts_submitted}
                                                                </p>
                                                            </div>
                                                            <div className="text-center p-3 bg-cyan-50 rounded-lg">
                                                                <p className="text-xs text-gray-600 mb-1">Score</p>
                                                                <p className="font-bold" style={{ color: "var(--fundi-cyan)" }}>
                                                                    {item.assessment_score}%
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Action Button */}
                                                        <Button
                                                            variant="outline"
                                                            className="w-full"
                                                            onClick={() => navigate(`/school/students/${item.id}`)}
                                                        >
                                                            <User className="h-4 w-4 mr-2" />
                                                            View Student Details
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
