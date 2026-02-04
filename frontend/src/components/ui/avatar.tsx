import { useState } from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface AvatarProps {
    src?: string | null;
    name?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
    showFallback?: boolean;
    style?: "initials" | "bottts" | "shapes" | "thumbs" | "avataaars" | "fun-emoji";
}

const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-20 h-20 text-2xl",
};

const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-10 h-10",
};

// Generate a consistent color based on name
function getColorFromName(name: string): string {
    const colors = [
        "var(--fundi-cyan)",
        "var(--fundi-orange)",
        "var(--fundi-purple)",
        "var(--fundi-lime)",
        "var(--fundi-pink)",
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

// Get initials from name
function getInitials(name: string): string {
    if (!name) return "?";

    const parts = name.trim().split(" ");
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (
        parts[0].charAt(0).toUpperCase() +
        parts[parts.length - 1].charAt(0).toUpperCase()
    );
}

// Generate DiceBear avatar URL
function generateAvatarUrl(name: string, style: string = "avataaars"): string {
    // DiceBear API - generates consistent avatars based on seed (name)
    const seed = encodeURIComponent(name || "user");

    // Available styles: avataaars, bottts, fun-emoji, thumbs, shapes, lorelei, notionists
    // Using avataaars for a human-like profile look
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function Avatar({
    src,
    name = "",
    size = "md",
    className,
    showFallback = true,
    style = "avataaars" // Default avatar style
}: AvatarProps) {
    const [imageError, setImageError] = useState(false);

    // Priority: 1. Uploaded avatar, 2. Generated avatar, 3. Initials
    const hasUploadedAvatar = src && !imageError;
    const generatedAvatarUrl = generateAvatarUrl(name || "user", style);
    const initials = getInitials(name);
    const backgroundColor = getColorFromName(name || "user");

    // Use uploaded avatar, or fall back to generated avatar
    const displayImage = hasUploadedAvatar ? src : generatedAvatarUrl;

    return (
        <div
            className={cn(
                "relative rounded-full overflow-hidden flex items-center justify-center font-bold text-white shrink-0",
                sizeClasses[size],
                className
            )}
            style={{
                backgroundColor: "transparent"
            }}
        >
            {displayImage ? (
                <img
                    src={displayImage}
                    alt={name || "User avatar"}
                    className="w-full h-full object-cover"
                    onError={() => {
                        if (hasUploadedAvatar) {
                            setImageError(true);
                        }
                    }}
                />
            ) : showFallback ? (
                <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor }}
                >
                    {initials ? (
                        <span>{initials}</span>
                    ) : (
                        <User className={cn("text-white/80", iconSizes[size])} />
                    )}
                </div>
            ) : (
                <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor }}
                >
                    <User className={cn("text-white/80", iconSizes[size])} />
                </div>
            )}
        </div>
    );
}

// Avatar with edit overlay
interface EditableAvatarProps extends AvatarProps {
    onUpload?: (file: File) => void;
    uploading?: boolean;
}

export function EditableAvatar({
    src,
    name,
    size = "xl",
    className,
    onUpload,
    uploading = false,
    style = "avataaars",
}: EditableAvatarProps) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onUpload) {
            onUpload(file);
        }
    };

    return (
        <div className="relative inline-block group">
            <Avatar src={src} name={name} size={size} className={className} style={style} />

            {onUpload && (
                <>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="avatar-upload"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="avatar-upload"
                        className={cn(
                            "absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
                            uploading && "opacity-100 cursor-wait"
                        )}
                    >
                        {uploading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <span className="text-white text-xs font-medium">
                                {src ? "Change" : "Upload"}
                            </span>
                        )}
                    </label>
                </>
            )}
        </div>
    );
}

export default Avatar;
