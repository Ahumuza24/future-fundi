import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { teacherApi } from "@/lib/api";
import {
    Users,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    ArrowLeft,
    Save,
    Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    current_class: string;
}

interface AttendanceRecord {
    learner_id: string;
    status: "present" | "absent" | "late" | "excused";
    notes: string;
}

export default function MarkAttendance() {
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            console.log("Fetching students for attendance...");
            const response = await teacherApi.students.getAll();
            console.log("Students API response:", response);
            console.log("Response.data structure:", response.data);

            // The API returns { students: [...], courses: [...] }
            // Same as TeacherClasses.tsx uses
            const studentsData = response.data.students || [];

            console.log("Extracted students:", studentsData);
            console.log("Number of students:", studentsData.length);

            if (studentsData.length === 0) {
                console.warn("⚠️ No students found. This usually means:");
                console.warn("1. No students are assigned to this teacher account");
                console.warn("2. The teacher needs to be assigned students in the admin panel");
                console.warn("3. Check the backend: /api/teacher/students/ endpoint");
            }

            setStudents(studentsData);

            // Initialize all as present
            const initialAttendance: Record<string, AttendanceRecord> = {};
            studentsData.forEach((student: Student) => {
                initialAttendance[student.id] = {
                    learner_id: student.id,
                    status: "present",
                    notes: "",
                };
            });
            setAttendance(initialAttendance);
        } catch (err: any) {
            console.error("Failed to fetch students:", err);
            console.error("Error details:", err.response?.data || err.message);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const updateAttendance = (studentId: string, status: AttendanceRecord["status"]) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                status,
            },
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const attendanceArray = Object.values(attendance);
            // TODO: Call API to save attendance
            console.log("Saving attendance for date:", selectedDate, attendanceArray);
            // await teacherApi.markAttendance(selectedDate, attendanceArray);
            navigate("/teacher");
        } catch (err) {
            console.error("Failed to save attendance:", err);
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "present":
                return "var(--fundi-lime)";
            case "absent":
                return "var(--fundi-red)";
            case "late":
                return "var(--fundi-orange)";
            case "excused":
                return "var(--fundi-purple)";
            default:
                return "var(--fundi-cyan)";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "present":
                return CheckCircle;
            case "absent":
                return XCircle;
            case "late":
                return Clock;
            case "excused":
                return AlertCircle;
            default:
                return Users;
        }
    };

    const stats = {
        present: Object.values(attendance).filter(a => a.status === "present").length,
        absent: Object.values(attendance).filter(a => a.status === "absent").length,
        late: Object.values(attendance).filter(a => a.status === "late").length,
        excused: Object.values(attendance).filter(a => a.status === "excused").length,
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
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/teacher")}
                            className="p-2"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: "var(--fundi-black)" }}>
                                Mark Attendance
                            </h1>
                            <p className="text-gray-600">Record student attendance for today</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-2 border rounded-md"
                        />
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Attendance
                                </>
                            )}
                        </Button>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-lime)" }}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Present</p>
                                    <p className="text-2xl font-bold" style={{ color: "var(--fundi-lime)" }}>
                                        {stats.present}
                                    </p>
                                </div>
                                <CheckCircle className="h-8 w-8" style={{ color: "var(--fundi-lime)", opacity: 0.3 }} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-red)" }}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Absent</p>
                                    <p className="text-2xl font-bold" style={{ color: "var(--fundi-red)" }}>
                                        {stats.absent}
                                    </p>
                                </div>
                                <XCircle className="h-8 w-8" style={{ color: "var(--fundi-red)", opacity: 0.3 }} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-orange)" }}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Late</p>
                                    <p className="text-2xl font-bold" style={{ color: "var(--fundi-orange)" }}>
                                        {stats.late}
                                    </p>
                                </div>
                                <Clock className="h-8 w-8" style={{ color: "var(--fundi-orange)", opacity: 0.3 }} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Excused</p>
                                    <p className="text-2xl font-bold" style={{ color: "var(--fundi-purple)" }}>
                                        {stats.excused}
                                    </p>
                                </div>
                                <AlertCircle className="h-8 w-8" style={{ color: "var(--fundi-purple)", opacity: 0.3 }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Students List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-6 w-6" style={{ color: "var(--fundi-cyan)" }} />
                            Students ({students.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {students.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600 text-lg font-semibold mb-2">No Students Found</p>
                                <p className="text-gray-500 text-sm">
                                    Unable to load students. Please try refreshing the page.
                                </p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {students.map((student, index) => {
                                    const record = attendance[student.id];
                                    const StatusIcon = getStatusIcon(record?.status || "present");

                                    return (
                                        <motion.div
                                            key={student.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.02 }}
                                        >
                                            <Card className="border-2">
                                                <CardContent className="p-4">
                                                    <div className="mb-3">
                                                        <h3 className="font-bold text-lg">{student.full_name}</h3>
                                                        <p className="text-sm text-gray-600">{student.current_class}</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Button
                                                            onClick={() => updateAttendance(student.id, "present")}
                                                            variant={record?.status === "present" ? "default" : "outline"}
                                                            className="text-xs"
                                                            style={
                                                                record?.status === "present"
                                                                    ? { backgroundColor: "var(--fundi-lime)", color: "white" }
                                                                    : {}
                                                            }
                                                        >
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Present
                                                        </Button>

                                                        <Button
                                                            onClick={() => updateAttendance(student.id, "absent")}
                                                            variant={record?.status === "absent" ? "default" : "outline"}
                                                            className="text-xs"
                                                            style={
                                                                record?.status === "absent"
                                                                    ? { backgroundColor: "var(--fundi-red)", color: "white" }
                                                                    : {}
                                                            }
                                                        >
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            Absent
                                                        </Button>

                                                        <Button
                                                            onClick={() => updateAttendance(student.id, "late")}
                                                            variant={record?.status === "late" ? "default" : "outline"}
                                                            className="text-xs"
                                                            style={
                                                                record?.status === "late"
                                                                    ? { backgroundColor: "var(--fundi-orange)", color: "white" }
                                                                    : {}
                                                            }
                                                        >
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            Late
                                                        </Button>

                                                        <Button
                                                            onClick={() => updateAttendance(student.id, "excused")}
                                                            variant={record?.status === "excused" ? "default" : "outline"}
                                                            className="text-xs"
                                                            style={
                                                                record?.status === "excused"
                                                                    ? { backgroundColor: "var(--fundi-purple)", color: "white" }
                                                                    : {}
                                                            }
                                                        >
                                                            <AlertCircle className="h-3 w-3 mr-1" />
                                                            Excused
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
