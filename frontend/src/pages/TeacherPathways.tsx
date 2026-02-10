import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { moduleApi } from "@/lib/api";
import {
    Award,
    ArrowLeft,
    Loader2,
    Target,
    FileText,
    CheckCircle,
    Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

interface Module {
    id: string;
    name: string;
    description: string;
    content: string;
    suggested_activities: string[];
    materials: string[];
    competences: string[];
    media_files: Array<{ type: string; url: string; name: string }>;
    badge_name: string;
    course_name?: string;
}

export default function TeacherPathways() {
    const navigate = useNavigate();
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const modulesRes = await moduleApi.getAll();

            // Ensure we always have an array
            const modulesData = Array.isArray(modulesRes.data)
                ? modulesRes.data
                : (modulesRes.data?.results || []);

            setModules(modulesData);
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setModules([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: "var(--fundi-cyan)" }} />
                    <p className="text-gray-600">Loading modules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 md:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Button
                                variant="ghost"
                                onClick={() => navigate("/teacher")}
                                className="p-2"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: "var(--fundi-black)" }}>
                                My Modules
                            </h1>
                        </div>
                        <p className="text-gray-600 ml-14">Micro-credentials assigned to you</p>
                    </div>
                </header>

                {/* Stats */}
                <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Modules</p>
                                <p className="text-3xl font-bold" style={{ color: "var(--fundi-purple)" }}>
                                    {modules.length}
                                </p>
                            </div>
                            <Award className="h-10 w-10" style={{ color: "var(--fundi-purple)", opacity: 0.2 }} />
                        </div>
                    </CardContent>
                </Card>

                {/* Modules List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-6 w-6" style={{ color: "var(--fundi-purple)" }} />
                            Micro-Credentials
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {modules.length === 0 ? (
                            <div className="text-center py-12">
                                <Award className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600 text-lg">No modules assigned yet</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    Modules will appear here when assigned to you
                                </p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {modules.map((module, index) => (
                                    <motion.div
                                        key={module.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <Card className="hover:shadow-lg transition-shadow border-2 h-full flex flex-col">
                                            <CardHeader className="flex-1">
                                                <CardTitle className="text-lg mb-2">{module.name}</CardTitle>
                                                <CardDescription className="line-clamp-2">
                                                    {module.description}
                                                </CardDescription>
                                                {module.badge_name && (
                                                    <div className="mt-2">
                                                        <Badge variant="outline" className="gap-1">
                                                            <Sparkles className="h-3 w-3" />
                                                            {module.badge_name}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </CardHeader>
                                            <CardContent>
                                                <Button
                                                    onClick={() => setSelectedModule(module)}
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    View Details
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Module Details Dialog */}
            <Dialog open={!!selectedModule} onOpenChange={() => setSelectedModule(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <Award className="h-6 w-6" style={{ color: "var(--fundi-purple)" }} />
                            {selectedModule?.name}
                        </DialogTitle>
                        {selectedModule?.badge_name && (
                            <Badge className="w-fit mt-2" style={{ backgroundColor: "var(--fundi-orange)", color: "white" }}>
                                <Sparkles className="h-3 w-3 mr-1" />
                                Earns: {selectedModule.badge_name}
                            </Badge>
                        )}
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {/* Description */}
                        <div>
                            <h3 className="font-bold mb-2">Description</h3>
                            <p className="text-gray-700">{selectedModule?.description}</p>
                        </div>

                        {/* Content */}
                        {selectedModule?.content && (
                            <div>
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    <FileText className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                                    Content
                                </h3>
                                <div className="prose prose-sm max-w-none bg-gray-50 rounded p-4">
                                    <p className="whitespace-pre-wrap">{selectedModule.content}</p>
                                </div>
                            </div>
                        )}

                        {/* Suggested Activities */}
                        {selectedModule?.suggested_activities && selectedModule.suggested_activities.length > 0 && (
                            <div>
                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                    <Target className="h-5 w-5" style={{ color: "var(--fundi-lime)" }} />
                                    Suggested Activities
                                </h3>
                                <ul className="space-y-2">
                                    {selectedModule.suggested_activities.map((activity, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "var(--fundi-lime)" }} />
                                            <span>{activity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Materials */}
                        {selectedModule?.materials && selectedModule.materials.length > 0 && (
                            <div>
                                <h3 className="font-bold mb-2">Materials Needed</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedModule.materials.map((material, idx) => (
                                        <Badge key={idx} variant="outline">
                                            {material}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Competences */}
                        {selectedModule?.competences && selectedModule.competences.length > 0 && (
                            <div>
                                <h3 className="font-bold mb-2">Competences Developed</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedModule.competences.map((competence, idx) => (
                                        <Badge key={idx} style={{ backgroundColor: "var(--fundi-purple)", color: "white" }}>
                                            {competence}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Media Files */}
                        {selectedModule?.media_files && selectedModule.media_files.length > 0 && (
                            <div>
                                <h3 className="font-bold mb-2">Media Resources</h3>
                                <div className="grid md:grid-cols-2 gap-2">
                                    {selectedModule.media_files.map((media, idx) => (
                                        <a
                                            key={idx}
                                            href={media.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 transition-colors"
                                        >
                                            <FileText className="h-5 w-5" style={{ color: "var(--fundi-cyan)" }} />
                                            <span className="text-sm">{media.name || `${media.type} file`}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
