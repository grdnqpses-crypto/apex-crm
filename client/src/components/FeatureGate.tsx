/**
 * FeatureGate — wraps any content and shows a locked overlay with an upgrade
 * CTA when the current subscription tier doesn't include the feature.
 *
 * Usage:
 *   <FeatureGate featureKey="smtp_260_rotation" featureName="260 SMTP Rotation Engine">
 *     <SmtpRotationPanel />
 *   </FeatureGate>
 */

import { useFeatureGate } from "@/hooks/useFeatureGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Star, Zap, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface FeatureGateProps {
  featureKey: string;
  featureName: string;
  /** Short description of what the feature does */
  description?: string;
  /** Whether this is a freemium feature (partially free, more on upgrade) */
  freemium?: boolean;
  children: React.ReactNode;
  /** If true, renders children inline with a small banner instead of full overlay */
  compact?: boolean;
}

export function FeatureGate({
  featureKey,
  featureName,
  description,
  freemium = false,
  children,
  compact = false,
}: FeatureGateProps) {
  const { hasAccess, requiredPlan, isLoading } = useFeatureGate(featureKey);
  const [, setLocation] = useLocation();

  // Still loading — show children (optimistic)
  if (isLoading) return <>{children}</>;

  // Access granted — render normally
  if (hasAccess) return <>{children}</>;

  // Compact mode — small banner above content
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-amber-800 font-medium">{featureName}</span>
            <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
              {requiredPlan}+
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 gap-1"
            onClick={() => setLocation("/billing")}
          >
            Upgrade <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        <div className="opacity-40 pointer-events-none select-none">{children}</div>
      </div>
    );
  }

  // Full overlay mode
  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred content behind */}
      <div className="opacity-20 pointer-events-none select-none blur-sm">{children}</div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl border border-border/60 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          {freemium ? (
            <Sparkles className="h-7 w-7 text-amber-600" />
          ) : (
            <Lock className="h-7 w-7 text-amber-600" />
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-bold">{featureName}</h3>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-semibold">
            <Star className="h-3 w-3 mr-1" />
            {requiredPlan}+
          </Badge>
        </div>

        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>
        )}

        {!description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-5">
            {freemium
              ? `You've reached the free limit for ${featureName}. Upgrade to ${requiredPlan} for unlimited access.`
              : `${featureName} is available on the ${requiredPlan} plan and above. Upgrade to unlock this feature.`}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setLocation("/billing")}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Upgrade to {requiredPlan}
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/subscription")}
            className="gap-2"
          >
            Compare Plans
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          All plans include a 60-day free trial · No credit card required
        </p>
      </div>
    </div>
  );
}

/**
 * FreemiumBadge — shows a small "X / Y free uses remaining" badge inline.
 * Use alongside freemium features to show usage meters.
 */
export function FreemiumBadge({
  used,
  limit,
  label,
}: {
  used: number;
  limit: number;
  label: string;
}) {
  const remaining = Math.max(0, limit - used);
  const pct = Math.min(100, (used / limit) * 100);
  const isLow = remaining <= Math.ceil(limit * 0.1);
  const isExhausted = remaining === 0;

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${
      isExhausted
        ? "bg-red-50 text-red-700 border-red-200"
        : isLow
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200"
    }`}>
      <Sparkles className="h-3 w-3" />
      {isExhausted ? (
        <span>Free limit reached · <strong>Upgrade</strong></span>
      ) : (
        <span>{remaining} / {limit} free {label} remaining</span>
      )}
      <div className="w-16 h-1.5 rounded-full bg-current/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-current transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
