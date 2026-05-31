"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface PageTransitionProviderProps {
  children: React.ReactNode;
}

export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionState, setTransitionState] = useState<"enter" | "exit" | "idle">("idle");
  const prevPathRef = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    // Start exit animation
    setTransitionState("exit");

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionState("enter");

      timerRef.current = setTimeout(() => {
        setTransitionState("idle");
      }, 320);
    }, 140);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname, children]);

  // Update children in idle state
  useEffect(() => {
    if (transitionState === "idle") {
      setDisplayChildren(children);
    }
  }, [children, transitionState]);

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{
        opacity: transitionState === "exit" ? 0 : 1,
        transform:
          transitionState === "exit"
            ? "scale(0.985) translateY(6px)"
            : "scale(1) translateY(0px)",
        transition:
          transitionState === "exit"
            ? "opacity 140ms cubic-bezier(0.16, 1, 0.3, 1), transform 140ms cubic-bezier(0.16, 1, 0.3, 1)"
            : transitionState === "enter"
            ? "opacity 320ms cubic-bezier(0.16, 1, 0.3, 1), transform 320ms cubic-bezier(0.16, 1, 0.3, 1)"
            : "none",
        willChange: "transform, opacity",
      }}
    >
      {displayChildren}
    </div>
  );
}
