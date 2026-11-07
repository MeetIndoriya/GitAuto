"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  GitBranch,
  Lock,
  AlertCircle,
  ArrowRight,
  Loader2,
  Check,
  KeyRound,
  Eye,
  EyeOff,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading, refetchUser } = useAuth();

  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isAuthorizingToken, setIsAuthorizingToken] = useState(false);
  const [isAuthorizingOAuth, setIsAuthorizingOAuth] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const errorParam = searchParams.get("error");
  const descriptionParam = searchParams.get("description") || searchParams.get("message");

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  // One-click GitHub OAuth 2.0 Handler
  const handleGitHubOAuth = () => {
    setIsAuthorizingOAuth(true);
    setAuthError(null);
    window.location.href = "/api/v1/auth/github/login?format=redirect";
  };

  // Validation rules for token
  const validateToken = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "GitHub Personal Access Token is required.";
    }
    if (/\s/.test(trimmed)) {
      return "Token must not contain spaces or whitespace characters.";
    }
    if (trimmed.length < 20) {
      return "Token is too short. GitHub tokens are at least 20 characters in length.";
    }
    if (!trimmed.startsWith("ghp_") && !trimmed.startsWith("github_pat_") && !trimmed.startsWith("gho_")) {
      return "Token must start with 'ghp_' (classic token) or 'github_pat_' (fine-grained token).";
    }
    return null;
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setToken(val);
    setAuthError(null);
    if (validationError) {
      setValidationError(validateToken(val));
    }
  };

  const handleGitHubTokenAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const err = validateToken(token);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);

    setIsAuthorizingToken(true);
    try {
      await api.loginWithGithubToken(token.trim());
      await refetchUser();
      router.replace("/dashboard");
    } catch (err: any) {
      const message = err.message || "Failed to authorize GitHub token. Please verify your token and scopes.";
      setAuthError(message);
    } finally {
      setIsAuthorizingToken(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(39,39,42,0.6),rgba(9,9,11,1))]" />
      
      {/* Fine grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-300 my-8">
        <Card className="border-border bg-card/95 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-8 sm:p-10 space-y-6">
            {/* Logo and Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-lg mb-1 ring-4 ring-primary/10">
                <GitBranch className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-sans">
                GitAuto
              </h1>
              <p className="text-sm font-semibold text-foreground-muted max-w-sm mx-auto leading-relaxed">
                Single-user GitHub repository lifecycle automation & safety platform.
              </p>
            </div>

            {/* Error Alerts */}
            {authError && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-semibold text-red-400 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>GitHub Authorization Failed</span>
                </div>
                <p className="text-foreground-muted leading-relaxed text-xs font-medium">
                  {authError}
                </p>
              </div>
            )}

            {errorParam && !authError && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-semibold text-red-400 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>Authentication Notice</span>
                </div>
                <p className="text-foreground-muted leading-relaxed text-xs font-medium">
                  {descriptionParam || `OAuth returned error: ${errorParam}. Please retry authorization.`}
                </p>
              </div>
            )}

            {/* Platform Features Summary */}
            <div className="space-y-3 py-2 text-sm font-bold text-foreground border-y border-border">
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>One-click repository provisioning & scaffolding</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Strict double-confirmation deletion guardrails</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Perpetual daemon lifecycle & continuous automation</span>
              </div>
            </div>

            {/* 1. Primary Action: GitHub OAuth 2.0 */}
            <div className="space-y-3 pt-1">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGitHubOAuth}
                isLoading={isAuthorizingOAuth}
                disabled={isAuthorizingOAuth || isAuthorizingToken}
                className="w-full h-12 text-base font-extrabold tracking-wide justify-center shadow-lg group hover:opacity-95"
              >
                {!isAuthorizingOAuth && (
                  <svg className="h-5 w-5 mr-2.5 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                )}
                <span>Continue with GitHub (OAuth 2.0)</span>
                <ArrowRight className="h-5 w-5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink mx-4 text-xs font-mono font-bold uppercase tracking-wider text-foreground-muted">
                or sign in with token
              </span>
              <div className="flex-grow border-t border-border" />
            </div>

            {/* 2. Secondary Action: Personal Access Token Form */}
            <form onSubmit={handleGitHubTokenAuth} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="github-token" className="text-xs font-bold text-foreground flex items-center gap-2">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    <span>Personal Access Token</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-foreground-muted">Direct Auth</span>
                </div>

                <div className="relative">
                  <input
                    id="github-token"
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={handleTokenChange}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
                    autoComplete="off"
                    spellCheck={false}
                    disabled={isAuthorizingToken || isAuthorizingOAuth}
                    className={`w-full h-10 px-3.5 pr-11 rounded-lg border font-mono text-xs bg-background text-foreground transition-all outline-none focus:ring-2 focus:ring-primary/40 ${
                      validationError ? "border-red-500 ring-1 ring-red-500" : "border-border hover:border-border-focus"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    tabIndex={-1}
                    aria-label={showToken ? "Hide token" : "Show token"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors p-1"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {validationError && (
                  <p className="text-xs font-bold text-red-400 flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{validationError}</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="sm"
                isLoading={isAuthorizingToken}
                disabled={isAuthorizingToken || isAuthorizingOAuth || !token.trim()}
                className="w-full h-10 text-xs font-bold tracking-wide justify-center shadow-xs border border-border"
              >
                <span>Authorize with Token</span>
              </Button>
            </form>

            {/* Security Notice */}
            <div className="text-center pt-1 border-t border-border/60">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-foreground-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Protected by PKCE S256 & AES-256 Session Vault</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
