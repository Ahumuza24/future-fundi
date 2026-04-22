import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { schoolApi } from "@/lib/api";
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

interface TeacherFormState {
    first_name: string;
    last_name: string;
    email: string;
    subject_specialization: string;
    phone_number: string;
}

const EMPTY_FORM: TeacherFormState = {
    first_name: "",
    last_name: "",
    email: "",
    subject_specialization: "",
    phone_number: "",
};

export default function SchoolTeachers(): JSX.Element {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(
        searchParams.get("action") === "add"
    );
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [teacherForm, setTeacherForm] = useState<TeacherFormState>(EMPTY_FORM);

    /* ── Fetch teachers ─────────────────────────────────────────────────────── */
    const { data: teachers = [], isLoading, isError } = useQuery<Teacher[]>({
        queryKey: ["school-teachers"],
        queryFn: async (): Promise<Teacher[]> => {
            const res = await schoolApi.teachers.getAll();
            return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        },
    });

    /* ── Add teacher ────────────────────────────────────────────────────────── */
    const addMutation = useMutation({
        mutationFn: (data: TeacherFormState) => schoolApi.teachers.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["school-teachers"] });
            setIsAddDialogOpen(false);
            setTeacherForm(EMPTY_FORM);
            toast.success("Teacher added successfully!", "Saved");
        },
        onError: () => {
            toast.error("Failed to add teacher. Please try again.", "Save Failed");
        },
    });

    /* ── Update teacher ─────────────────────────────────────────────────────── */
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: TeacherFormState }) =>
            schoolApi.teachers.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["school-teachers"] });
            setIsEditDialogOpen(false);
            setSelectedTeacher(null);
            setTeacherForm(EMPTY_FORM);
            toast.success("Teacher updated successfully!", "Saved");
        },
        onError: () => {
            toast.error("Failed to update teacher. Please try again.", "Update Failed");
        },
    });

    /* ── Delete teacher ─────────────────────────────────────────────────────── */
    const deleteMutation = useMutation({
        mutationFn: (id: string) => schoolApi.teachers.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["school-teachers"] });
            toast.success("Teacher deleted successfully!", "Deleted");
        },
        onError: () => {
            toast.error("Failed to delete teacher. Please try again.", "Delete Failed");
        },
    });

    const openEditDialog = (teacher: Teacher): void => {
        setSelectedTeacher(teacher);
        setTeacherForm({
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            email: teacher.email,
            subject_specialization: teacher.subject_specialization,
            phone_number: teacher.phone_number,
        });
        setIsEditDialogOpen(true);
    };

    const handleDeleteTeacher = (teacherId: string): void => {
        if (!confirm("Are you sure you want to delete this teacher?")) return;
        deleteMutation.mutate(teacherId);
    };

    const filteredTeachers = teachers.filter((teacher) =>
        teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.subject_specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isMutating =
        addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-12 w-12 border-4 border-fundi-lime border-t-transparent rounded-full" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <GraduationCap className="h-16 w-16 text-gray-400" />
                <p className="text-gray-600 text-lg font-semibold">Failed to load teachers</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["school-teachers"] })}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/school")}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="heading-font text-3xl md:text-4xl font-bold text-fundi-black">
                                Teacher Management
                            </h1>
                            <p className="text-gray-600">Manage your school's teachers</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-fundi-lime text-white flex items-center gap-2"
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
                            <GraduationCap className="h-5 w-5 text-fundi-lime" />
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
                                                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-fundi-lime">
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
                                                            disabled={isMutating}
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
                                    <Label htmlFor="first_name">Sir Name</Label>
                                    <Input
                                        id="first_name"
                                        value={teacherForm.first_name}
                                        onChange={(e) => setTeacherForm({ ...teacherForm, first_name: e.target.value })}
                                        placeholder="Sarah"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Other Name</Label>
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
                            <Button
                                onClick={() => addMutation.mutate(teacherForm)}
                                className="bg-fundi-lime text-white"
                                disabled={addMutation.isPending}
                            >
                                {addMutation.isPending ? "Saving..." : "Add Teacher"}
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
                                    <Label htmlFor="edit_first_name">Sir Name</Label>
                                    <Input
                                        id="edit_first_name"
                                        value={teacherForm.first_name}
                                        onChange={(e) => setTeacherForm({ ...teacherForm, first_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_last_name">Other Name</Label>
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
                            <Button
                                onClick={() => {
                                    if (selectedTeacher) {
                                        updateMutation.mutate({ id: selectedTeacher.id, data: teacherForm });
                                    }
                                }}
                                className="bg-fundi-lime text-white"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
