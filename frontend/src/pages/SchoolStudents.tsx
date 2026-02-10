import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Users, Search, UserPlus, Eye, Edit, Trash2, ArrowLeft, Mail, School, Calendar
} from "lucide-react";
import { motion } from "framer-motion";

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    user_email: string;
    current_school: string;
    current_class: string;
    date_of_birth: string;
    badges_count: number;
    credentials_count: number;
    attendance_rate: number;
}

export default function SchoolStudents() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentForm, setStudentForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        class: "",
        date_of_birth: ""
    });

    useEffect(() => {
        fetchStudents();
        // Check if we should open add dialog
        if (searchParams.get('action') === 'add') {
            setIsAddDialogOpen(true);
        }
    }, [searchParams]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual API call
            // const response = await schoolApi.students.getAll();
            // setStudents(response.data);

            // Mock data for now
            setTimeout(() => {
                setStudents([
                    {
                        id: "1",
                        first_name: "John",
                        last_name: "Doe",
                        full_name: "John Doe",
                        user_email: "john.doe@school.com",
                        current_school: "Future Fundi Academy",
                        current_class: "Grade 10",
                        date_of_birth: "2008-05-15",
                        badges_count: 12,
                        credentials_count: 5,
                        attendance_rate: 95
                    },
                    {
                        id: "2",
                        first_name: "Jane",
                        last_name: "Smith",
                        full_name: "Jane Smith",
                        user_email: "jane.smith@school.com",
                        current_school: "Future Fundi Academy",
                        current_class: "Grade 11",
                        date_of_birth: "2007-08-22",
                        badges_count: 18,
                        credentials_count: 7,
                        attendance_rate: 98
                    }
                ]);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error("Failed to fetch students:", error);
            setLoading(false);
        }
    };

    const handleAddStudent = async () => {
        try {
            // TODO: API call to add student
            // await schoolApi.students.create(studentForm);
            console.log("Adding student:", studentForm);

            setIsAddDialogOpen(false);
            setStudentForm({
                first_name: "",
                last_name: "",
                email: "",
                class: "",
                date_of_birth: ""
            });
            fetchStudents();
            alert("Student added successfully!");
        } catch (error) {
            console.error("Failed to add student:", error);
            alert("Failed to add student. Please try again.");
        }
    };

    const handleEditStudent = async () => {
        if (!selectedStudent) return;

        try {
            // TODO: API call to update student
            // await schoolApi.students.update(selectedStudent.id, studentForm);
            console.log("Updating student:", selectedStudent.id, studentForm);

            setIsEditDialogOpen(false);
            setSelectedStudent(null);
            setStudentForm({
                first_name: "",
                last_name: "",
                email: "",
                class: "",
                date_of_birth: ""
            });
            fetchStudents();
            alert("Student updated successfully!");
        } catch (error) {
            console.error("Failed to update student:", error);
            alert("Failed to update student. Please try again.");
        }
    };

    const handleDeleteStudent = async (studentId: string) => {
        if (!confirm("Are you sure you want to delete this student?")) return;

        try {
            // TODO: API call to delete student
            // await schoolApi.students.delete(studentId);
            console.log("Deleting student:", studentId);

            fetchStudents();
            alert("Student deleted successfully!");
        } catch (error) {
            console.error("Failed to delete student:", error);
            alert("Failed to delete student. Please try again.");
        }
    };

    const openEditDialog = (student: Student) => {
        setSelectedStudent(student);
        setStudentForm({
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.user_email,
            class: student.current_class,
            date_of_birth: student.date_of_birth
        });
        setIsEditDialogOpen(true);
    };

    const filteredStudents = students.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.current_class.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-purple)] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
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
                                Student Management
                            </h1>
                            <p className="text-gray-600">Manage your school's students</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        style={{ backgroundColor: "var(--fundi-purple)", color: "white" }}
                        className="flex items-center gap-2"
                    >
                        <UserPlus className="h-5 w-5" />
                        Add Student
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Search students by name, email, or class..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Students List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                            All Students ({filteredStudents.length})
                        </CardTitle>
                        <CardDescription>View and manage student information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredStudents.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600 text-lg font-semibold mb-2">No Students Found</p>
                                <p className="text-gray-500 text-sm">
                                    {searchTerm ? "Try adjusting your search" : "Add your first student to get started"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredStudents.map((student, index) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <Card className="border-2 hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                                            style={{ backgroundColor: "var(--fundi-purple)" }}>
                                                            {student.first_name[0]}{student.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg">{student.full_name}</h3>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                                <span className="flex items-center gap-1">
                                                                    <Mail className="h-4 w-4" />
                                                                    {student.user_email}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <School className="h-4 w-4" />
                                                                    {student.current_class}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-4 w-4" />
                                                                    {new Date(student.date_of_birth).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/school/students/${student.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openEditDialog(student)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteStudent(student.id)}
                                                            className="text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Add Student Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Student</DialogTitle>
                            <DialogDescription>Enter the student's information below</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <Input
                                        id="first_name"
                                        value={studentForm.first_name}
                                        onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })}
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        value={studentForm.last_name}
                                        onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={studentForm.email}
                                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                                    placeholder="john.doe@school.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="class">Class</Label>
                                    <Input
                                        id="class"
                                        value={studentForm.class}
                                        onChange={(e) => setStudentForm({ ...studentForm, class: e.target.value })}
                                        placeholder="Grade 10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                                    <Input
                                        id="date_of_birth"
                                        type="date"
                                        value={studentForm.date_of_birth}
                                        onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddStudent} style={{ backgroundColor: "var(--fundi-purple)", color: "white" }}>
                                Add Student
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Student Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit Student</DialogTitle>
                            <DialogDescription>Update the student's information</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_first_name">First Name</Label>
                                    <Input
                                        id="edit_first_name"
                                        value={studentForm.first_name}
                                        onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_last_name">Last Name</Label>
                                    <Input
                                        id="edit_last_name"
                                        value={studentForm.last_name}
                                        onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_email">Email</Label>
                                <Input
                                    id="edit_email"
                                    type="email"
                                    value={studentForm.email}
                                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_class">Class</Label>
                                    <Input
                                        id="edit_class"
                                        value={studentForm.class}
                                        onChange={(e) => setStudentForm({ ...studentForm, class: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_date_of_birth">Date of Birth</Label>
                                    <Input
                                        id="edit_date_of_birth"
                                        type="date"
                                        value={studentForm.date_of_birth}
                                        onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditStudent} style={{ backgroundColor: "var(--fundi-purple)", color: "white" }}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
