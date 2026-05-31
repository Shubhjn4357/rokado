"use client";

import React from "react";
import type { CardComponentProps } from "nextstepjs";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CustomOnboardingCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  // Calculate progress percentage
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className="relative w-[340px] sm:w-[380px] rounded-2xl border border-accent/40 bg-surface-elevated/95 p-5 shadow-2xl backdrop-blur-xl font-sans text-xs select-none animate-in fade-in zoom-in-95 duration-200 z-[1000]">
      {/* Target element arrow pointer (injected by nextstepjs) */}
      <div className="text-accent/40">{arrow}</div>

      {/* Thin elegant top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-2xl overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3 mb-3.5">
        <div className="flex items-center gap-2">
          {step.icon ? (
            <span className="text-base shrink-0">{step.icon}</span>
          ) : (
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
          )}
          <h4 className="font-extrabold text-sm text-foreground tracking-tight line-clamp-1">
            {step.title}
          </h4>
        </div>
        <button
          onClick={skipTour}
          className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          title="Skip Tour"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="text-muted-foreground font-semibold leading-relaxed mb-4 text-[11px] sm:text-xs">
        {step.content}
      </div>

      {/* Footer Navigation Panel */}
      <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3.5">
        {/* Left: Skip and indicator */}
        <div className="flex flex-col items-start gap-1">
          <button
            onClick={skipTour}
            className="text-[10px] font-black text-muted-foreground hover:text-destructive cursor-pointer uppercase tracking-widest transition-colors"
          >
            Skip Tour
          </button>
          <span className="text-[9px] text-muted-foreground/70 font-bold uppercase tracking-wider">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={prevStep}
              className="h-7 px-2.5 rounded-lg border-border bg-surface text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all hover:bg-muted/70"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Back</span>
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={nextStep}
            className="h-7 px-3.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent/10 hover:shadow-accent/20 transition-all"
          >
            <span>{isLast ? "Finish" : "Next"}</span>
            {!isLast && <ChevronRight className="w-3 h-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
