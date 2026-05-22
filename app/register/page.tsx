"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Lock, User, Eye, EyeOff, Loader2, UserPlus, Info, CheckCircle2, ShieldAlert } from "lucide-react";
import { registerAction } from "./actions";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password strength calculation
  const [strength, setStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState("Too Short");
  const [strengthColor, setStrengthColor] = useState("bg-red-500/30");

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setStrengthLabel("Too Short");
      setStrengthColor("bg-red-500/30");
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    setStrength(score);

    if (password.length < 8) {
      setStrengthLabel("Too Short");
      setStrengthColor("bg-red-500");
    } else if (score <= 2) {
      setStrengthLabel("Weak");
      setStrengthColor("bg-red-500");
    } else if (score === 3) {
      setStrengthLabel("Medium");
      setStrengthColor("bg-amber-500");
    } else {
      setStrengthLabel("Strong");
      setStrengthColor("bg-emerald-500");
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Frontend validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain at least one letter and one number");
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerAction({ username, name, password });
      if (!result.success) {
        setError(result.error || "Registration failed");
      } else {
        setSuccess(true);
        // Reset form
        setUsername("");
        setName("");
        setPassword("");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
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
          <div className="mx-auto bg-linear-to-br from-blue-500/20 to-violet-500/20 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg shadow-black/40">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-4 bg-clip-text bg-linear-to-r from-blue-400 to-violet-400">
            Shree Saree House
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Financial Core & Ledger Management
          </p>
        </div>

        {/* Register/Success Card */}
        <Card className="border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden">
          {success ? (
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-black/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Registration Successful!</h2>
                <p className="text-sm text-gray-400 px-4">
                  Your ERP account has been created securely. You can now log in using your credentials.
                </p>
              </div>
              <Link href="/login" className="block w-full">
                <Button className="w-full h-11 rounded-xl text-white font-semibold text-xs bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all">
                  Proceed to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  Create Account
                </CardTitle>
                <CardDescription className="text-gray-400 text-xs">
                  Register below to create a secure employee or accountant seat.
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

                  {/* Name field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-gray-300 font-semibold text-xs">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="name"
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        className="pl-10 h-11 border-white/10 bg-white/5 text-white placeholder-gray-500 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-xs"
                      />
                    </div>
                  </div>

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
                        placeholder="Choose username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                        className="pl-10 h-11 border-white/10 bg-white/5 text-white placeholder-gray-500 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-xs"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-gray-300 font-semibold text-xs">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Create strong password"
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

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-gray-500 uppercase tracking-wider">Password Strength</span>
                          <span
                            className={
                              strengthLabel === "Strong"
                                ? "text-emerald-400"
                                : strengthLabel === "Medium"
                                ? "text-amber-400"
                                : "text-red-400"
                            }
                          >
                            {strengthLabel}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                          <div
                            className={`h-full transition-all duration-300 ${strengthColor}`}
                            style={{ width: `${Math.max(25, strength * 25)}%` }}
                          />
                        </div>
                        <div className="flex items-start gap-1 text-[9px] text-gray-400 leading-normal">
                          <Info className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                          <span>Must be 8+ characters, with at least one letter and one number.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl text-white font-semibold text-xs bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Registering Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Register Account
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3 pt-4 border-t border-white/5 bg-slate-950/45 p-6 text-center">
                <div className="text-xs text-gray-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                    Sign In here
                  </Link>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
