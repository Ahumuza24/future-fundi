import { ArrowRight, Lightbulb, PlayCircle, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SuggestedActivities() {
    const activities = [
        {
            id: 1,
            title: "Advanced Robotics Logic",
            type: "Module",
            duration: "30 min",
            icon: PlayCircle,
            color: "var(--fundi-cyan)"
        },
        {
            id: 2,
            title: "Reflect on 'Builder' Phase",
            type: "Task",
            duration: "10 min",
            icon: BookOpen,
            color: "var(--fundi-purple)"
        },
    ];

    return (
        <Card className="border-l-4" style={{ borderLeftColor: "var(--fundi-cyan)" }}>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-100">
                        <Lightbulb className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div>
                        <CardTitle>Suggested Next Activities</CardTitle>
                        <p className="text-sm text-gray-500">Handpicked for you based on your progress</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {activities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                        <div
                            key={activity.id}
                            className="flex items-center justify-between p-4 rounded-xl border hover:border-cyan-200 hover:bg-cyan-50 transition-colors group cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="p-3 rounded-full bg-white shadow-sm"
                                    style={{ color: activity.color }}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{activity.title}</h4>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium">{activity.type}</span>
                                        <span>{activity.duration}</span>
                                    </div>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                Start <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
