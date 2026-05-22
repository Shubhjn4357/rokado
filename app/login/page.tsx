"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Lock, User, Eye, EyeOff, ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import { loginAction } from "./actions";

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

  const handleQuickLogin = async (role: "owner" | "accountant" | "auditor") => {
    setIsLoading(true);
    setError(null);
    const credentials = {
      owner: { u: "owner", p: "owner123" },
      accountant: { u: "accountant", p: "accountant123" },
      auditor: { u: "auditor", p: "auditor123" },
    }[role];

    setUsername(credentials.u);
    setPassword(credentials.p);

    try {
      const result = await loginAction({ username: credentials.u, password: credentials.p });
      if (!result.success) {
        setError(result.error || "Quick login failed");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("Quick login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#030712] overflow-hidden">
      {/* Dynamic ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand/Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto bg-gradient-to-br from-blue-500/20 to-violet-500/20 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg shadow-black/40">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-4 bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
            Shree Saree House
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Financial Core & Ledger Management
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-semibold text-white">Sign In</CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Enter your credentials to access the ERP panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              )}

              {/* Username field */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-gray-300 font-semibold text-xs">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="username"
                    type="text"
                    required
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-11 border-white/10 bg-white/5 text-white placeholder-gray-500 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-xs"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-gray-300 font-semibold text-xs">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 pr-10 h-11 border-white/10 bg-white/5 text-white placeholder-gray-500 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl text-white font-semibold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
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
          </CardContent>
          
          {/* Quick Demo Logins Panel */}
          <CardFooter className="flex flex-col space-y-3 pt-4 border-t border-white/5 bg-slate-950/45 p-6">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Demo Roles & Quick Access
            </div>
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                onClick={() => handleQuickLogin("owner")}
                disabled={isLoading}
                className="p-2 border border-white/5 bg-white/5 hover:bg-blue-600/10 hover:border-blue-500/20 rounded-xl text-center transition-all group disabled:opacity-50"
              >
                <div className="text-[10px] font-bold text-blue-400 group-hover:text-blue-300">Owner</div>
                <div className="text-[9px] text-gray-500">owner123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("accountant")}
                disabled={isLoading}
                className="p-2 border border-white/5 bg-white/5 hover:bg-indigo-600/10 hover:border-indigo-500/20 rounded-xl text-center transition-all group disabled:opacity-50"
              >
                <div className="text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300">Accountant</div>
                <div className="text-[9px] text-gray-500">accountant123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("auditor")}
                disabled={isLoading}
                className="p-2 border border-white/5 bg-white/5 hover:bg-violet-600/10 hover:border-violet-500/20 rounded-xl text-center transition-all group disabled:opacity-50"
              >
                <div className="text-[10px] font-bold text-violet-400 group-hover:text-violet-300">Auditor</div>
                <div className="text-[9px] text-gray-500">auditor123</div>
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
