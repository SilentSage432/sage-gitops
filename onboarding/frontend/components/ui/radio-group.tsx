import * as React from "react"
import { cn } from "@/lib/utils"

export interface RadioGroupProps {
  options: { value: string; label: string }[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  name?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, options, value, onValueChange, name, ...props }, ref) => {
    const generatedId = React.useId()
    const groupName = name || generatedId
    
    return (
      <div ref={ref} className={cn("space-y-3", className)} {...props}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-center p-4 border border-white/10 rounded-[14px] cursor-pointer transition-colors",
              value === option.value
                ? "bg-[#1a1d22] border-[#6366f1]"
                : "bg-[#1a1d22] hover:bg-[#111317]"
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onValueChange?.(e.target.value)}
              className="w-5 h-5 text-[#6366f1] focus:ring-[#6366f1] focus:ring-2 bg-[#0b0c0f] border-white/10"
            />
            <span className="ml-3 text-sm font-medium text-[#e2e6ee]">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

export { RadioGroup }
