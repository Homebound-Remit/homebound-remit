import React from "react";
import { cn } from "./cn";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  current: number; // 0-indexed
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                i < current
                  ? "bg-brand-500 border-brand-500 text-white"
                  : i === current
                  ? "bg-brand-500/20 border-brand-500 text-brand-400"
                  : "bg-white/5 border-white/10 text-white/30"
              )}
            >
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                i <= current ? "text-white/80" : "text-white/30"
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-px mx-3 mb-5 transition-all",
                i < current ? "bg-brand-500" : "bg-white/10"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
