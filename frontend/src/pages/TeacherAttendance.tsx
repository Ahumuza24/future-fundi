import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { motion } from "framer-motion";

interface Learner {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    age?: number;
}

interface AttendanceRecord {
    learner_id: string;
    status: "present" | "absent" | "late" | "excused";
    notes: string;
}

interface Session {
    id: string;
    module_name: string;
    date: string;
    start_time?: string;
    status: string;
    attendance_marked: boolean;
    learners: Learner[];
    attendance_records: Array<{
        learner_id: string;
        learner_name: string;
        status: string;
        notes: string;
    }>;
}

export default function TeacherAttendance() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<Session | null>(null);
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            setLoading(true);
            const response = await teacherApi.getSession(sessionId!);
            const sessionData = response.data;
            setSession(sessionData);

            // Initialize attendance from existing records or default to present
            const initialAttendance: Record<string, AttendanceRecord> = {};
            sessionData.learners.forEach((learner: Learner) => {
                const existing = sessionData.attendance_records?.find(
                    (r: any) => r.learner_id === learner.id
                );
                initialAttendance[learner.id] = {
                    learner_id: learner.id,
                    status: existing?.status || "present",
                    notes: existing?.notes || "",
                };
            });
            setAttendance(initialAttendance);
        } catch (err: any) {
            setError("Failed to load session");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateAttendance = (learnerId: string, status: AttendanceRecord["status"]) => {
        setAttendance((prev) => ({
            ...prev,
            [learnerId]: {
                ...prev[learnerId],
                status,
            },
        }));
    };

    const updateNotes = (learnerId: string, notes: string) => {
        setAttendance((prev) => ({
            ...prev,
            [learnerId]: {
                ...prev[learnerId],
                notes,
            },
        }));
    };

    const markAllPresent = () => {
        const updated: Record<string, AttendanceRecord> = {};
        Object.keys(attendance).forEach((learnerId) => {
            updated[learnerId] = {
                ...attendance[learnerId],
                status: "present",
            };
        });
        setAttendance(updated);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            const attendanceArray = Object.values(attendance);
            await teacherApi.markAttendance(sessionId!, attendanceArray);
            setSuccess(true);
            setTimeout(() => {
                navigate("/teacher");
            }, 1500);
        } catch (err: any) {
            setError("Failed to save attendance");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-purple)] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading session...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Session Not Found</h2>
                        <Button onClick={() => navigate("/teacher")} style={{ backgroundColor: "var(--fundi-purple)" }}>
                            Back to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusColors = {
        present: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
        absent: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
        late: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
        excused: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
    };

    const presentCount = Object.values(attendance).filter((a) => a.status === "present").length;
    const absentCount = Object.values(attendance).filter((a) => a.status === "absent").length;

    return (
        <div className="min-h-screen p-3 md:p-4 lg:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => navigate("/teacher")}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="heading-font text-2xl md:text-3xl font-bold" style={{ color: "var(--fundi-black)" }}>
                                Mark Attendance
                            </h1>
                            <p className="text-gray-600">{session.module_name} - {session.date}</p>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-600 font-semibold">Attendance saved successfully! Redirecting...</span>
                    </motion.div>
                )}

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-red-600">{error}</span>
                    </motion.div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Users className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--fundi-purple)" }} />
                            <p className="text-2xl font-bold">{session.learners.length}</p>
                            <p className="text-sm text-gray-600">Total Learners</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                            <p className="text-2xl font-bold">{presentCount}</p>
                            <p className="text-sm text-gray-600">Present</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                            <p className="text-2xl font-bold">{absentCount}</p>
                            <p className="text-sm text-gray-600">Absent</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Quick Actions:</span>
                            <Button
                                onClick={markAllPresent}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Mark All Present
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Learner List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Learners</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {session.learners.map((learner, index) => {
                                const learnerAttendance = attendance[learner.id];
                                const colors = statusColors[learnerAttendance?.status || "present"];

                                return (
                                    <motion.div
                                        key={learner.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                    >
                                        <Card className="border-2 hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="p-3 rounded-full"
                                                                style={{ backgroundColor: "rgba(156, 39, 176, 0.1)" }}
                                                            >
                                                                <Users className="h-5 w-5" style={{ color: "var(--fundi-purple)" }} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-lg">{learner.full_name}</h3>
                                                                {learner.age && (
                                                                    <p className="text-sm text-gray-600">{learner.age} years old</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status Buttons */}
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {(["present", "absent", "late", "excused"] as const).map((status) => {
                                                            const isSelected = learnerAttendance?.status === status;
                                                            const statusColor = statusColors[status];
                                                            return (
                                                                <Button
                                                                    key={status}
                                                                    onClick={() => updateAttendance(learner.id, status)}
                                                                    className={`${isSelected
                                                                            ? `${statusColor.bg} ${statusColor.text} border-2 ${statusColor.border}`
                                                                            : "bg-gray-100 text-gray-700 border-2 border-gray-200"
                                                                        } hover:opacity-80`}
                                                                >
                                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                                </Button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Notes */}
                                                    {(learnerAttendance?.status === "absent" || learnerAttendance?.status === "excused") && (
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-1">Notes (optional)</label>
                                                            <input
                                                                type="text"
                                                                value={learnerAttendance?.notes || ""}
                                                                onChange={(e) => updateNotes(learner.id, e.target.value)}
                                                                placeholder="e.g., Sick, Family emergency"
                                                                className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--fundi-purple)]"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-3">
                    <Button
                        onClick={() => navigate("/teacher")}
                        variant="outline"
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        style={{ backgroundColor: "var(--fundi-purple)", color: "white" }}
                        className="flex items-center gap-2 min-w-[150px]"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save Attendance
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
