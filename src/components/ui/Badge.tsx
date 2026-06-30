import React from "react";
import { cn } from "./cn";

type BadgeVariant = "green" | "blue" | "yellow" | "red" | "gray" | "purple";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  green:  "bg-green-500/15 text-green-400 border-green-500/20",
  blue:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
  yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  red:    "bg-red-500/15 text-red-400 border-red-500/20",
  gray:   "bg-white/5 text-white/50 border-white/10",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

const dotColors: Record<BadgeVariant, string> = {
  green:  "bg-green-400",
  blue:   "bg-blue-400",
  yellow: "bg-yellow-400",
  red:    "bg-red-400",
  gray:   "bg-white/50",
  purple: "bg-purple-400",
};

export function Badge({ variant = "gray", children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
