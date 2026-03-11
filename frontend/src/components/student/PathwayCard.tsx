import { motion } from "framer-motion";
import type { ReactElement } from "react";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, AlertCircle, CheckCircle, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PathwayProps {
    id: string;
    title: string;
    icon: React.ElementType;
    progress: number;
    status: "not_started" | "good" | "warning" | "critical";
    microCredentialsEarned: number;
    totalMicroCredentials: number;
    currentModule: string;   // current level name (microcredential)
    currentLevel: string;    // current level label
    totalLevels: number;
    color: string;
}

const statusConfig: Record<PathwayProps["status"], { badge: string; icon: ReactElement; label: string }> = {
    not_started: {
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        icon: <Clock className="h-3 w-3" />,
        label: "Not Started",
    },
    good: {
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <CheckCircle className="h-3 w-3" />,
        label: "On Track",
    },
    warning: {
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        icon: <Clock className="h-3 w-3" />,
        label: "Needs Focus",
    },
    critical: {
        badge: "bg-red-100 text-red-700 border-red-200",
        icon: <AlertCircle className="h-3 w-3" />,
        label: "Behind",
    },
};

export const PathwayCard = ({ pathway, onClick }: { pathway: PathwayProps; onClick?: () => void }) => {
    const Icon = pathway.icon;
    const cfg = statusConfig[pathway.status];

    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.12)" }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer transition-all duration-200 overflow-hidden flex flex-col"
            onClick={onClick}
        >
            {/* Coloured top bar */}
            <div className="h-1.5 w-full" style={{ backgroundColor: pathway.color }} />

            <div className="p-5 flex flex-col gap-4 flex-1">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                    <div
                        className="p-2.5 rounded-xl"
                        style={{ backgroundColor: `${pathway.color}20` }}
                    >
                        <Icon className="h-5 w-5" style={{ color: pathway.color }} />
                    </div>
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 border", cfg.badge)}>
                        {cfg.icon}
                        {cfg.label}
                    </span>
                </div>

                {/* Pathway title */}
                <div className="flex-1">
                    <h3 className="font-bold text-base leading-tight text-gray-900 mb-2">{pathway.title}</h3>

                    {/* Current microcredential chip */}
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 w-fit max-w-full">
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="text-xs text-gray-600 font-medium truncate">
                            {pathway.currentModule || "Starting soon"}
                        </span>
                    </div>
                </div>

                {/* Progress footer */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span className="font-medium">{pathway.microCredentialsEarned}/{pathway.totalMicroCredentials} modules</span>
                        <span className="font-bold" style={{ color: pathway.color }}>{pathway.progress}%</span>
                    </div>
                    <Progress value={pathway.progress} className="h-1.5" indicatorColor={pathway.color} />
                </div>

                {/* CTA */}
                <div
                    className="flex items-center justify-between text-xs font-semibold pt-1"
                    style={{ color: pathway.color }}
                >
                    <span>{pathway.progress === 0 ? "Begin pathway" : "Continue"}</span>
                    <ChevronRight className="h-4 w-4" />
                </div>
            </div>
        </motion.div>
    );
};
