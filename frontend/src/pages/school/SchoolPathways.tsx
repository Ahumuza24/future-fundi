import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, ArrowLeft, School } from "lucide-react";
import { schoolApi } from "@/lib/api";

interface Pathway {
    id: string;
    name: string;
    description: string;
    careers: { id: string; title: string }[];
    level_count: number;
}

export default function SchoolPathways() {
    const navigate = useNavigate();
    const [pathways, setPathways] = useState<Pathway[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPathways = async () => {
            try {
                const response = await schoolApi.pathways.getAll();
                const pData = Array.isArray(response.data)
                    ? response.data
                    : (response.data.results || []);
                setPathways(pData);
            } catch (error) {
                console.error("Failed to fetch pathways:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPathways();
    }, []);

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
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/school")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="heading-font text-3xl md:text-4xl font-bold" style={{ color: "var(--fundi-black)" }}>
                            School Pathways
                        </h1>
                        <p className="text-gray-600">View available learning tracks and career paths</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pathways.map((p) => (
                        <Card key={p.id} className="hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[var(--fundi-lime)]">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle>{p.name}</CardTitle>
                                    <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full whitespace-nowrap">
                                        {p.level_count} Levels
                                    </span>
                                </div>
                                <CardDescription className="line-clamp-3">{p.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Career Paths</p>
                                <div className="flex flex-wrap gap-2">
                                    {p.careers && p.careers.length > 0 ? (
                                        p.careers.map((c) => (
                                            <span key={c.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                {c.title}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs italic text-gray-400">General Foundations</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {pathways.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No pathways found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
