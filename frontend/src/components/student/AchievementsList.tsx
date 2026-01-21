import { useEffect, useState } from "react";
import { Award, Star, Trophy, Zap, Medal, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { achievementApi } from "@/lib/api";

interface Achievement {
    id: string;
    name: string;
    description: string;
    achievement_type: string;
    icon: string;
    course_name?: string;
    level_name?: string;
    earned_at: string;
}

interface AchievementsListProps {
    learnerId?: string;
}

export default function AchievementsList({ learnerId }: AchievementsListProps) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = learnerId
                    ? await achievementApi.getForLearner(learnerId)
                    : await achievementApi.getAll();
                const data = response.data.results || response.data || [];
                setAchievements(data);
            } catch (error) {
                console.error("Failed to fetch achievements:", error);
                // Fallback to static data
                setAchievements([
                    { id: '1', name: "First Steps", description: "Completed 3 modules", achievement_type: 'level_complete', icon: 'star', earned_at: new Date().toISOString() },
                    { id: '2', name: "Tech Whiz", description: "Built 5 artifacts", achievement_type: 'skill_mastery', icon: 'zap', earned_at: new Date().toISOString() },
                    { id: '3', name: "Problem Solver", description: "Solved 10 challenges", achievement_type: 'participation', icon: 'trophy', earned_at: new Date().toISOString() },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [learnerId]);

    const getIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            star: Star,
            zap: Zap,
            trophy: Trophy,
            medal: Medal,
            award: Award,
            target: Target,
        };
        return icons[iconName?.toLowerCase()] || Award;
    };

    const getColor = (type: string, index: number) => {
        const typeColors: Record<string, string> = {
            'level_complete': 'var(--fundi-orange)',
            'course_complete': 'var(--fundi-purple)',
            'skill_mastery': 'var(--fundi-cyan)',
            'participation': 'var(--fundi-lime)',
            'special': 'var(--fundi-pink)',
        };
        const fallbackColors = ['var(--fundi-orange)', 'var(--fundi-cyan)', 'var(--fundi-purple)', 'var(--fundi-lime)'];
        return typeColors[type] || fallbackColors[index % fallbackColors.length];
    };

    if (loading) {
        return (
            <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-orange)" }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100">
                            <Trophy className="h-6 w-6 text-orange-600" />
                        </div>
                        Loading Achievements...
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-orange)" }}>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                        <Trophy className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                        <CardTitle>Achievements Earned</CardTitle>
                        <p className="text-sm text-gray-500">{achievements.length} badges collected</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {achievements.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Medal className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No achievements yet. Keep learning!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {achievements.map((achievement, index) => {
                            const Icon = getIcon(achievement.icon);
                            const color = getColor(achievement.achievement_type, index);

                            return (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex flex-col items-center text-center p-3 rounded-xl border-2 border-gray-100 hover:shadow-md hover:border-orange-100 transition-all bg-white"
                                >
                                    <div
                                        className="p-3 rounded-full mb-2"
                                        style={{ backgroundColor: `${color}20` }}
                                    >
                                        <Icon className="h-6 w-6" style={{ color }} />
                                    </div>
                                    <h4 className="font-bold text-sm mb-1">{achievement.name}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2">{achievement.description}</p>
                                    {achievement.course_name && (
                                        <p className="text-xs text-gray-400 mt-1">{achievement.course_name}</p>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
