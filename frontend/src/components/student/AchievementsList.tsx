import { Award, Star, Trophy, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function AchievementsList() {
    const achievements = [
        { id: 1, title: "First Steps", description: "Completed 3 modules", icon: Star, color: "var(--fundi-orange)", earned: true },
        { id: 2, title: "Tech Whiz", description: "Built 5 artifacts", icon: Zap, color: "var(--fundi-cyan)", earned: true },
        { id: 3, title: "Problem Solver", description: "Solved 10 challenges", icon: Trophy, color: "var(--fundi-purple)", earned: true },
        { id: 4, title: "Team Player", description: "Collaborated in 3 sessions", icon: Award, color: "var(--fundi-lime)", earned: false },
    ];

    return (
        <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-orange)" }}>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                        <Trophy className="h-6 w-6 text-orange-600" />
                    </div>
                    <CardTitle>Achievements Earned</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {achievements.map((achievement, index) => {
                        const Icon = achievement.icon;
                        return (
                            <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={`flex flex-col items-center text-center p-3 rounded-xl border-2 transition-all ${achievement.earned
                                        ? "bg-white border-gray-100 hover:shadow-md hover:border-orange-100"
                                        : "bg-gray-50 border-transparent opacity-50 grayscale"
                                    }`}
                            >
                                <div
                                    className="p-3 rounded-full mb-2"
                                    style={{ backgroundColor: achievement.earned ? `${achievement.color}20` : '#e5e7eb' }}
                                >
                                    <Icon className="h-6 w-6" style={{ color: achievement.earned ? achievement.color : '#9ca3af' }} />
                                </div>
                                <h4 className="font-bold text-sm mb-1">{achievement.title}</h4>
                                <p className="text-xs text-gray-500">{achievement.description}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
