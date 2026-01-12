import React from "react";
import { cn } from "@/lib/utils"; // I'll create this helper

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "white";
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
}

export function Button({
    variant = "primary",
    size = "md",
    className,
    children,
    ...props
}: ButtonProps) {
    const variants = {
        primary: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20",
        secondary: "bg-secondary text-white hover:bg-secondary/90 shadow-lg shadow-secondary/20",
        outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
        ghost: "bg-transparent text-zinc-600 hover:bg-zinc-100",
        white: "bg-white text-primary hover:bg-zinc-50 border border-zinc-100 shadow-sm",
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    return (
        <button
            className={cn(
                "rounded-full font-bold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
