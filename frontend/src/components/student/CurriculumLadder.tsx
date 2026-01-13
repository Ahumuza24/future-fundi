import { motion } from "framer-motion";
import { CheckCircle, Lock, Star, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CurriculumLadder() {
    const levels = [
        { id: 1, title: "Curiosity", description: "Discovering new ideas", status: "completed", color: "var(--fundi-orange)" },
        { id: 2, title: "Explorer", description: "Asking questions", status: "completed", color: "var(--fundi-cyan)" },
        { id: 3, title: "Builder", description: "Creating solutions", status: "current", color: "var(--fundi-purple)" },
        { id: 4, title: "Innovator", description: "Improving designs", status: "locked", color: "var(--fundi-lime)" },
        { id: 5, title: "Master", description: "Leading others", status: "locked", color: "var(--fundi-pink)" },
    ];

    return (
        <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-purple)" }}>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <CardTitle>Curriculum Ladder</CardTitle>
                        <p className="text-sm text-gray-500">Your friendly pathway direction</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-6 bottom-6 w-1 bg-gray-200" />

                    <div className="space-y-8">
                        {levels.map((level, index) => {
                            const isCompleted = level.status === "completed";
                            const isCurrent = level.status === "current";
                            const isLocked = level.status === "locked";

                            return (
                                <motion.div
                                    key={level.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative flex items-center gap-4"
                                >
                                    {/* Icon Node */}
                                    <div
                                        className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-4 transition-all ${isCompleted ? "bg-white border-[var(--fundi-green)] text-green-600" :
                                                isCurrent ? "bg-white border-[var(--fundi-purple)] text-purple-600 scale-125 shadow-lg" :
                                                    "bg-gray-100 border-gray-300 text-gray-400"
                                            }`}
                                        style={{
                                            borderColor: isCompleted ? level.color : isCurrent ? level.color : undefined,
                                            color: isCompleted ? level.color : isCurrent ? level.color : undefined
                                        }}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : isCurrent ? (
                                            <Star className="h-5 w-5 fill-current" />
                                        ) : (
                                            <Lock className="h-4 w-4" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className={`flex-1 p-4 rounded-xl border-2 transition-all ${isCurrent ? "bg-purple-50 border-purple-200 shadow-md" :
                                            isLocked ? "bg-gray-50 border-transparent opacity-60" :
                                                "bg-white border-transparent hover:border-gray-200"
                                        }`}>
                                        <div className="flex justify-between items-center">
                                            <h3 className={`font-bold ${isCurrent ? "text-lg" : "text-base"}`} style={{ color: isLocked ? 'gray' : level.color }}>
                                                {level.title}
                                            </h3>
                                            {isCurrent && (
                                                <span className="text-xs font-bold px-2 py-1 bg-purple-200 text-purple-800 rounded-full">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{level.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
