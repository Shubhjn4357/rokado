"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/providers/auth-provider";

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    logout: context.logout,
    role: context.user?.role ?? null,
    name: context.user?.name ?? null,
    username: context.user?.username ?? null,
    companyId: context.user?.companyId ?? null,
  };
}
