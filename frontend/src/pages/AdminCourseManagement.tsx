import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { courseApi } from "@/lib/api";
import {
    Plus, Edit, Trash2, BookOpen, Users, Layers,
    ChevronDown, ChevronUp, Save, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Level {
    id?: string;
    name: string;
    description: string;
    learning_outcomes: string[];
    required_modules_count: number;
    required_artifacts_count: number;
    required_assessment_score: number;
}

interface Course {
    id: string;
    name: string;
    description: string;
    domain: string;
    domain_display: string;
    min_age: number;
    max_age: number;
    level_count: number;
    is_active: boolean;
    levels?: Level[];
}

const DOMAIN_OPTIONS = [
    { value: 'robotics', label: 'Robotics' },
    { value: 'coding', label: 'Coding' },
    { value: '3d_printing', label: '3D Printing' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'ai_ml', label: 'AI & Machine Learning' },
    { value: 'design', label: 'Design & Fabrication' },
];

export default function AdminCourseManagement() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_editingCourse, _setEditingCourse] = useState<Course | null>(null);
    const [showNewCourseForm, setShowNewCourseForm] = useState(false);
    const [newCourse, setNewCourse] = useState({
        name: '',
        description: '',
        domain: 'robotics',
        min_age: 6,
        max_age: 12,
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await courseApi.getAll();
            const data = response.data.results || response.data || [];
            setCourses(data);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async () => {
        try {
            await courseApi.create({
                ...newCourse,
                levels: [
                    { name: "Level 1: Foundations", description: "Getting started", required_modules_count: 4, required_artifacts_count: 4, required_assessment_score: 60 },
                    { name: "Level 2: Explorer", description: "Building skills", required_modules_count: 4, required_artifacts_count: 5, required_assessment_score: 65 },
                    { name: "Level 3: Builder", description: "Creating projects", required_modules_count: 5, required_artifacts_count: 6, required_assessment_score: 70 },
                    { name: "Level 4: Master", description: "Advanced work", required_modules_count: 5, required_artifacts_count: 6, required_assessment_score: 75 },
                ]
            });
            setShowNewCourseForm(false);
            setNewCourse({ name: '', description: '', domain: 'robotics', min_age: 6, max_age: 12 });
            fetchCourses();
        } catch (error) {
            console.error("Failed to create course:", error);
        }
    };

    const handleDeleteCourse = async (id: string) => {
        if (!confirm("Are you sure you want to delete this course?")) return;
        try {
            await courseApi.delete(id);
            fetchCourses();
        } catch (error) {
            console.error("Failed to delete course:", error);
        }
    };

    const toggleExpanded = async (courseId: string) => {
        if (expandedCourse === courseId) {
            setExpandedCourse(null);
        } else {
            setExpandedCourse(courseId);
            // Fetch full course details with levels
            try {
                const response = await courseApi.getById(courseId);
                setCourses(prev => prev.map(c => c.id === courseId ? response.data : c));
            } catch (error) {
                console.error("Failed to fetch course details:", error);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-gray-200 rounded w-1/3" />
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
                        ))}
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
                        <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: 'var(--fundi-black)' }}>
                            Course Management
                        </h1>
                        <p className="text-gray-600">Create and manage courses and their levels</p>
                    </div>
                    <Button
                        onClick={() => setShowNewCourseForm(true)}
                        style={{ backgroundColor: 'var(--fundi-orange)', color: 'white' }}
                        className="gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Create Course
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-orange)' }}>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription>Total Courses</CardDescription>
                            <CardTitle className="text-3xl mono-font">{courses.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-cyan)' }}>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription>Active Courses</CardDescription>
                            <CardTitle className="text-3xl mono-font">{courses.filter(c => c.is_active).length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-purple)' }}>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription>Total Levels</CardDescription>
                            <CardTitle className="text-3xl mono-font">{courses.reduce((sum, c) => sum + c.level_count, 0)}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-lime)' }}>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription>Domains</CardDescription>
                            <CardTitle className="text-3xl mono-font">{new Set(courses.map(c => c.domain)).size}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* New Course Form */}
                <AnimatePresence>
                    {showNewCourseForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <Card className="border-2 border-orange-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Plus className="h-5 w-5" style={{ color: 'var(--fundi-orange)' }} />
                                        Create New Course
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Course Name</Label>
                                            <Input
                                                value={newCourse.name}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCourse({ ...newCourse, name: e.target.value })}
                                                placeholder="e.g., Robotics Foundations"
                                            />
                                        </div>
                                        <div>
                                            <Label>Domain</Label>
                                            <select
                                                value={newCourse.domain}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCourse({ ...newCourse, domain: e.target.value })}
                                                className="w-full h-10 px-3 border rounded-md"
                                            >
                                                {DOMAIN_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            value={newCourse.description}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCourse({ ...newCourse, description: e.target.value })}
                                            placeholder="Course description..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Minimum Age</Label>
                                            <Input
                                                type="number"
                                                value={newCourse.min_age}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCourse({ ...newCourse, min_age: parseInt(e.target.value) })}
                                                min={6}
                                                max={18}
                                            />
                                        </div>
                                        <div>
                                            <Label>Maximum Age</Label>
                                            <Input
                                                type="number"
                                                value={newCourse.max_age}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCourse({ ...newCourse, max_age: parseInt(e.target.value) })}
                                                min={6}
                                                max={18}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" onClick={() => setShowNewCourseForm(false)}>
                                            <X className="h-4 w-4 mr-1" /> Cancel
                                        </Button>
                                        <Button onClick={handleCreateCourse} style={{ backgroundColor: 'var(--fundi-orange)', color: 'white' }}>
                                            <Save className="h-4 w-4 mr-1" /> Create Course
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Course List */}
                <div className="space-y-4">
                    {courses.map((course) => (
                        <Card key={course.id} className="overflow-hidden">
                            <CardHeader
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleExpanded(course.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="p-3 rounded-lg"
                                            style={{ backgroundColor: 'rgba(240, 87, 34, 0.1)' }}
                                        >
                                            <BookOpen className="h-6 w-6" style={{ color: 'var(--fundi-orange)' }} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">{course.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-4">
                                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                                                    {course.domain_display}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" /> Ages {course.min_age}-{course.max_age}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Layers className="h-3 w-3" /> {course.level_count} Levels
                                                </span>
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        {expandedCourse === course.id ? (
                                            <ChevronUp className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <AnimatePresence>
                                {expandedCourse === course.id && course.levels && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                    >
                                        <CardContent className="border-t bg-gray-50">
                                            <h4 className="font-bold mb-4 text-gray-700">Course Levels</h4>
                                            <div className="space-y-3">
                                                {course.levels.map((level, index) => (
                                                    <div
                                                        key={level.id || index}
                                                        className="p-4 bg-white rounded-lg border flex items-center justify-between"
                                                    >
                                                        <div>
                                                            <h5 className="font-bold">Level {index + 1}: {level.name}</h5>
                                                            <p className="text-sm text-gray-600">{level.description}</p>
                                                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                                                <span>{level.required_modules_count} modules</span>
                                                                <span>{level.required_artifacts_count} artifacts</span>
                                                                <span>{level.required_assessment_score}% score required</span>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    ))}
                </div>

                {courses.length === 0 && (
                    <Card className="text-center py-12">
                        <CardContent>
                            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-bold text-gray-600 mb-2">No Courses Yet</h3>
                            <p className="text-gray-500 mb-4">Create your first course to get started</p>
                            <Button
                                onClick={() => setShowNewCourseForm(true)}
                                style={{ backgroundColor: 'var(--fundi-orange)', color: 'white' }}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Create Course
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
