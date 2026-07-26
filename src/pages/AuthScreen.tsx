/**
 * AuthScreen.tsx — Login / Register gate
 *
 * Shown instead of the Dashboard whenever there is no valid session.
 * Same minimal editorial style as Dashboard/LandingPage.
 */

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Mode = "login" | "register";

function errorMessage(err: unknown, mode: Mode): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Incorrect email or password.";
    if (err.status === 409) return "An account with that email already exists.";
    if (err.status === 403) return "Invalid invite code.";
    if (err.status === 400) return err.message || "Please check your input and try again.";
    if (err.status === 0) return err.message;
    return err.message || "Something went wrong. Please try again.";
  }
  return mode === "login" ? "Could not log in. Please try again." : "Could not register. Please try again.";
}

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClasses =
    "rounded-none border-zinc-300 bg-white font-mono text-sm shadow-none focus-visible:ring-zinc-900";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, inviteCode);
      }
    } catch (err) {
      setError(errorMessage(err, mode));
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
  }

  return (
    <div
      className="min-h-screen bg-[#F5F4F0] text-zinc-900 flex flex-col items-center justify-center px-4 py-12"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <Link
        to="/"
        className="font-mono text-xs font-bold tracking-widest uppercase text-zinc-900 hover:text-zinc-600 transition-colors mb-8"
      >
        English
      </Link>

      <div className="w-full max-w-sm border border-zinc-300 bg-white">
        <div className="border-b border-zinc-200 px-6 py-5">
          <h1 className="font-mono text-sm font-bold uppercase tracking-widest text-zinc-900">
            {mode === "login" ? "Log in" : "Create account"}
          </h1>
          <p className="font-mono text-xs text-zinc-400 mt-1">
            {mode === "login"
              ? "Sign in to sync your progress across devices."
              : "Registration requires an invite code."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 border border-rose-200 bg-rose-50 px-3 py-2">
              <AlertCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
              <p className="font-mono text-xs text-rose-700 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              placeholder="••••••••"
            />
          </div>

          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="inviteCode" className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
                Invite code
              </Label>
              <Input
                id="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className={inputClasses}
                placeholder="Enter your invite code"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-none bg-zinc-900 text-white font-mono text-xs uppercase tracking-widest hover:bg-zinc-700 shadow-none h-10"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Log in" : "Create account"}
                <ArrowRight size={14} />
              </>
            )}
          </Button>
        </form>

        <div className="border-t border-zinc-200 px-6 py-4">
          <button
            type="button"
            onClick={toggleMode}
            className="font-mono text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {mode === "login" ? (
              <>Don&apos;t have an account? <span className="underline">Register</span></>
            ) : (
              <>Already have an account? <span className="underline">Log in</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
