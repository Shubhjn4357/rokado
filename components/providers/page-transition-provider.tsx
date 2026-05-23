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
      }, 220);
    }, 120);

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
            ? "translateY(4px)"
            : transitionState === "enter"
            ? "translateY(0px)"
            : "translateY(0px)",
        transition:
          transitionState === "exit"
            ? "opacity 120ms ease-out, transform 120ms ease-out"
            : transitionState === "enter"
            ? "opacity 220ms ease-out, transform 220ms ease-out"
            : "none",
      }}
    >
      {displayChildren}
    </div>
  );
}
