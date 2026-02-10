import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    BookOpen, Search, ArrowLeft, Users, Award, Clock
} from "lucide-react";
import { motion } from "framer-motion";

interface Pathway {
    id: string;
    name: string;
    description: string;
    total_levels: number;
    enrolled_students: number;
    completion_rate: number;
    duration_weeks: number;
}

export default function SchoolPathways() {
    const navigate = useNavigate();
    const [pathways, setPathways] = useState<Pathway[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchPathways();
    }, []);

    const fetchPathways = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual API call
            // const response = await schoolApi.pathways.getAll();
            // setPathways(response.data);

            // Mock data
            setTimeout(() => {
                setPathways([
                    {
                        id: "1",
                        name: "Digital Literacy Fundamentals",
                        description: "Master essential digital skills for the modern world",
                        total_levels: 5,
                        enrolled_students: 45,
                        completion_rate: 78,
                        duration_weeks: 12
                    },
                    {
                        id: "2",
                        name: "Creative Problem Solving",
                        description: "Develop critical thinking and innovation skills",
                        total_levels: 4,
                        enrolled_students: 38,
                        completion_rate: 85,
                        duration_weeks: 8
                    },
                    {
                        id: "3",
                        name: "Communication Excellence",
                        description: "Build effective communication and presentation skills",
                        total_levels: 3,
                        enrolled_students: 52,
                        completion_rate: 92,
                        duration_weeks: 6
                    }
                ]);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error("Failed to fetch pathways:", error);
            setLoading(false);
        }
    };

    const filteredPathways = pathways.filter(pathway =>
        pathway.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pathway.description.toLowerCase().includes(searchTerm.toLowerCase())
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
                            Microcredentials
                        </h1>
                        <p className="text-gray-600">Available pathways and courses for your students</p>
                    </div>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Search microcredentials..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Pathways Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPathways.map((pathway, index) => (
                        <motion.div
                            key={pathway.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <Card className="border-2 hover:shadow-lg transition-shadow h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" style={{ color: "var(--fundi-orange)" }} />
                                        {pathway.name}
                                    </CardTitle>
                                    <CardDescription>{pathway.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                            <p className="text-2xl font-bold" style={{ color: "var(--fundi-purple)" }}>
                                                {pathway.total_levels}
                                            </p>
                                            <p className="text-xs text-gray-600">Levels</p>
                                        </div>
                                        <div className="text-center p-3 bg-cyan-50 rounded-lg">
                                            <p className="text-2xl font-bold" style={{ color: "var(--fundi-cyan)" }}>
                                                {pathway.enrolled_students}
                                            </p>
                                            <p className="text-xs text-gray-600">Students</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-1 text-gray-600">
                                                <Award className="h-4 w-4" />
                                                Completion Rate
                                            </span>
                                            <span className="font-semibold">{pathway.completion_rate}%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-1 text-gray-600">
                                                <Clock className="h-4 w-4" />
                                                Duration
                                            </span>
                                            <span className="font-semibold">{pathway.duration_weeks} weeks</span>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => navigate(`/school/pathways/${pathway.id}`)}
                                    >
                                        View Details
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {filteredPathways.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 text-lg font-semibold mb-2">No Microcredentials Found</p>
                            <p className="text-gray-500 text-sm">
                                {searchTerm ? "Try adjusting your search" : "No pathways available"}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
