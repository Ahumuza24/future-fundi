import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PathwayProps {
    id: string;
    title: string;
    icon: React.ElementType; // Changed from React.ReactNode
    progress: number;
    status: "good" | "warning" | "critical";
    microCredentialsEarned: number;
    totalMicroCredentials: number;
    currentModule: string;
    color: string;
}

const statusColors = {
    good: "bg-green-100 text-green-700 border-green-200",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
    critical: "bg-red-100 text-red-700 border-red-200",
};

const statusIcon = {
    good: <CheckCircle className="h-4 w-4" />,
    warning: <Clock className="h-4 w-4" />,
    critical: <AlertCircle className="h-4 w-4" />,
};

export const PathwayCard = ({ pathway, onClick }: { pathway: PathwayProps; onClick?: () => void }) => {
    const Icon = pathway.icon;
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "bg-white rounded-xl shadow-sm border p-5 cursor-pointer transition-all hover:shadow-md",
                "flex flex-col gap-4 relative overflow-hidden"
            )}
            onClick={onClick}
        >
            {/* Decorative background accent */}
            <div
                className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 -mr-4 -mt-4"
                style={{ backgroundColor: pathway.color }}
            />

            <div className="flex justify-between items-start z-10">
                <div className="p-2 rounded-lg bg-gray-50 text-gray-700">
                    <Icon className="h-6 w-6" />
                </div>
                <div className={cn("px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border", statusColors[pathway.status])}>
                    {statusIcon[pathway.status]}
                    <span className="capitalize">{pathway.status === 'good' ? 'On Track' : pathway.status === 'warning' ? 'Needs Focus' : 'Behind'}</span>
                </div>
            </div>

            <div className="z-10">
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--fundi-black)' }}>{pathway.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-1">Current: {pathway.currentModule}</p>
            </div>

            <div className="mt-auto space-y-2 z-10">
                <div className="flex justify-between text-xs text-gray-600">
                    <span>{pathway.microCredentialsEarned}/{pathway.totalMicroCredentials} Modules</span>
                    <span>{pathway.progress}%</span>
                </div>
                <Progress value={pathway.progress} className="h-2" indicatorColor={pathway.color} />
            </div>
        </motion.div>
    );
};
