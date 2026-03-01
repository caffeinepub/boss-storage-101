import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginScreen() {
  const { login, isLoggingIn, isInitializing, isLoginError, loginError } =
    useInternetIdentity();

  const isLoading = isLoggingIn || isInitializing;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Atmospheric background layers */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Radial amber glow — top-left */}
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.18 70 / 0.35) 0%, transparent 70%)",
          }}
        />
        {/* Faint teal glow — bottom-right */}
        <div
          className="absolute -bottom-48 -right-24 w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.15 200 / 0.25) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.94 0.01 80) 1px, transparent 1px), linear-gradient(90deg, oklch(0.94 0.01 80) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div
          className="rounded-2xl border border-border/60 overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.18 0.012 240) 0%, oklch(0.14 0.01 240) 100%)",
            boxShadow:
              "0 0 0 1px oklch(0.28 0.015 240 / 0.5), 0 32px 80px oklch(0 0 0 / 0.6), 0 0 60px oklch(0.75 0.18 70 / 0.06)",
          }}
        >
          {/* Top amber accent line */}
          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, oklch(0.75 0.18 70 / 0.7) 30%, oklch(0.75 0.18 70) 50%, oklch(0.75 0.18 70 / 0.7) 70%, transparent 100%)",
            }}
          />

          <div className="px-8 py-10">
            {/* Logo + name */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col items-center gap-4 mb-8"
            >
              <div
                className="w-16 h-16 rounded-2xl overflow-hidden border border-primary/25 shrink-0"
                style={{
                  background: "oklch(0.16 0.01 240)",
                  boxShadow:
                    "0 0 24px oklch(0.75 0.18 70 / 0.2), inset 0 1px 0 oklch(0.94 0.01 80 / 0.06)",
                }}
              >
                <img
                  src="/assets/generated/boss-logo-transparent.dim_128x128.png"
                  alt="BOSS Storage 101"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground tracking-tight leading-none">
                  BOSS <span className="text-primary">Storage</span>
                </h1>
                <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mt-1">
                  101
                </p>
              </div>
            </motion.div>

            {/* Headline + sub-copy */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
              className="text-center mb-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Your personal cloud storage
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Secure, private, and always yours. Sign in with a passkey to
                access your files from anywhere.
              </p>
            </motion.div>

            {/* Feature badges */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.4 }}
              className="flex items-center justify-center gap-3 mb-8 flex-wrap"
            >
              {[
                { icon: Shield, label: "End-to-end encrypted" },
                { icon: Zap, label: "Instant access" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-full border border-border/50"
                  style={{ background: "oklch(0.16 0.01 240)" }}
                >
                  <Icon className="w-3 h-3 text-primary" />
                  {label}
                </span>
              ))}
            </motion.div>

            {/* Sign in button */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.4 }}
            >
              <Button
                onClick={login}
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold rounded-xl gap-2.5 transition-all duration-200"
                style={{
                  background: isLoading
                    ? "oklch(0.55 0.12 70)"
                    : "linear-gradient(135deg, oklch(0.8 0.19 72) 0%, oklch(0.7 0.18 68) 100%)",
                  color: "oklch(0.1 0.01 240)",
                  boxShadow: isLoading
                    ? "none"
                    : "0 4px 24px oklch(0.75 0.18 70 / 0.35), 0 1px 0 oklch(0.94 0.01 80 / 0.1) inset",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isInitializing ? "Initializing…" : "Signing in…"}
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Sign in with Passkey
                  </>
                )}
              </Button>
            </motion.div>

            {/* Error message */}
            {isLoginError && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-sm text-center text-destructive"
              >
                {loginError?.message ?? "Sign in failed. Please try again."}
              </motion.p>
            )}

            {/* Footer note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-xs text-center text-muted-foreground/60"
            >
              Powered by Internet Identity — no passwords, no tracking.
            </motion.p>
          </div>
        </div>

        {/* Caffeine attribution */}
        <p className="mt-6 text-xs text-center text-muted-foreground/40">
          Built with <span className="text-primary/60">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
