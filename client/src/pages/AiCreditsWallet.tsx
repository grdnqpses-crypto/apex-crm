/**
 * AiCreditsWallet.tsx
 * Company Admin — view AI credit balance and usage history.
 *
 * Credits are purchased separately from the subscription and billed
 * directly to the company's Stripe card on file.
 * CRM AI features are always free — credits apply only to non-CRM AI usage.
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Zap, Coins, TrendingUp, Info, CheckCircle2, XCircle } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

export default function AiCreditsWallet() {
  const { t } = useSkin();
  const { data: balance, isLoading: balanceLoading } = trpc.aiCredits.myBalance.useQuery();
  const { data: transactions = [], isLoading: txLoading } = trpc.aiCredits.myTransactions.useQuery();

  const txTypeLabel: Record<string, string> = {
    purchase: "Purchase",
    crm_free: "CRM Free",
    paid_usage: "Paid Usage",
    refund: "Refund",
    adjustment: "Adjustment",
  };

  const txTypeBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    purchase: "default",
    crm_free: "secondary",
    paid_usage: "destructive",
    refund: "outline",
    adjustment: "outline",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-orange-500" />
          AI Credits
        </h1>
        <p className="text-muted-foreground mt-1">
          Your AI credit balance for non-CRM AI features.
        </p>
      </div>

      {/* Info banner */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-medium text-blue-600 dark:text-blue-400">How AI Credits Work</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Free (included in subscription)</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Email ghostwriting, lead scoring, psychographic profiling, battle cards, AI
                      assistant for CRM data — all CRM-related AI features.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <XCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Requires Credits</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      General AI chat, custom AI tasks, bulk AI processing outside normal CRM
                      workflows. Credits are billed to your card on file.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                To purchase more credits, contact your AXIOM CRM account manager. Credits are priced
                at Manus list price + 25% and charged separately from your subscription.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Credits</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {balanceLoading ? (
                <span className="text-muted-foreground text-xl">Loading...</span>
              ) : (
                <>
                  <Coins className="h-6 w-6 text-orange-500" />
                  {(balance?.availableCredits || 0).toLocaleString()}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Ready to use for non-CRM AI features</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lifetime Purchased</CardDescription>
            <CardTitle className="text-3xl">
              {balanceLoading ? "—" : (balance?.lifetimePurchasedCredits || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total credits ever purchased</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lifetime Used</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              {balanceLoading ? "—" : (balance?.lifetimeUsedCredits || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total credits consumed to date</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage History</CardTitle>
          <CardDescription>
            All AI credit events — purchases, CRM free usage (analytics only), and paid usage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center">
              <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No AI activity recorded yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                CRM AI features are free and will be logged here for analytics.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={txTypeBadge[tx.type] || "secondary"}>
                        {txTypeLabel[tx.type] || tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {tx.featureKey || "—"}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      {tx.description || "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm ${
                        tx.credits > 0
                          ? "text-green-600"
                          : tx.credits < 0
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {tx.credits > 0 ? "+" : ""}
                      {tx.credits === 0 ? "free" : tx.credits}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {tx.balanceAfter}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
