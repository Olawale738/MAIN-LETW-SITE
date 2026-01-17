"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { onValueChange?: (value: string) => void, defaultValue?: string }
>(({ className, defaultValue, onValueChange, ...props }, ref) => {
    // Basic implementation without Radix for now since it's not installed
    // We just render a div, actual radio functionality is handled by inputs
    return (
        <div
            className={cn("grid gap-2", className)}
            ref={ref}
            {...props}
        />
    )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
    return (
        <input
            type="radio"
            ref={ref}
            className={cn(
                "aspect-square h-4 w-4 rounded-full border border-[#140152] text-[#140152] ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 accent-[#140152]",
                className
            )}
            {...props}
        />
    )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
