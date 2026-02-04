import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12",
    };

    return (
        <div className="flex justify-center items-center p-4">
            <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
        </div>
    );
};

export const FullPageLoader = () => (
    <div className="min-h-screen flex justify-center items-center bg-gray-50/50">
        <LoadingSpinner size="lg" />
    </div>
);
