"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Lock, User, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { loginAction } from "./actions";
import { AppConst } from "@/constant/app.constant";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginAction({ username, password });
      if (!result.success) {
        setError(result.error || "Invalid username or password");
      } else {
        // Redirect to dashboard
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-transparent overflow-hidden">
      {/* Dynamic ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-accent-blue/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-accent-indigo/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand/Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto bg-accent/15 backdrop-blur-md border border-accent/25 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-accent/10">
            <Building2 className="w-8 h-8 text-accent animate-pulse" />
          </div>
          <h1 className="text-3xl font-black mt-4 text-foreground tracking-tight select-none">
            {AppConst.name}
          </h1>
          <p className="text-xs text-foreground/60 font-semibold select-none">
            {AppConst.tagline}
          </p>
        </div>

        {/* Login Card */}
        <Card className="glass-card-premium border-none rounded-[28px] overflow-hidden shadow-xl">
          <CardHeader className="space-y-1 pb-6 select-none">
            <CardTitle className="text-xl font-black text-foreground">Sign In</CardTitle>
            <CardDescription className="text-foreground/50 text-xs font-semibold">
              Enter your credentials to access the ERP panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  {error}
                </div>
              )}

              {/* Username field */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-foreground/75 font-semibold text-xs">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                  <Input
                    id="username"
                    type="text"
                    required
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-11 border-foreground/10 bg-white/10 dark:bg-black/25 text-foreground placeholder:text-foreground/45 rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-xs"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-foreground/75 font-semibold text-xs">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 pr-10 h-11 border-foreground/10 bg-white/10 dark:bg-black/25 text-foreground placeholder:text-foreground/45 rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl text-accent-foreground font-semibold text-xs bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Secure Login
                  </>
                )}
              </Button>
            </form>

            <div className="text-center mt-4 text-xs text-foreground/60 font-semibold select-none">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-accent hover:text-accent/80 font-bold transition-colors">
                Create an Account
              </Link>
            </div>
          </CardContent>

        </Card>
      </div>
    </div>
  );
}
