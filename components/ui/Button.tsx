"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        const variants = {
            primary: "bg-primary text-white hover:bg-accent shadow-md",
            secondary: "bg-secondary text-text hover:bg-opacity-80",
            outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
            ghost: "text-text hover:bg-secondary",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-6 py-2.5",
            lg: "px-8 py-3 text-lg",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none active:scale-95",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
