"use client";

import { useEffect, useState } from "react";
import { NextStep, NextStepProvider } from "nextstepjs";
import { onboardingSteps } from "@/lib/onboarding-steps";
import { CustomOnboardingCard } from "@/components/onboarding/custom-onboarding-card";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <NextStepProvider>
      {mounted ? (
        <NextStep
          steps={onboardingSteps}
          cardComponent={CustomOnboardingCard}
          shadowRgb="248, 72, 66"
          shadowOpacity="0.25"
          overlayZIndex={999}
          clickThroughOverlay={false}
          scrollToTop={true}
          onComplete={() => {
            if (typeof window !== "undefined") {
              localStorage.setItem("erp:onboarding-completed", "true");
            }
          }}
          onSkip={() => {
            if (typeof window !== "undefined") {
              localStorage.setItem("erp:onboarding-completed", "true");
            }
          }}
        >
          {children}
        </NextStep>
      ) : (
        children
      )}
    </NextStepProvider>
  );
}
