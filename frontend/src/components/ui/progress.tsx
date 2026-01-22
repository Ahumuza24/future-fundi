"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value?: number, indicatorColor?: string }
>(({ className, value, indicatorColor, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative h-4 w-full overflow-hidden rounded-full bg-secondary bg-gray-100",
            className
        )}
        {...props}
    >
        <div
            className="h-full w-full flex-1 bg-primary transition-all duration-500 ease-in-out"
            style={{
                transform: `translateX(-${100 - (value || 0)}%)`,
                backgroundColor: indicatorColor || 'var(--fundi-orange)'
            }}
        />
    </div>
))
Progress.displayName = "Progress"

export { Progress }
