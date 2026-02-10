import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "cyan" | "orange" | "lime" | "purple"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"



    // Fallback for default shadcn colors if variables aren't defined globally as tailwind classes
    // But given standard setup, bg-primary etc should work if tailwind is configured.
    // I'll stick to simple classes that match Button if possible.

    // Re-defining standard variants to be safe with "fundi" theme or safe fallbacks
    const safeVariants = {
        default: "border-transparent bg-[var(--fundi-black)] text-white hover:bg-[var(--fundi-black)]/80",
        secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
        destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "text-gray-950 border-gray-200",
        cyan: "border-transparent bg-[var(--fundi-cyan)] text-white hover:opacity-90",
        orange: "border-transparent bg-[var(--fundi-orange)] text-white hover:opacity-90",
        lime: "border-transparent bg-[var(--fundi-lime)] text-[var(--fundi-black)] hover:opacity-90",
        purple: "border-transparent bg-[var(--fundi-purple)] text-white hover:opacity-90",
    }

    return (
        <div className={cn(baseStyles, safeVariants[variant], className)} {...props} />
    )
}

export { Badge }
