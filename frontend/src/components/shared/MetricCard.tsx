import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "destructive" | "info";
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  className,
}: MetricCardProps) {
  const iconColors = {
    default: "text-foreground-muted bg-muted",
    success: "text-emerald-400 bg-emerald-500/10",
    warning: "text-amber-400 bg-amber-500/10",
    destructive: "text-red-400 bg-red-500/10",
    info: "text-sky-400 bg-sky-500/10",
  };

  return (
    <Card className={cn("overflow-hidden hover:border-border-focus transition-all", className)}>
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1.5 min-w-0">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-foreground-muted truncate">
            {title}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-foreground font-mono truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs font-medium text-foreground-muted truncate">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl shrink-0", iconColors[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
