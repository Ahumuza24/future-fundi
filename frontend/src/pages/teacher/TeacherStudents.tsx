import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { teacherApi, courseApi } from "@/lib/api";
import {
    Users,
    Search,
    UserPlus,
    Eye,
    GraduationCap,
    Award,
    TrendingUp,
    ArrowLeft,
    Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { AddStudentDialog } from "@/components/teacher/AddStudentDialog";

interface Student {
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

interface Course {
    id: string;
    name: string;
    description: string;
    level_count: number;
}

export default function TeacherStudents() {
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [enrolling, setEnrolling] = useState(false);

    // Add Student State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    // Add Student State

    const fetchData = async () => {
        try {
            setLoading(true);
            const [studentsRes, coursesRes] = await Promise.all([
                teacherApi.students.getAll(),
                courseApi.getAll(),
            ]);

            // Ensure we always have an array for students
            const studentsData = Array.isArray(studentsRes.data)
                ? studentsRes.data
                : (studentsRes.data?.results || []);

            const coursesData = Array.isArray(coursesRes.data)
                ? coursesRes.data
                : (coursesRes.data?.results || []);

            setStudents(studentsData);
            setCourses(coursesData);
        } catch (err) {
            console.error("Failed to fetch data:", err);
            // Set empty arrays on error to prevent filter errors
            setStudents([]);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);



    const handleEnroll = async () => {
        if (!selectedStudent || !selectedCourse) return;

        try {
            setEnrolling(true);
            await teacherApi.students.enroll({
                learner_id: selectedStudent.id,
                course_id: selectedCourse,
            });
            setIsEnrollDialogOpen(false);
            setSelectedStudent(null);
            setSelectedCourse("");
            // Optionally refresh data or show success message
        } catch (err) {
            console.error("Failed to enroll student:", err);
        } finally {
            setEnrolling(false);
        }
    };

    const filteredStudents = Array.isArray(students)
        ? students.filter((student) =>
            student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.current_class?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const getAttendanceColor = (rate: number) => {
        if (rate >= 90) return "text-green-600";
        if (rate >= 75) return "text-yellow-600";
        return "text-red-600";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: "var(--fundi-cyan)" }} />
                    <p className="text-gray-600">Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 md:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Button
                                variant="ghost"
                                onClick={() => navigate("/teacher")}
                                className="p-2"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: "var(--fundi-black)" }}>
                                My Students
                            </h1>
                        </div>
                        <p className="text-gray-600 ml-14">Manage your students and track their progress</p>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-cyan)" }}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Students</p>
                                    <p className="text-3xl font-bold" style={{ color: "var(--fundi-cyan)" }}>
                                        {students.length}
                                    </p>
                                </div>
                                <Users className="h-10 w-10" style={{ color: "var(--fundi-cyan)", opacity: 0.2 }} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Avg Attendance</p>
                                    <p className="text-3xl font-bold" style={{ color: "var(--fundi-purple)" }}>
                                        {students.length > 0
                                            ? Math.round(students.reduce((sum, s) => sum + s.attendance_rate, 0) / students.length)
                                            : 0}%
                                    </p>
                                </div>
                                <TrendingUp className="h-10 w-10" style={{ color: "var(--fundi-purple)", opacity: 0.2 }} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-orange)" }}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Badges</p>
                                    <p className="text-3xl font-bold" style={{ color: "var(--fundi-orange)" }}>
                                        {students.reduce((sum, s) => sum + s.badges_count, 0)}
                                    </p>
                                </div>
                                <Award className="h-10 w-10" style={{ color: "var(--fundi-orange)", opacity: 0.2 }} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-lime)" }}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Credentials</p>
                                    <p className="text-3xl font-bold" style={{ color: "var(--fundi-lime)" }}>
                                        {students.reduce((sum, s) => sum + s.credentials_count, 0)}
                                    </p>
                                </div>
                                <GraduationCap className="h-10 w-10" style={{ color: "var(--fundi-lime)", opacity: 0.2 }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Actions */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 relative w-full">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    placeholder="Search by name, email, or class..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                onClick={() => setIsAddDialogOpen(true)}
                                style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                                className="w-full md:w-auto flex items-center gap-2"
                            >
                                <UserPlus className="h-4 w-4" />
                                Add Student
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Students List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-6 w-6" style={{ color: "var(--fundi-cyan)" }} />
                            Students ({filteredStudents.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredStudents.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600 text-lg">No students found</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    {searchQuery ? "Try adjusting your search" : "Students will appear here"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredStudents.map((student, index) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <Card className="hover:shadow-lg transition-shadow border-2">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-lg mb-1">{student.full_name}</h3>
                                                        <p className="text-sm text-gray-600">{student.user_email}</p>
                                                        <p className="text-sm text-gray-500">{student.current_class}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                                                    <div className="bg-gray-50 rounded p-2">
                                                        <p className="text-xs text-gray-600">Attendance</p>
                                                        <p className={`font-bold ${getAttendanceColor(student.attendance_rate)}`}>
                                                            {student.attendance_rate}%
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded p-2">
                                                        <p className="text-xs text-gray-600">Badges</p>
                                                        <p className="font-bold" style={{ color: "var(--fundi-orange)" }}>
                                                            {student.badges_count}
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded p-2">
                                                        <p className="text-xs text-gray-600">Credentials</p>
                                                        <p className="font-bold" style={{ color: "var(--fundi-lime)" }}>
                                                            {student.credentials_count}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => navigate(`/teacher/students/${student.id}`)}
                                                        className="flex-1"
                                                        style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            setIsEnrollDialogOpen(true);
                                                        }}
                                                        variant="outline"
                                                    >
                                                        <UserPlus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Student Dialog */}
            <AddStudentDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSuccess={() => {
                    fetchData();
                }}
                courses={courses}
            />

            {/* Enroll Dialog (Existing) */}
            <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enroll Student in Course</DialogTitle>
                        <DialogDescription>
                            Enroll {selectedStudent?.full_name} in a new course
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="course">Select Course</Label>
                            <select
                                id="course"
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Choose a course...</option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.name} ({course.level_count} levels)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEnroll}
                            disabled={!selectedCourse || enrolling}
                            style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                        >
                            {enrolling ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enrolling...
                                </>
                            ) : (
                                "Enroll Student"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
