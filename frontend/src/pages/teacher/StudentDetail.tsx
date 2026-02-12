import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teacherApi, enrollmentApi, progressApi } from "@/lib/api";
import {
    ArrowLeft, Award, GraduationCap, BookOpen, TrendingUp,
    Calendar, School, Medal, CheckCircle, Trophy, Target, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

interface ProgressData {
    id: string;
    level: string; // ID
    level_name: string;
    level_number: number;
    modules_completed: number;
    artifacts_submitted: number;
    assessment_score: number;
    teacher_confirmed: boolean;
    completed: boolean;
    completion_percentage: number;
    requirements: {
        modules: { required: number; completed: number; met: boolean };
        artifacts: { required: number; submitted: number; met: boolean };
        assessment: { required: number; score: number; met: boolean };
    };
}

export default function StudentDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [student, setStudent] = useState<StudentDetail | null>(null);
    const [badges, setBadges] = useState<BadgeItem[]>([]);
    const [credentials, setCredentials] = useState<CredentialItem[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    // Progress Modal State
    const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [currentProgress, setCurrentProgress] = useState<ProgressData | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(false);
    const [progressForm, setProgressForm] = useState({
        artifacts: 0,
        score: 0
    });
    const [badgeForm, setBadgeForm] = useState({
        badge_name: "",
        description: ""
    });

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

    const handleOpenProgress = async (enrollment: Enrollment) => {
        setSelectedEnrollment(enrollment);
        setIsProgressDialogOpen(true);
        setLoadingProgress(true);
        setCurrentProgress(null);

        try {
            console.log("Fetching progress for enrollment:", enrollment.id);
            const response = await enrollmentApi.getProgress(enrollment.id);
            console.log("Progress API response:", response.data);

            // Get the last progress record (current level)
            const allProgress = Array.isArray(response.data) ? response.data : [];
            console.log("All progress records:", allProgress);

            const active = allProgress.length > 0 ? allProgress[allProgress.length - 1] : null;
            console.log("Active progress:", active);

            if (active) {
                setCurrentProgress(active);
                setProgressForm({
                    artifacts: active.artifacts_submitted || 0,
                    score: active.assessment_score || 0
                });
            } else {
                // No progress exists - create initial progress data
                console.log("No progress found, creating initial progress");
                const initialProgress: ProgressData = {
                    id: `temp-${enrollment.id}`,
                    level: enrollment.id,
                    level_name: enrollment.current_level_name || "Level 1",
                    level_number: 1,
                    modules_completed: 0,
                    artifacts_submitted: 0,
                    assessment_score: 0,
                    completion_percentage: 0,
                    teacher_confirmed: false,
                    completed: false,
                    requirements: {
                        modules: { required: 5, completed: 0, met: false },
                        artifacts: { required: 3, submitted: 0, met: false },
                        assessment: { required: 70, score: 0, met: false }
                    }
                };
                setCurrentProgress(initialProgress);
                setProgressForm({
                    artifacts: 0,
                    score: 0
                });
            }
        } catch (error: any) {
            console.error("Failed to fetch progress:", error);
            console.error("Error details:", error.response?.data || error.message);

            // Even on error, create initial progress so user can still update
            const initialProgress: ProgressData = {
                id: `temp-${enrollment.id}`,
                level: enrollment.id,
                level_name: enrollment.current_level_name || "Level 1",
                level_number: 1,
                modules_completed: 0,
                artifacts_submitted: 0,
                assessment_score: 0,
                completion_percentage: 0,
                teacher_confirmed: false,
                completed: false,
                requirements: {
                    modules: { required: 5, completed: 0, met: false },
                    artifacts: { required: 3, submitted: 0, met: false },
                    assessment: { required: 70, score: 0, met: false }
                }
            };
            setCurrentProgress(initialProgress);
            setProgressForm({
                artifacts: 0,
                score: 0
            });
        } finally {
            setLoadingProgress(false);
        }
    };

    const handleUpdateProgress = async () => {
        if (!currentProgress) return;

        try {
            // Check if this is a temporary ID (no real progress exists yet)
            if (currentProgress.id.startsWith('temp-')) {
                console.log("Cannot update progress - no progress record exists yet");
                console.log("Progress needs to be created on the backend first");
                alert("Note: Progress tracking will be created when the student starts this level. You can view and update it then.");
                setIsProgressDialogOpen(false);
                return;
            }

            console.log("Updating progress:", currentProgress.id, progressForm);

            // Update progress
            await progressApi.updateProgress(currentProgress.id, {
                artifacts_submitted: progressForm.artifacts,
                assessment_score: progressForm.score
            });

            console.log("Progress updated successfully");

            // Award badge if provided
            if (badgeForm.badge_name.trim()) {
                console.log("Awarding badge:", badgeForm);
                await teacherApi.badges.award({
                    learner: student!.id,
                    badge_name: badgeForm.badge_name,
                    description: badgeForm.description || `Awarded for progress in ${selectedEnrollment?.course_name}`
                });
                console.log("Badge awarded successfully");
            }

            // Refresh progress data
            const response = await enrollmentApi.getProgress(selectedEnrollment!.id);
            const allProgress = Array.isArray(response.data) ? response.data : [];
            const active = allProgress.length > 0 ? allProgress[allProgress.length - 1] : null;

            if (active) {
                setCurrentProgress(active);
            }

            // Refresh main data in case level changed
            fetchStudentData();

            // Reset badge form
            setBadgeForm({ badge_name: "", description: "" });

            // Show success message
            const message = badgeForm.badge_name.trim()
                ? "Progress updated and badge awarded successfully!"
                : "Progress updated successfully!";
            alert(message);
            setIsProgressDialogOpen(false);
        } catch (error: any) {
            console.error("Failed to update progress:", error);
            console.error("Error details:", error.response?.data || error.message);
            alert("Failed to update progress. Please try again.");
        }
    };

    const handleConfirmCompletion = async () => {
        if (!currentProgress) return;

        try {
            await progressApi.confirmCompletion(currentProgress.id);
            setIsProgressDialogOpen(false);
            fetchStudentData();
        } catch (error) {
            console.error("Failed to confirm completion:", error);
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
                            Microcredentials
                        </CardTitle>
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
                                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-gray-50 gap-4"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg">{enrollment.course_name}</h3>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${enrollment.is_active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                >
                                                    {enrollment.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Current Level: <span className="font-semibold text-[var(--fundi-purple)]">{enrollment.current_level_name || "Not Started"}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Enrolled: {formatDate(enrollment.enrolled_at)}
                                            </p>
                                        </div>

                                        <Button
                                            onClick={() => handleOpenProgress(enrollment)}
                                            style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}
                                            className="flex items-center gap-2"
                                            disabled={!enrollment.is_active}
                                        >
                                            <Trophy className="h-4 w-4" />
                                            Update Progress
                                        </Button>
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

                {/* Progress Dialog */}
                <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Update Progress</DialogTitle>
                            <DialogDescription>
                                {selectedEnrollment?.course_name} - {selectedEnrollment?.current_level_name}
                            </DialogDescription>
                        </DialogHeader>

                        {loadingProgress ? (
                            <div className="py-12 text-center">
                                <div className="animate-spin h-8 w-8 border-4 border-[var(--fundi-purple)] border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p>Loading progress data...</p>
                            </div>
                        ) : currentProgress ? (
                            <div className="space-y-6">
                                {/* Current Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-100">
                                        <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                                        <p className="text-sm text-gray-600">Completion</p>
                                        <p className="text-xl font-bold text-blue-700">{Math.round(currentProgress.completion_percentage)}%</p>
                                    </div>
                                    <div className="p-4 bg-orange-50 rounded-lg text-center border border-orange-100">
                                        <Trophy className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                                        <p className="text-sm text-gray-600">Score</p>
                                        <p className="text-xl font-bold text-orange-700">
                                            {progressForm.score} / {currentProgress.requirements.assessment.required}
                                        </p>
                                    </div>
                                </div>

                                {/* Inputs */}
                                <div className="grid gap-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="artifacts">Artifacts Submitted</Label>
                                            <Input
                                                id="artifacts"
                                                type="number"
                                                min={0}
                                                value={progressForm.artifacts}
                                                onChange={(e) => setProgressForm({ ...progressForm, artifacts: parseInt(e.target.value) || 0 })}
                                            />
                                            <p className="text-xs text-gray-500">
                                                Required: {currentProgress.requirements.artifacts.required}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="score">Assessment Score (%)</Label>
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    id="score"
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={progressForm.score}
                                                    onChange={(e) => setProgressForm({ ...progressForm, score: parseInt(e.target.value) || 0 })}
                                                    className="w-full"
                                                />
                                                {progressForm.score >= currentProgress.requirements.assessment.required && (
                                                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium whitespace-nowrap">
                                                        <CheckCircle className="h-4 w-4" />
                                                        Passing
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Pass mark: {currentProgress.requirements.assessment.required}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Badge Awarding Section */}
                                    <div className="border-t pt-6">
                                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                                            <Award className="h-5 w-5 text-yellow-600" />
                                            Award Badge (Optional)
                                        </h4>
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="badge_name">Badge Name</Label>
                                                <Input
                                                    id="badge_name"
                                                    placeholder="e.g., Module Master, Quick Learner"
                                                    value={badgeForm.badge_name}
                                                    onChange={(e) => setBadgeForm({ ...badgeForm, badge_name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="badge_description">Description</Label>
                                                <Input
                                                    id="badge_description"
                                                    placeholder="Reason for awarding this badge"
                                                    value={badgeForm.description}
                                                    onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Confirmation Box */}
                                {currentProgress.teacher_confirmed ? (
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <p className="font-semibold text-green-700">Level Completed</p>
                                            <p className="text-sm text-green-600">You have confirmed completion for this level.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                        <div>
                                            <h4 className="font-medium">Confirm Completion</h4>
                                            <p className="text-sm text-gray-500">
                                                Mark this level as complete to unlock the next level.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleConfirmCompletion}
                                            disabled={
                                                progressForm.artifacts < currentProgress.requirements.artifacts.required ||
                                                progressForm.score < currentProgress.requirements.assessment.required
                                            }
                                            variant={currentProgress.teacher_confirmed ? "outline" : "default"}
                                            className={currentProgress.teacher_confirmed ? "border-green-500 text-green-600" : ""}
                                        >
                                            {currentProgress.teacher_confirmed ? "Confirmed" : "Mark Complete"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No progress data available for this level.</p>
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setIsProgressDialogOpen(false)}>
                                Close
                            </Button>
                            <Button onClick={handleUpdateProgress} disabled={!currentProgress}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

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
