import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonGroupProps extends React.ComponentProps<"div"> {
  orientation?: "horizontal" | "vertical"
}

function ButtonGroup({
  className,
  orientation = "horizontal",
  ...props
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(
        "inline-flex",
        orientation === "horizontal"
          ? "[&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:not(:first-child)]:-ml-px"
          : "flex-col [&>*:first-child]:rounded-b-none [&>*:last-child]:rounded-t-none [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:not(:first-child)]:-mt-px",
        className
      )}
      {...props}
    />
  )
}

interface ButtonGroupSeparatorProps extends React.ComponentProps<"div"> {
  orientation?: "horizontal" | "vertical"
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: ButtonGroupSeparatorProps) {
  return (
    <div
      data-slot="button-group-separator"
      className={cn(
        "bg-border",
        orientation === "vertical" ? "w-px" : "h-px",
        className
      )}
      {...props}
    />
  )
}

interface ButtonGroupTextProps extends React.ComponentProps<"span"> {
  asChild?: boolean
}

function ButtonGroupText({
  className,
  asChild,
  ...props
}: ButtonGroupTextProps) {
  const Comp = asChild ? React.Fragment : "span"
  return (
    <Comp
      data-slot="button-group-text"
      className={cn(
        "inline-flex items-center justify-center px-3 text-sm font-medium",
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText }
