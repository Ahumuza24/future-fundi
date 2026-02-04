import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'default' | 'orange' | 'cyan' | 'lime' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    const variants = {
      default: "bg-[var(--fundi-black)] text-white hover:bg-[var(--fundi-orange)]",
      orange: "bg-[var(--fundi-orange)] text-white hover:bg-[var(--fundi-orange-dark)]",
      cyan: "bg-[var(--fundi-cyan)] text-white hover:opacity-90",
      lime: "bg-[var(--fundi-lime)] text-[var(--fundi-black)] hover:opacity-90",
      outline: "border-2 border-[var(--fundi-orange)] text-[var(--fundi-orange)] hover:bg-[var(--fundi-orange)] hover:text-white",
      ghost: "hover:bg-[var(--fundi-bg-light)] text-[var(--fundi-black)]",
      secondary: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-8 text-lg",
      icon: "h-10 w-10",
    }

    return (
      <Comp
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
