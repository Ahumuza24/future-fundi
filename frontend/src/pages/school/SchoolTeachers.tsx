import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    GraduationCap, Search, UserPlus, Eye, Edit, Trash2, ArrowLeft, Mail, Users, BookOpen
} from "lucide-react";
import { motion } from "framer-motion";

interface Teacher {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    subject_specialization: string;
    students_count: number;
    courses_count: number;
    phone_number: string;
}

export default function SchoolTeachers() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [teacherForm, setTeacherForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        subject_specialization: "",
        phone_number: ""
    });

    useEffect(() => {
        fetchTeachers();
        // Check if we should open add dialog
        if (searchParams.get('action') === 'add') {
            setIsAddDialogOpen(true);
        }
    }, [searchParams]);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual API call
            // const response = await schoolApi.teachers.getAll();
            // setTeachers(response.data);

            // Mock data for now
            setTimeout(() => {
                setTeachers([
                    {
                        id: "1",
                        first_name: "Sarah",
                        last_name: "Johnson",
                        full_name: "Sarah Johnson",
                        email: "sarah.johnson@school.com",
                        subject_specialization: "Mathematics",
                        students_count: 45,
                        courses_count: 3,
                        phone_number: "+254712345678"
                    },
                    {
                        id: "2",
                        first_name: "Michael",
                        last_name: "Brown",
                        full_name: "Michael Brown",
                        email: "michael.brown@school.com",
                        subject_specialization: "Science",
                        students_count: 38,
                        courses_count: 2,
                        phone_number: "+254723456789"
                    }
                ]);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error("Failed to fetch teachers:", error);
            setLoading(false);
        }
    };

    const handleAddTeacher = async () => {
        try {
            // TODO: API call to add teacher
            // await schoolApi.teachers.create(teacherForm);
            console.log("Adding teacher:", teacherForm);

            setIsAddDialogOpen(false);
            setTeacherForm({
                first_name: "",
                last_name: "",
                email: "",
                subject_specialization: "",
                phone_number: ""
            });
            fetchTeachers();
            alert("Teacher added successfully!");
        } catch (error) {
            console.error("Failed to add teacher:", error);
            alert("Failed to add teacher. Please try again.");
        }
    };

    const handleEditTeacher = async () => {
        if (!selectedTeacher) return;

        try {
            // TODO: API call to update teacher
            // await schoolApi.teachers.update(selectedTeacher.id, teacherForm);
            console.log("Updating teacher:", selectedTeacher.id, teacherForm);

            setIsEditDialogOpen(false);
            setSelectedTeacher(null);
            setTeacherForm({
                first_name: "",
                last_name: "",
                email: "",
                subject_specialization: "",
                phone_number: ""
            });
            fetchTeachers();
            alert("Teacher updated successfully!");
        } catch (error) {
            console.error("Failed to update teacher:", error);
            alert("Failed to update teacher. Please try again.");
        }
    };

    const handleDeleteTeacher = async (teacherId: string) => {
        if (!confirm("Are you sure you want to delete this teacher?")) return;

        try {
            // TODO: API call to delete teacher
            // await schoolApi.teachers.delete(teacherId);
            console.log("Deleting teacher:", teacherId);

            fetchTeachers();
            alert("Teacher deleted successfully!");
        } catch (error) {
            console.error("Failed to delete teacher:", error);
            alert("Failed to delete teacher. Please try again.");
        }
    };

    const openEditDialog = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setTeacherForm({
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            email: teacher.email,
            subject_specialization: teacher.subject_specialization,
            phone_number: teacher.phone_number
        });
        setIsEditDialogOpen(true);
    };

    const filteredTeachers = teachers.filter(teacher =>
        teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.subject_specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-lime)] border-t-transparent rounded-full"></div>
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
                                Teacher Management
                            </h1>
                            <p className="text-gray-600">Manage your school's teachers</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        style={{ backgroundColor: "var(--fundi-lime)", color: "white" }}
                        className="flex items-center gap-2"
                    >
                        <UserPlus className="h-5 w-5" />
                        Add Teacher
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Search teachers by name, email, or subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Teachers List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" style={{ color: "var(--fundi-lime)" }} />
                            All Teachers ({filteredTeachers.length})
                        </CardTitle>
                        <CardDescription>View and manage teacher information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredTeachers.length === 0 ? (
                            <div className="text-center py-12">
                                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600 text-lg font-semibold mb-2">No Teachers Found</p>
                                <p className="text-gray-500 text-sm">
                                    {searchTerm ? "Try adjusting your search" : "Add your first teacher to get started"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredTeachers.map((teacher, index) => (
                                    <motion.div
                                        key={teacher.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <Card className="border-2 hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                                            style={{ backgroundColor: "var(--fundi-lime)" }}>
                                                            {teacher.first_name[0]}{teacher.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg">{teacher.full_name}</h3>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                                <span className="flex items-center gap-1">
                                                                    <Mail className="h-4 w-4" />
                                                                    {teacher.email}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <BookOpen className="h-4 w-4" />
                                                                    {teacher.subject_specialization}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="h-4 w-4" />
                                                                    {teacher.students_count} students
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/school/teachers/${teacher.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openEditDialog(teacher)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteTeacher(teacher.id)}
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

                {/* Add Teacher Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Teacher</DialogTitle>
                            <DialogDescription>Enter the teacher's information below</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <Input
                                        id="first_name"
                                        value={teacherForm.first_name}
                                        onChange={(e) => setTeacherForm({ ...teacherForm, first_name: e.target.value })}
                                        placeholder="Sarah"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        value={teacherForm.last_name}
                                        onChange={(e) => setTeacherForm({ ...teacherForm, last_name: e.target.value })}
                                        placeholder="Johnson"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={teacherForm.email}
                                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                                    placeholder="sarah.johnson@school.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject Specialization</Label>
                                    <Input
                                        id="subject"
                                        value={teacherForm.subject_specialization}
                                        onChange={(e) => setTeacherForm({ ...teacherForm, subject_specialization: e.target.value })}
                                        placeholder="Mathematics"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={teacherForm.phone_number}
                                        onChange={(e) => setTeacherForm({ ...teacherForm, phone_number: e.target.value })}
                                        placeholder="+254712345678"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddTeacher} style={{ backgroundColor: "var(--fundi-lime)", color: "white" }}>
                                Add Teacher
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Teacher Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit Teacher</DialogTitle>
                            <DialogDescription>Update the teacher's information</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_first_name">First Name</Label>
                                    <Input
                                        id="edit_first_name"
                                        value={teacherForm.first_name}
                                        onChange={(e) => setTeacherForm({ ...teacherForm, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_last_name">Last Name</Label>
                                    <Input
                                        id="edit_last_name"
                                        value={teacherForm.last_name}
                                        onChange={(e) => setTeacherForm({ ...teacherForm, last_name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_email">Email</Label>
                                <Input
                                    id="edit_email"
                                    type="email"
                                    value={teacherForm.email}
                                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_subject">Subject Specialization</Label>
                                    <Input
                                        id="edit_subject"
                                        value={teacherForm.subject_specialization}
                                        onChange={(e) => setTeacherForm({ ...teacherForm, subject_specialization: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_phone">Phone Number</Label>
                                    <Input
                                        id="edit_phone"
                                        value={teacherForm.phone_number}
                                        onChange={(e) => setTeacherForm({ ...teacherForm, phone_number: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditTeacher} style={{ backgroundColor: "var(--fundi-lime)", color: "white" }}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
