import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getSelectedTeacherSchoolId } from "@/lib/auth";
import { teacherApi } from "@/lib/api";
import { toast } from "@/lib/toast";

interface Course {
    id: string;
    name: string;
}

interface AddStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    courses: Course[];
}

export function AddStudentDialog({ open, onOpenChange, onSuccess, courses }: AddStudentDialogProps) {
    const [studentForm, setStudentForm] = useState({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        current_class: "",
        username: "",
        password: "",
        password_confirm: "",
        consent_media: true,

        equity_flag: false,
        pathway_ids: [] as string[],
        school_id: ""
    });
    const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getErrorMessage = (data: any): string => {
        if (!data) return "Failed to add student. Please check input.";
        if (typeof data === "string") return data;
        if (data.error?.message) return data.error.message;
        if (typeof data.error === "string") return data.error;
        if (typeof data.detail === "string") return data.detail;

        if (typeof data === "object") {
            const lines: string[] = [];
            Object.entries(data).forEach(([field, value]) => {
                if (Array.isArray(value)) {
                    lines.push(`${field}: ${value.join(", ")}`);
                } else if (typeof value === "string") {
                    lines.push(`${field}: ${value}`);
                }
            });
            if (lines.length > 0) return lines.join("\n");
        }
        return "Failed to add student. Please check input.";
    };

    useEffect(() => {
        if (open) {
            teacherApi.students.getSchools()
                .then((res) => {
                    const schoolsData = Array.isArray(res.data)
                        ? res.data
                        : (res.data?.schools || []);
                    const selectedSchoolId =
                        res.data?.selected_school_id ||
                        getSelectedTeacherSchoolId() ||
                        (schoolsData.length === 1 ? schoolsData[0].id : "");
                    setSchools(schoolsData);
                    setSelectedSchoolId(selectedSchoolId);
                    if (selectedSchoolId) {
                        setStudentForm((prev) => ({ ...prev, school_id: selectedSchoolId }));
                    }
                })
                .catch(err => console.error("Failed to fetch schools:", err));
        }
    }, [open]);

    const handlePathwayToggle = (id: string) => {
        setStudentForm(prev => {
            const current = prev.pathway_ids;
            if (current.includes(id)) {
                return { ...prev, pathway_ids: current.filter(cid => cid !== id) };
            } else {
                if (current.length >= 2) {
                    toast.error("You can select a maximum of 2 pathways.", "Selection Limit");
                    return prev;
                }
                return { ...prev, pathway_ids: [...current, id] };
            }
        });
    };

    const handleAddStudent = async () => {
        if (isSubmitting) {
            return;
        }

        // Validation
        if (!studentForm.first_name || !studentForm.last_name || !studentForm.username || !studentForm.password) {
            toast.error("Please fill in all required fields.", "Missing Fields");
            return;
        }

        const contextSchoolId = selectedSchoolId || studentForm.school_id || getSelectedTeacherSchoolId() || "";
        if (!contextSchoolId) {
            toast.error("Select a school context before adding a student.", "No School Selected");
            return;
        }

        if (studentForm.password !== studentForm.password_confirm) {
            toast.error("Passwords do not match.", "Password Error");
            return;
        }

        if (studentForm.password.length < 8) {
            toast.error("Password must be at least 8 characters long.", "Weak Password");
            return;
        }
        if (!/[A-Z]/.test(studentForm.password)) {
            toast.error("Password must contain at least one uppercase letter.", "Weak Password");
            return;
        }
        if (!/[0-9]/.test(studentForm.password)) {
            toast.error("Password must contain at least one digit.", "Weak Password");
            return;
        }

        try {
            setIsSubmitting(true);
            // Prepare payload
            const payload = {
                ...studentForm,
                school_id: contextSchoolId,
                date_of_birth: studentForm.date_of_birth || null,
                pod_class_id: null, // Teacher view doesn't have pod_class_id logic yet but serializer expects it as optional
            };

            // Remove password_confirm from payload
            delete (payload as any).password_confirm;

            await teacherApi.students.create(payload);

            // Success handling
            onSuccess();
            onOpenChange(false);

            // Reset form
            setStudentForm({
                first_name: "", last_name: "", date_of_birth: "", current_class: "",
                username: "", password: "", password_confirm: "", consent_media: true, equity_flag: false, pathway_ids: [], school_id: ""
            });
            toast.success("Student added successfully.", "Saved");
        } catch (error: any) {
            console.error("Failed to add student:", error);
            const data = error?.response?.data;
            toast.error(getErrorMessage(data), "Add Student Failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                        Create a student profile and login credentials.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Use grid for compact layout */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>First Name <span className="text-red-500">*</span></Label>
                            <Input
                                value={studentForm.first_name}
                                onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label>Last Name <span className="text-red-500">*</span></Label>
                            <Input
                                value={studentForm.last_name}
                                onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })}
                                required
                            />
                        </div>
                    </div>



                    <div>
                        <Label>School <span className="text-red-500">*</span></Label>
                        <div className="flex h-10 w-full items-center rounded-md border border-input bg-gray-50 px-3 text-sm">
                            {schools.find((school) => school.id === (selectedSchoolId || studentForm.school_id))?.name || "No school selected"}
                        </div>
                        {schools.length > 1 && (
                            <p className="text-xs text-gray-500 mt-1">
                                To add in another school, use the \"Switch School\" action first.
                            </p>
                        )}
                    </div>

                    <div>
                        <Label>Date of Birth</Label>
                        <Input
                            type="date"
                            value={studentForm.date_of_birth}
                            onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Class / Grade</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={studentForm.current_class}
                                onChange={(e) => setStudentForm({ ...studentForm, current_class: e.target.value })}
                            >
                                <option value="">Select a Class...</option>
                                <optgroup label="Grades">
                                    {["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"].map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Primary School">
                                    {["P.1", "P.2", "P.3", "P.4", "P.5", "P.6", "P.7"].map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Secondary School">
                                    {["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"].map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <Label>Username <span className="text-red-500">*</span></Label>
                            <Input
                                value={studentForm.username}
                                onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="font-bold text-sm mb-3">Login Credentials</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Password <span className="text-red-500">*</span></Label>
                                <Input
                                    type="password"
                                    value={studentForm.password}
                                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                                    placeholder="Min 8 chars"
                                    required
                                />
                            </div>
                            <div>
                                <Label>Confirm Password <span className="text-red-500">*</span></Label>
                                <Input
                                    type="password"
                                    value={studentForm.password_confirm}
                                    onChange={(e) => setStudentForm({ ...studentForm, password_confirm: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="t-consent"
                                className="h-4 w-4 text-[var(--fundi-purple)] rounded"
                                checked={studentForm.consent_media}
                                onChange={(e) => setStudentForm({ ...studentForm, consent_media: e.target.checked })}
                            />
                            <Label htmlFor="t-consent" className="cursor-pointer">
                                Consent to media capture
                            </Label>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="font-bold text-sm mb-3">Select Pathways (Courses)</h4>
                        <div className="border rounded-md p-2 max-h-40 overflow-y-auto bg-gray-50 space-y-1">
                            {courses.map(c => (
                                <div key={c.id} className="flex items-center space-x-2 p-2 hover:bg-white rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id={`tpw-${c.id}`}
                                        checked={studentForm.pathway_ids.includes(c.id)}
                                        onChange={() => handlePathwayToggle(c.id)}
                                        className="h-4 w-4 text-[var(--fundi-purple)] rounded"
                                    />
                                    <Label htmlFor={`tpw-${c.id}`} className="flex-1 cursor-pointer">
                                        {c.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleAddStudent} disabled={isSubmitting} style={{ backgroundColor: "var(--fundi-cyan)", color: "white" }}>
                        {isSubmitting ? "Saving..." : "Add Student"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
