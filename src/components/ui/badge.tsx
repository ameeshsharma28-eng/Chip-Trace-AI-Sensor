import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 tracking-wide uppercase shadow-sm",
        {
          "border-transparent bg-primary/20 text-primary border-primary/20": variant === "default",
          "border-transparent bg-white/10 text-white": variant === "secondary",
          "border-transparent bg-red-500/20 text-red-400 border-red-500/30": variant === "destructive",
          "text-foreground border-white/20 bg-black/20 backdrop-blur-sm": variant === "outline",
          "border-transparent bg-emerald-500/20 text-emerald-400 border-emerald-500/30": variant === "success",
          "border-transparent bg-amber-500/20 text-amber-400 border-amber-500/30": variant === "warning",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
