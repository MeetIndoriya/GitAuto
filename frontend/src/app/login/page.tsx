"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GitBranch, AlertCircle, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const errorParam = searchParams.get("error");
  const descriptionParam = searchParams.get("description") || searchParams.get("message");

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleGitHubLogin = () => {
    setIsAuthorizing(true);
    window.location.href = "/api/v1/auth/github/login?format=redirect";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(39,39,42,0.6),rgba(9,9,11,1))]" />
      
      {/* Fine grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
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
                Automate your GitHub repositories with safety guardrails.
              </p>
            </div>

            {/* Error Banner */}
            {errorParam && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-semibold text-red-400 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>Authentication Notice</span>
                </div>
                <p className="text-foreground-muted leading-relaxed text-xs font-medium">
                  {descriptionParam || `Login failed: ${errorParam}. Please try again.`}
                </p>
              </div>
            )}

            {/* Simple Feature Points */}
            <div className="space-y-3 py-3 text-sm font-bold text-foreground border-y border-border">
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Fast repository provisioning & setup</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Safe delete with double confirmation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Runs automatically in the background</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGitHubLogin}
                isLoading={isAuthorizing}
                disabled={isAuthorizing}
                className="w-full h-12 text-base font-extrabold tracking-wide justify-center shadow-lg group hover:opacity-95"
              >
                {!isAuthorizing && (
                  <svg className="h-5 w-5 mr-2.5 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                )}
                <span>Continue with GitHub</span>
                <ArrowRight className="h-5 w-5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </Button>
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
