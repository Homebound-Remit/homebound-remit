import React from "react";
import { cn } from "./cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  prefix,
  suffix,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-white/70"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-white/5 px-4 py-3 transition-all",
          "focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/30",
          error
            ? "border-red-500/50"
            : "border-white/10 hover:border-white/20",
          className
        )}
      >
        {prefix && (
          <span className="text-white/40 shrink-0">{prefix}</span>
        )}
        <input
          id={inputId}
          className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none text-sm"
          {...props}
        />
        {suffix && (
          <span className="text-white/40 shrink-0 text-sm">{suffix}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  );
}
