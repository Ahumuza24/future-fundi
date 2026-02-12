import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { teacherApi, courseApi } from "@/lib/api";
import {
    Users, Search, Award, BookOpen, Eye, UserPlus,
    Medal, GraduationCap, TrendingUp, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
}

export default function TeacherClasses() {
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
    const [isBadgeDialogOpen, setIsBadgeDialogOpen] = useState(false);
    const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Enroll form state
    const [enrollForm, setEnrollForm] = useState({
        learner_id: "",
        course_id: "",
    });

    // Badge form state
    const [badgeForm, setBadgeForm] = useState({
        badge_name: "",
        description: "",
    });

    // Credential form state
    const [credentialForm, setCredentialForm] = useState({
        name: "",
        issuer: "Future Fundi Academy",
    });

    useEffect(() => {
        fetchData();
    }, [selectedCourse]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = selectedCourse ? { course_id: selectedCourse } : {};
            const response = await teacherApi.students.getAll(params);

            setStudents(response.data.students || []);
            setCourses(response.data.courses || []);
        } catch (error) {
            console.error("Failed to fetch students:", error);
            showMessage('error', 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAwardBadge = async () => {
        if (!selectedStudent) return;

        try {
            await teacherApi.badges.award({
                learner: selectedStudent.id,
                badge_name: badgeForm.badge_name,
                description: badgeForm.description,
            });

            showMessage('success', 'Badge awarded successfully!');
            setIsBadgeDialogOpen(false);
            setBadgeForm({ badge_name: "", description: "" });
            fetchData();
        } catch (error: any) {
            showMessage('error', error.response?.data?.detail || 'Failed to award badge');
        }
    };

    const handleAwardCredential = async () => {
        if (!selectedStudent) return;

        try {
            await teacherApi.credentials.award({
                learner: selectedStudent.id,
                name: credentialForm.name,
                issuer: credentialForm.issuer,
            });

            showMessage('success', 'Credential awarded successfully!');
            setIsCredentialDialogOpen(false);
            setCredentialForm({ name: "", issuer: "Future Fundi Academy" });
            fetchData();
        } catch (error: any) {
            showMessage('error', error.response?.data?.detail || 'Failed to award credential');
        }
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
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
                            My Students
                        </h1>
                        <p className="text-gray-600">Manage students and track their progress</p>
                    </div>
                </div>

                {/* Message Banner */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`p-4 rounded-lg border ${message.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {message.type === 'success' ? (
                                    <GraduationCap className="h-5 w-5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5" />
                                )}
                                <span className="font-medium">{message.text}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-cyan)" }}>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription>Total Students</CardDescription>
                            <CardTitle className="text-2xl">{students.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-lime)" }}>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription>Good Attendance</CardDescription>
                            <CardTitle className="text-2xl">
                                {students.filter(s => s.attendance_rate >= 90).length}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-orange)" }}>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription>Total Badges</CardDescription>
                            <CardTitle className="text-2xl">
                                {students.reduce((sum, s) => sum + s.badges_count, 0)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription>Credentials</CardDescription>
                            <CardTitle className="text-2xl">
                                {students.reduce((sum, s) => sum + s.credentials_count, 0)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Search students by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-cyan)]"
                        >
                            <option value="">All Courses</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                        <Button
                            onClick={() => setIsAddDialogOpen(true)}
                            style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                            className="flex items-center gap-2"
                        >
                            <UserPlus className="h-4 w-4" />
                            <span className="hidden md:inline">Add Student</span>
                        </Button>
                    </div>
                </div>

                {/* Student List */}
                <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-semibold text-sm text-gray-600">
                        <div className="col-span-4">Student</div>
                        <div className="col-span-2 text-center">Class</div>
                        <div className="col-span-2 text-center">Attendance</div>
                        <div className="col-span-1 text-center">Badges</div>
                        <div className="col-span-3 text-center">Actions</div>
                    </div>

                    {filteredStudents.map((student, index) => (
                        <motion.div
                            key={student.id}
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
                                    {student.first_name[0]}{student.last_name[0]}
                                </div>
                                <div>
                                    <p className="font-medium">{student.full_name}</p>
                                    <p className="text-xs text-gray-500">{student.user_email}</p>
                                </div>
                            </div>
                            <div className="col-span-2 text-center">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    {student.current_class || "—"}
                                </span>
                            </div>
                            <div className="col-span-2 text-center">
                                <span
                                    className="font-bold"
                                    style={{ color: getAttendanceColor(student.attendance_rate) }}
                                >
                                    {student.attendance_rate}%
                                </span>
                            </div>
                            <div className="col-span-1 text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <Medal className="h-4 w-4 text-yellow-500" />
                                    <span className="font-semibold">{student.badges_count}</span>
                                </div>
                            </div>
                            <div className="col-span-3 flex items-center justify-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/teacher/student/${student.id}`)}
                                    title="View Details"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedStudent(student);
                                        setIsBadgeDialogOpen(true);
                                    }}
                                    title="Award Badge"
                                    style={{ color: "var(--fundi-orange)" }}
                                >
                                    <Award className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedStudent(student);
                                        setIsCredentialDialogOpen(true);
                                    }}
                                    title="Award Credential"
                                    style={{ color: "var(--fundi-purple)" }}
                                >
                                    <GraduationCap className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}

                    {filteredStudents.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No students found matching "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Award Badge Dialog */}
            <Dialog open={isBadgeDialogOpen} onOpenChange={setIsBadgeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" style={{ color: "var(--fundi-orange)" }} />
                            Award Badge
                        </DialogTitle>
                        <DialogDescription>
                            Award a badge to {selectedStudent?.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="badge_name">Badge Name *</Label>
                            <Input
                                id="badge_name"
                                value={badgeForm.badge_name}
                                onChange={(e) => setBadgeForm({ ...badgeForm, badge_name: e.target.value })}
                                placeholder="e.g., Robotics Master"
                            />
                        </div>
                        <div>
                            <Label htmlFor="badge_description">Description</Label>
                            <Input
                                id="badge_description"
                                value={badgeForm.description}
                                onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                                placeholder="What did they achieve?"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBadgeDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAwardBadge}
                            disabled={!badgeForm.badge_name}
                            style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}
                        >
                            Award Badge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Award Credential Dialog */}
            <Dialog open={isCredentialDialogOpen} onOpenChange={setIsCredentialDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" style={{ color: "var(--fundi-purple)" }} />
                            Award Microcredential
                        </DialogTitle>
                        <DialogDescription>
                            Award a microcredential to {selectedStudent?.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="credential_name">Credential Name *</Label>
                            <Input
                                id="credential_name"
                                value={credentialForm.name}
                                onChange={(e) => setCredentialForm({ ...credentialForm, name: e.target.value })}
                                placeholder="e.g., Robotics Level 1 Completion"
                            />
                        </div>
                        <div>
                            <Label htmlFor="credential_issuer">Issuer</Label>
                            <Input
                                id="credential_issuer"
                                value={credentialForm.issuer}
                                onChange={(e) => setCredentialForm({ ...credentialForm, issuer: e.target.value })}
                                placeholder="Future Fundi Academy"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCredentialDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAwardCredential}
                            disabled={!credentialForm.name}
                            style={{ backgroundColor: "var(--fundi-purple)", color: "white" }}
                        >
                            Award Credential
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AddStudentDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSuccess={() => {
                    fetchData();
                    showMessage('success', 'Student added successfully');
                }}
                courses={courses}
            />
        </div>
    );
}
