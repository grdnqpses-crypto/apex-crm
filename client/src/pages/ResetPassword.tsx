import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Zap, CheckCircle, XCircle, RefreshCw, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setError("Invalid or missing reset link. Please request a new one.");
    } else {
      setToken(t);
    }
  }, []);

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => setDone(true),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    resetMutation.mutate({ token, newPassword: password });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">APEX CRM</span>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-black text-white">Password updated!</h2>
              <p className="text-sm text-white/50">Your password has been changed successfully. You can now sign in with your new password.</p>
              <button
                onClick={() => navigate("/")}
                className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm"
              >
                Go to Sign In <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-black text-white mb-1">Set new password</h2>
                <p className="text-sm text-white/40">Choose a strong password for your Apex CRM account.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {!token ? null : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/60 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                        autoFocus
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/60 mb-1.5">Confirm Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all text-sm"
                    />
                  </div>

                  {/* Password strength hint */}
                  {password.length > 0 && (
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            password.length >= (i + 1) * 3
                              ? password.length >= 12 ? "bg-green-400" : password.length >= 8 ? "bg-amber-400" : "bg-red-400"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resetMutation.isPending}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-black font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-1"
                  >
                    {resetMutation.isPending ? (
                      <><RefreshCw className="h-4 w-4 animate-spin" /> Updating...</>
                    ) : (
                      <>Update Password <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          &copy; {new Date().getFullYear()} Apex CRM. All rights reserved.
        </p>
      </div>
    </div>
  );
}
