"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { animateButtonPress } from "@/lib/animations";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, disabled, children, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      animateButtonPress(e.currentTarget);
      if (onClick) onClick(e);
    };

    const variantStyles = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-transparent font-bold active:scale-[0.98]",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border font-semibold active:scale-[0.98]",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm font-bold active:scale-[0.98]",
      outline: "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground font-semibold active:scale-[0.98]",
      ghost: "text-foreground hover:bg-accent hover:text-accent-foreground font-semibold active:scale-[0.98]",
      link: "text-primary underline-offset-4 hover:underline p-0 h-auto font-bold",
    };

    const sizeStyles = {
      sm: "h-8.5 px-3.5 text-xs font-semibold rounded-md gap-1.5",
      md: "h-10 px-4.5 text-sm font-bold rounded-lg gap-2",
      lg: "h-12 px-6 text-base font-bold rounded-lg gap-2.5",
      icon: "h-10 w-10 p-0 rounded-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
