import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getLoginUrl } from "@/const";
import { Zap, Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      // Session cookie is set by the server — redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              Apex CRM
            </span>
          </div>
          <CardTitle className="text-xl text-white">Welcome Back</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in with your username and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-indigo-500"
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password with eye toggle */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-indigo-500 pr-12"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3 py-1">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="border-slate-500 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
              />
              <Label
                htmlFor="remember-me"
                className="text-slate-300 text-sm cursor-pointer select-none"
              >
                Remember me for 30 days
              </Label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </div>
              )}
            </Button>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </form>

          {/* Signup link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Sign up for free
              </button>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-xs text-center text-slate-500 mb-3">
              Platform administrators can also sign in with
            </p>
            <Button
              variant="outline"
              className="w-full border-slate-600/50 text-slate-300 hover:bg-slate-800/50 hover:text-white"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              Sign in with Manus OAuth
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
