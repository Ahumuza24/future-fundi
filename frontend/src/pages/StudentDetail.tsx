import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { teacherApi } from "@/lib/api";
import {
    ArrowLeft, Award, GraduationCap, BookOpen, TrendingUp,
    Calendar, Mail, School, Medal, CheckCircle, Clock
} from "lucide-react";
import { motion } from "framer-motion";

interface StudentDetail {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    user_email: string;
    current_school: string;
    current_class: string;
    badges_count: number;
    credentials_count: number;
    attendance_rate: number;
}

interface BadgeItem {
    id: string;
    badge_name: string;
    description: string;
    awarded_by_name: string;
    awarded_at: string;
    module_name?: string;
}

interface CredentialItem {
    id: string;
    name: string;
    issuer: string;
    issued_at: string;
}

interface Enrollment {
    id: string;
    course_name: string;
    current_level_name: string;
    enrolled_at: string;
    is_active: boolean;
}

export default function StudentDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [student, setStudent] = useState<StudentDetail | null>(null);
    const [badges, setBadges] = useState<BadgeItem[]>([]);
    const [credentials, setCredentials] = useState<CredentialItem[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchStudentData();
        }
    }, [id]);

    const fetchStudentData = async () => {
        try {
            setLoading(true);
            const response = await teacherApi.students.getById(id!);

            setStudent(response.data.student);
            setBadges(response.data.badges || []);
            setCredentials(response.data.credentials || []);
            setEnrollments(response.data.enrollments || []);
        } catch (error) {
            console.error("Failed to fetch student data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getAttendanceColor = (rate: number) => {
        if (rate >= 90) return "var(--fundi-lime)";
        if (rate >= 70) return "var(--fundi-orange)";
        return "var(--fundi-pink)";
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-gray-200 rounded w-1/3" />
                        <div className="grid md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-40 bg-gray-200 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Student not found</p>
                    <Button onClick={() => navigate('/teacher/classes')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Students
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/teacher/classes')}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div className="flex-1">
                        <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            {student.full_name}
                        </h1>
                        <p className="text-gray-600">{student.user_email}</p>
                    </div>
                </div>

                {/* Student Info Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-cyan)" }}>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center gap-2 text-gray-600">
                                <School className="h-4 w-4" />
                                <CardDescription>Class</CardDescription>
                            </div>
                            <CardTitle className="text-xl">{student.current_class || "—"}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-lime)" }}>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center gap-2 text-gray-600">
                                <TrendingUp className="h-4 w-4" />
                                <CardDescription>Attendance</CardDescription>
                            </div>
                            <CardTitle
                                className="text-xl"
                                style={{ color: getAttendanceColor(student.attendance_rate) }}
                            >
                                {student.attendance_rate}%
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-orange)" }}>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Award className="h-4 w-4" />
                                <CardDescription>Badges</CardDescription>
                            </div>
                            <CardTitle className="text-xl">{student.badges_count}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center gap-2 text-gray-600">
                                <GraduationCap className="h-4 w-4" />
                                <CardDescription>Credentials</CardDescription>
                            </div>
                            <CardTitle className="text-xl">{student.credentials_count}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Enrollments */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                            Course Enrollments
                        </CardTitle>
                        <CardDescription>Active courses and progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {enrollments.length > 0 ? (
                            <div className="space-y-3">
                                {enrollments.map((enrollment, index) => (
                                    <motion.div
                                        key={enrollment.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between p-4 rounded-lg border bg-gray-50"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{enrollment.course_name}</h3>
                                            <p className="text-sm text-gray-600">
                                                Current Level: {enrollment.current_level_name || "Not Started"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1 ${enrollment.is_active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {enrollment.is_active ? "Active" : "Inactive"}
                                            </span>
                                            <p className="text-xs text-gray-500">
                                                Enrolled: {formatDate(enrollment.enrolled_at)}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No active enrollments</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Badges */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Medal className="h-5 w-5" style={{ color: "var(--fundi-orange)" }} />
                            Badges Earned
                        </CardTitle>
                        <CardDescription>Recognition and achievements</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {badges.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {badges.map((badge, index) => (
                                    <motion.div
                                        key={badge.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: "var(--fundi-orange)" }}
                                            >
                                                <Award className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-lg">{badge.badge_name}</h3>
                                                {badge.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                                                )}
                                                {badge.module_name && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Module: {badge.module_name}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(badge.awarded_at)}
                                                    <span>•</span>
                                                    <span>by {badge.awarded_by_name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Medal className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No badges earned yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Credentials */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" style={{ color: "var(--fundi-purple)" }} />
                            Microcredentials
                        </CardTitle>
                        <CardDescription>Completed certifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {credentials.length > 0 ? (
                            <div className="space-y-3">
                                {credentials.map((credential, index) => (
                                    <motion.div
                                        key={credential.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-4 p-4 rounded-lg border-2 border-purple-200 bg-purple-50"
                                    >
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: "var(--fundi-purple)" }}
                                        >
                                            <CheckCircle className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold">{credential.name}</h3>
                                            <p className="text-sm text-gray-600">Issued by: {credential.issuer}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(credential.issued_at)}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No credentials earned yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
