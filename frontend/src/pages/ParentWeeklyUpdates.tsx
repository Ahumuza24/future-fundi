import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { childApi } from "@/lib/api";
import { Users, Calendar, Heart, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface Child {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    age?: number;
}

interface WeeklyPulse {
    mood: number;
    win: string;
    worry: string;
    created_at: string;
}

export default function ParentWeeklyUpdates() {
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            setLoading(true);
            const response = await childApi.getAll();
            const childrenData = response.data.results || response.data;
            setChildren(Array.isArray(childrenData) ? childrenData : []);
        } catch (err) {
            console.error("Failed to fetch children:", err);
            setChildren([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-[var(--fundi-cyan)] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading updates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 md:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="stagger" style={{ animationDelay: '0ms' }}>
                    <h1 className="heading-font text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--fundi-black)' }}>
                        Weekly Updates
                    </h1>
                    <p className="text-gray-600">Track your children's weekly mood and progress</p>
                </header>

                {children.length === 0 ? (
                    <Card className="text-center p-12">
                        <Calendar className="h-20 w-20 mx-auto mb-6 text-gray-400" />
                        <h2 className="heading-font text-2xl font-bold mb-4" style={{ color: 'var(--fundi-black)' }}>
                            No Children Added Yet
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Add children to see their weekly updates
                        </p>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {children.map((child, index) => (
                            <motion.div
                                key={child.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Card className="border-l-4" style={{ borderLeftColor: 'var(--fundi-cyan)' }}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3">
                                            <div
                                                className="p-3 rounded-full"
                                                style={{ backgroundColor: 'rgba(0, 188, 212, 0.1)' }}
                                            >
                                                <Users className="h-6 w-6" style={{ color: 'var(--fundi-cyan)' }} />
                                            </div>
                                            <div>
                                                <div className="text-xl">{child.full_name}</div>
                                                {child.age && (
                                                    <div className="text-sm text-gray-600 font-normal">
                                                        {child.age} years old
                                                    </div>
                                                )}
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Weekly Mood */}
                                        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Heart className="h-5 w-5" style={{ color: 'var(--fundi-cyan)' }} />
                                                <span className="font-semibold">This Week's Mood</span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                No mood check-in yet this week
                                            </div>
                                        </div>

                                        {/* Weekly Win */}
                                        <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-lime-50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="h-5 w-5" style={{ color: 'var(--fundi-lime)' }} />
                                                <span className="font-semibold">This Week's Win</span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                No wins recorded yet
                                            </div>
                                        </div>

                                        {/* Weekly Worry */}
                                        <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="h-5 w-5" style={{ color: 'var(--fundi-orange)' }} />
                                                <span className="font-semibold">This Week's Concern</span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                No concerns noted
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Info Card */}
                <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2" style={{ borderColor: 'var(--fundi-cyan)' }}>
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div
                                className="p-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: 'var(--fundi-cyan)' }}
                            >
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--fundi-black)' }}>
                                    About Weekly Updates
                                </h3>
                                <p className="text-gray-700">
                                    Weekly updates show your children's mood check-ins, wins, and concerns from their learning journey.
                                    Teachers help students complete these reflections every week to track their emotional well-being and progress.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
