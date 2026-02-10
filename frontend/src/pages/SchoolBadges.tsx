import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Award, FileText, Search, ArrowLeft, User, Calendar, Eye
} from "lucide-react";
import { motion } from "framer-motion";

interface Badge {
    id: string;
    student_name: string;
    badge_name: string;
    description: string;
    awarded_date: string;
    awarded_by: string;
}

interface Artifact {
    id: string;
    student_name: string;
    title: string;
    description: string;
    course_name: string;
    submitted_date: string;
    file_type: string;
}

export default function SchoolBadges() {
    const navigate = useNavigate();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual API calls
            // const badgesResponse = await schoolApi.badges.getAll();
            // const artifactsResponse = await schoolApi.artifacts.getAll();

            // Mock data
            setTimeout(() => {
                setBadges([
                    {
                        id: "1",
                        student_name: "John Doe",
                        badge_name: "Quick Learner",
                        description: "Completed module ahead of schedule",
                        awarded_date: "2024-02-05",
                        awarded_by: "Sarah Johnson"
                    },
                    {
                        id: "2",
                        student_name: "Jane Smith",
                        badge_name: "Perfect Attendance",
                        description: "100% attendance for the month",
                        awarded_date: "2024-02-01",
                        awarded_by: "Michael Brown"
                    },
                    {
                        id: "3",
                        student_name: "Mike Johnson",
                        badge_name: "Excellence Award",
                        description: "Outstanding performance in assessments",
                        awarded_date: "2024-01-28",
                        awarded_by: "Sarah Johnson"
                    }
                ]);

                setArtifacts([
                    {
                        id: "1",
                        student_name: "John Doe",
                        title: "Digital Portfolio Website",
                        description: "Personal portfolio showcasing web development skills",
                        course_name: "Digital Literacy Fundamentals",
                        submitted_date: "2024-02-08",
                        file_type: "URL"
                    },
                    {
                        id: "2",
                        student_name: "Jane Smith",
                        title: "Problem Solving Case Study",
                        description: "Analysis of real-world problem solving scenarios",
                        course_name: "Creative Problem Solving",
                        submitted_date: "2024-02-06",
                        file_type: "PDF"
                    },
                    {
                        id: "3",
                        student_name: "Mike Johnson",
                        title: "Presentation Skills Video",
                        description: "Recorded presentation demonstrating communication skills",
                        course_name: "Communication Excellence",
                        submitted_date: "2024-02-03",
                        file_type: "VIDEO"
                    }
                ]);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            setLoading(false);
        }
    };

    const filteredBadges = badges.filter(badge =>
        badge.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        badge.badge_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredArtifacts = artifacts.filter(artifact =>
        artifact.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artifact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artifact.course_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-orange)] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
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
                            Badges & Artifacts
                        </h1>
                        <p className="text-gray-600">View student achievements and submissions</p>
                    </div>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Search by student name, badge, or artifact..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="badges" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="badges">
                            <Award className="h-4 w-4 mr-2" />
                            Badges ({filteredBadges.length})
                        </TabsTrigger>
                        <TabsTrigger value="artifacts">
                            <FileText className="h-4 w-4 mr-2" />
                            Artifacts ({filteredArtifacts.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Badges Tab */}
                    <TabsContent value="badges">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5" style={{ color: "var(--fundi-orange)" }} />
                                    All Badges
                                </CardTitle>
                                <CardDescription>Badges awarded to students</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {filteredBadges.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Award className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                        <p className="text-gray-600 text-lg font-semibold mb-2">No Badges Found</p>
                                        <p className="text-gray-500 text-sm">
                                            {searchTerm ? "Try adjusting your search" : "No badges have been awarded yet"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredBadges.map((badge, index) => (
                                            <motion.div
                                                key={badge.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                            >
                                                <Card className="border-2 hover:shadow-md transition-shadow">
                                                    <CardContent className="p-6 space-y-3">
                                                        <div className="flex items-center justify-center">
                                                            <div className="h-16 w-16 rounded-full flex items-center justify-center"
                                                                style={{ backgroundColor: "var(--fundi-orange)" }}>
                                                                <Award className="h-8 w-8 text-white" />
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <h3 className="font-bold text-lg">{badge.badge_name}</h3>
                                                            <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                                                        </div>
                                                        <div className="pt-3 border-t space-y-2 text-sm">
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <User className="h-4 w-4" />
                                                                <span>{badge.student_name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>{new Date(badge.awarded_date).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                Awarded by {badge.awarded_by}
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Artifacts Tab */}
                    <TabsContent value="artifacts">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" style={{ color: "var(--fundi-lime)" }} />
                                    All Artifacts
                                </CardTitle>
                                <CardDescription>Student work submissions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {filteredArtifacts.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                        <p className="text-gray-600 text-lg font-semibold mb-2">No Artifacts Found</p>
                                        <p className="text-gray-500 text-sm">
                                            {searchTerm ? "Try adjusting your search" : "No artifacts have been submitted yet"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredArtifacts.map((artifact, index) => (
                                            <motion.div
                                                key={artifact.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                            >
                                                <Card className="border-2 hover:shadow-md transition-shadow">
                                                    <CardContent className="p-6">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start gap-4 flex-1">
                                                                <div className="h-12 w-12 rounded-lg flex items-center justify-center"
                                                                    style={{ backgroundColor: "var(--fundi-lime)" }}>
                                                                    <FileText className="h-6 w-6 text-white" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h3 className="font-bold text-lg">{artifact.title}</h3>
                                                                    <p className="text-sm text-gray-600 mt-1">{artifact.description}</p>
                                                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                                                        <span className="flex items-center gap-1">
                                                                            <User className="h-4 w-4" />
                                                                            {artifact.student_name}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span>{artifact.course_name}</span>
                                                                        <span>•</span>
                                                                        <span className="flex items-center gap-1">
                                                                            <Calendar className="h-4 w-4" />
                                                                            {new Date(artifact.submitted_date).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <span className="inline-block px-2 py-1 text-xs font-medium rounded"
                                                                            style={{ backgroundColor: "var(--fundi-lime)", color: "white" }}>
                                                                            {artifact.file_type}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button variant="outline" size="sm">
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
