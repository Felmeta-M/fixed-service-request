import * as React from "react"
import { cn } from "@/lib/utils"

type InputProps = {
  size?: "sm" | "md" | "lg"
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">

const sizeClasses = {
  sm: "h-8 px-2 text-sm",
  md: "h-10 px-3 text-base",
  lg: "h-12 px-4 text-lg",
}

const Input: React.FC<InputProps> = ({
  size = "md",  
  className,
  ...props     
}) => {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        sizeClasses[size],
        className
      )}
      {...props}
      />
    )
  }

// Input.displayName = "Input"

export { Input }
