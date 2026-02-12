import { useState, useEffect } from "react";
import { schoolApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
    Search, Plus, User, GraduationCap, Map, Download,
    MoreHorizontal, Filter, ChevronLeft, ChevronRight, Key, School, CheckCircle, AlertCircle
} from "lucide-react";

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    current_class: string;
    pathways: { id: string; name: string }[];
    joined_at: string;
    parent_name?: string;
    username?: string;
}

interface PodClass {
    id: string;
    name: string;
}

interface Pathway {
    id: string;
    name: string;
    description: string;
}

export default function SchoolStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<PodClass[]>([]);
    const [pathways, setPathways] = useState<Pathway[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form State (Aligned with ChildManagement logic)
    const [studentForm, setStudentForm] = useState({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        current_class: "", // Maps to pod_class_id via dropdown, or direct string if manual? Parent form has manual string OR dropdown. Here we use PodClass dropdown.
        pod_class_id: "",
        username: "",
        password: "",
        password_confirm: "",
        consent_media: true,
        equity_flag: false,
        pathway_ids: [] as string[]
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Students
                const studentsRes = await schoolApi.students.getAll();
                const sData = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data.results || []);
                setStudents(sData);

                // Fetch Classes
                const classesRes = await schoolApi.classes.getAll();
                const cData = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data.results || []);
                setClasses(cData);

                // Fetch Pathways
                const pathwaysRes = await schoolApi.pathways.getAll();
                const pData = Array.isArray(pathwaysRes.data) ? pathwaysRes.data : (pathwaysRes.data.results || []);
                setPathways(pData);

            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAddStudent = async () => {
        // Validation (Parent Logic)
        if (!studentForm.first_name || !studentForm.last_name || !studentForm.username || !studentForm.password) {
            alert("Please fill in all required fields (Name, Username, Password).");
            return;
        }

        if (studentForm.password !== studentForm.password_confirm) {
            alert("Passwords do not match.");
            return;
        }

        if (studentForm.password.length < 8) {
            alert("Password must be at least 8 characters long.");
            return;
        }

        // Parent form validates Age (6-18).
        if (studentForm.date_of_birth) {
            const dob = new Date(studentForm.date_of_birth);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            if (age < 6 || age > 18) {
                // Optional: Ask for confirmation instead of blocking? Parent form blocks. I'll block to match logic.
                alert("Student must be between 6 and 18 years old.");
                return;
            }
        }

        try {
            const payload: any = {
                first_name: studentForm.first_name,
                last_name: studentForm.last_name,
                username: studentForm.username,
                password: studentForm.password,
                current_class: studentForm.current_class || "",
                pathway_ids: studentForm.pathway_ids,
                date_of_birth: studentForm.date_of_birth || null,
                consent_media: studentForm.consent_media,
                equity_flag: studentForm.equity_flag
            };

            // Only send pod_class_id if a DB class was selected
            if (studentForm.pod_class_id) {
                payload.pod_class_id = studentForm.pod_class_id;
            }

            await schoolApi.students.create(payload);

            // Refresh
            const res = await schoolApi.students.getAll();
            const sData = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setStudents(sData);

            setIsAddOpen(false);
            setStudentForm({
                first_name: "", last_name: "", date_of_birth: "", current_class: "", pod_class_id: "",
                username: "", password: "", password_confirm: "", consent_media: true, equity_flag: false, pathway_ids: []
            });
            alert("Student added successfully! They can now log in with the username and password you set.");
        } catch (error: any) {
            console.error("Failed to add student:", error);
            // Show backend validation errors
            const data = error?.response?.data;
            if (data) {
                const messages = Object.entries(data)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join('\n');
                alert(`Failed to add student:\n${messages}`);
            } else {
                alert("Failed to add student. Please check input.");
            }
        }
    };

    const handlePathwayToggle = (id: string) => {
        setStudentForm(prev => {
            const current = prev.pathway_ids;
            if (current.includes(id)) {
                return { ...prev, pathway_ids: current.filter(cid => cid !== id) };
            } else {
                if (current.length >= 2) {
                    alert("Max 2 pathways allowed");
                    return prev;
                }
                return { ...prev, pathway_ids: [...current, id] };
            }
        });
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.username && s.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const inputClass = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--fundi-purple)]";

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="heading-font text-3xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            School Management
                        </h1>
                        <p className="text-gray-600">Manage students, enrollments, and classes</p>
                    </div>
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-[var(--fundi-purple)] hover:opacity-90 text-white gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Add Student
                    </Button>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search students by name or username..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Students List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pathways</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Loading students...
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No students found matching your search.
                                        </td>
                                    </tr>
                                )}
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold mr-3">
                                                    {student.first_name[0]}{student.last_name[0]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                                                    <div className="text-xs text-gray-500">{student.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <GraduationCap className="h-4 w-4 mr-1 text-gray-400" />
                                                {student.current_class || "Unassigned"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-1">
                                                {student.pathways && student.pathways.length > 0 ? (
                                                    student.pathways.map((p) => (
                                                        <span key={p.id} className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-medium border border-blue-100">
                                                            {p.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">None</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(student.joined_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button variant="ghost" size="sm">Details</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Student Dialog (Parent Logic Adapted) */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Plus className="h-6 w-6 text-[var(--fundi-purple)]" />
                                Add New Student
                            </DialogTitle>
                            <DialogDescription>
                                Create a student profile and login credentials.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            {/* Personal Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">First Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={studentForm.first_name}
                                        onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Last Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={studentForm.last_name}
                                        onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={studentForm.date_of_birth}
                                    onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1 flex items-center gap-1">
                                        <GraduationCap className="h-4 w-4" /> Class / Grade
                                    </label>
                                    <select
                                        className={inputClass}
                                        value={studentForm.pod_class_id || studentForm.current_class}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Check if value is a UUID (approximate check length > 10 and not standard)
                                            // Actually simpler: check if it exists in classes array IDs
                                            const dbClass = classes.find(c => c.id === val);
                                            if (dbClass) {
                                                setStudentForm({ ...studentForm, pod_class_id: val, current_class: dbClass.name });
                                            } else {
                                                setStudentForm({ ...studentForm, pod_class_id: "", current_class: val });
                                            }
                                        }}
                                    >
                                        <option value="">Select a Class...</option>
                                        {/* DB Classes */}
                                        {classes.length > 0 && (
                                            <optgroup label="School Classes">
                                                {classes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {/* Standard Options (Fallback) */}
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
                                    <label className="block text-sm font-semibold mb-1 flex items-center gap-1">
                                        <User className="h-4 w-4" /> Username <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={studentForm.username}
                                        onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                                        placeholder="e.g. john_doe"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Credentials */}
                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-700">
                                    <Key className="h-4 w-4" />
                                    Login Credentials
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Password <span className="text-red-500">*</span></label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            value={studentForm.password}
                                            onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                                            placeholder="Min. 8 chars"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Confirm Password <span className="text-red-500">*</span></label>
                                        <input
                                            type="password"
                                            className={inputClass}
                                            value={studentForm.password_confirm}
                                            onChange={(e) => setStudentForm({ ...studentForm, password_confirm: e.target.value })}
                                            placeholder="Re-enter password"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Consent & Equity */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="consent_media"
                                        className="h-4 w-4 text-[var(--fundi-purple)] rounded"
                                        checked={studentForm.consent_media}
                                        onChange={(e) => setStudentForm({ ...studentForm, consent_media: e.target.checked })}
                                    />
                                    <label htmlFor="consent_media" className="text-sm cursor-pointer select-none">
                                        I consent to media capture (photos/videos) for educational purposes
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="equity_flag"
                                        className="h-4 w-4 text-[var(--fundi-purple)] rounded"
                                        checked={studentForm.equity_flag}
                                        onChange={(e) => setStudentForm({ ...studentForm, equity_flag: e.target.checked })}
                                    />
                                    <label htmlFor="equity_flag" className="text-sm cursor-pointer select-none">
                                        Student requires additional support (Equity Flag)
                                    </label>
                                </div>
                            </div>

                            {/* Pathways */}
                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-700">
                                    <Map className="h-4 w-4" />
                                    Select Pathways (Max 2)
                                </h4>
                                <div className="border rounded-md p-2 max-h-40 overflow-y-auto bg-gray-50 space-y-1">
                                    {pathways.length === 0 ? (
                                        <p className="text-sm text-gray-500 p-2">No pathways available.</p>
                                    ) : (
                                        pathways.map(p => (
                                            <div key={p.id} className="flex items-center space-x-2 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    id={`pw-${p.id}`}
                                                    checked={studentForm.pathway_ids.includes(p.id)}
                                                    onChange={() => handlePathwayToggle(p.id)}
                                                    className="h-4 w-4 text-[var(--fundi-purple)] rounded border-gray-300"
                                                />
                                                <label htmlFor={`pw-${p.id}`} className="text-sm flex-1 cursor-pointer">
                                                    <span className="font-medium">{p.name}</span>
                                                    {p.description && <span className="block text-xs text-gray-500 truncate">{p.description}</span>}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddStudent} className="bg-[var(--fundi-purple)] text-white hover:opacity-90">
                                Add Student
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
