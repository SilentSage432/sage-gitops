import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#6366f1] text-white hover:bg-[#585ae8]": variant === "default",
            "border border-white/10 bg-[#1a1d22] text-white/60 hover:text-white hover:bg-[#111317]": variant === "outline",
            "text-white/60 hover:text-white hover:bg-[#1a1d22]": variant === "ghost",
            "h-10 px-6 py-2": size === "default",
            "h-9 px-4 text-sm": size === "sm",
            "h-11 px-8": size === "lg",
          },
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
