import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { AlertTriangle, CreditCard, X } from "lucide-react";
import { useState } from "react";

export default function PaymentFailedBanner() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);

  const allowedRoles = ["company_admin", "axiom_owner", "developer"];
  const canSee = user && allowedRoles.includes(user.systemRole || user.role);

  const { data } = trpc.billing.paymentStatus.useQuery(undefined, {
    enabled: !!canSee,
    refetchInterval: 5 * 60 * 1000, // re-check every 5 minutes
    retry: false,
  });

  if (!canSee || !data?.isPastDue || dismissed) return null;

  return (
    <div className="w-full bg-red-600 text-white px-4 py-3 flex items-center gap-3 shadow-md z-40 relative">
      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-200" />
      <div className="flex-1 flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-sm">Payment Failed</span>
        <span className="text-red-100 text-sm">
          Your subscription payment is past due. Please update your payment method to avoid service interruption.
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => navigate("/billing")}
          className="flex items-center gap-1.5 bg-white text-red-700 hover:bg-red-50 transition-colors text-xs font-semibold px-3 py-1.5 rounded-lg"
        >
          <CreditCard className="w-3.5 h-3.5" />
          Resolve Payment
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-lg hover:bg-red-500 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4 text-red-200" />
        </button>
      </div>
    </div>
  );
}
