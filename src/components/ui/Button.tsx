import React from "react";
import { cn } from "./cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stellar-dark",
        {
          // variant
          "bg-brand-500 hover:bg-brand-400 text-white focus:ring-brand-500 shadow-lg shadow-brand-500/20":
            variant === "primary",
          "bg-stellar-card border border-stellar-border hover:border-brand-500/60 text-white focus:ring-brand-500/50":
            variant === "secondary",
          "bg-transparent hover:bg-white/5 text-white/70 hover:text-white":
            variant === "ghost",
          "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30":
            variant === "danger",
          // size
          "px-3 py-1.5 text-sm": size === "sm",
          "px-5 py-2.5 text-sm": size === "md",
          "px-7 py-3.5 text-base": size === "lg",
          // disabled
          "opacity-50 cursor-not-allowed pointer-events-none": disabled || loading,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
