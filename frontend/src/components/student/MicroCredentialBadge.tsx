import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Award, Lock } from "lucide-react";

interface MicroCredentialProps {
    id: string;
    name: string;
    pathway: string;
    earnedDate?: string;
    isLocked?: boolean;
    icon?: React.ReactNode;
    color: string;
}

export const MicroCredentialBadge = ({ credential }: { credential: MicroCredentialProps }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl border border-dashed min-w-[100px] text-center transition-colors",
                credential.isLocked ? "bg-gray-50 border-gray-200 opacity-70" : "bg-white border-blue-100 shadow-sm hover:border-blue-300"
            )}
        >
            <div
                className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm mb-1",
                    credential.isLocked ? "bg-gray-200 text-gray-400" : ""
                )}
                style={{ backgroundColor: credential.isLocked ? undefined : credential.color }}
            >
                {credential.isLocked ? <Lock className="h-5 w-5" /> : (credential.icon || <Award className="h-6 w-6" />)}
            </div>

            <div className="space-y-0.5">
                <p className="text-xs font-bold leading-tight line-clamp-2 max-w-[100px]" style={{ color: 'var(--fundi-black)' }}>
                    {credential.name}
                </p>
                <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{credential.pathway}</p>
            </div>
        </motion.div>
    );
};
