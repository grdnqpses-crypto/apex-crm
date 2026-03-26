import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { DollarSign, Globe, RefreshCw, Check, X, Plus, Loader2 } from "lucide-react";

export default function MultiCurrencySettings() {
  const { data: supported = [] } = trpc.currency.getSupportedCurrencies.useQuery();
  const { data: settings, refetch } = trpc.currency.getSettings.useQuery();
  const updateMutation = trpc.currency.updateSettings.useMutation();

  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>(["USD"]);
  const [customRates, setCustomRates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setBaseCurrency(settings.baseCurrency ?? "USD");
      setEnabledCurrencies((settings.enabledCurrencies as string[]) ?? ["USD"]);
      const rates = (settings.exchangeRates as Record<string, number>) ?? {};
      const rateStrings: Record<string, string> = {};
      for (const [k, v] of Object.entries(rates)) rateStrings[k] = String(v);
      setCustomRates(rateStrings);
    }
  }, [settings]);

  const toggleCurrency = (code: string) => {
    if (code === baseCurrency) return; // can't disable base
    setEnabledCurrencies(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rates: Record<string, number> = {};
      for (const [k, v] of Object.entries(customRates)) {
        const n = parseFloat(v);
        if (!isNaN(n) && n > 0) rates[k] = n;
      }
      await updateMutation.mutateAsync({ baseCurrency, enabledCurrencies, exchangeRates: rates });
      toast.success("Currency settings saved");
      refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const enabledSet = new Set(enabledCurrencies);

  return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Multi-Currency Settings</h1>
            <p className="text-sm text-muted-foreground">Configure currencies and exchange rates for your workspace</p>
          </div>
        </div>

        {/* Base Currency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Base Currency
            </CardTitle>
            <CardDescription>All deal values are stored in this currency. Changing it does not convert existing records.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs">
              <Label>Base Currency</Label>
              <Select value={baseCurrency} onValueChange={v => { setBaseCurrency(v); if (!enabledSet.has(v)) setEnabledCurrencies(prev => [...prev, v]); }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supported.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-mono mr-2">{c.code}</span> {c.name} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enabled Currencies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Enabled Currencies
            </CardTitle>
            <CardDescription>Users can record deal values in any enabled currency. Click to toggle.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {supported.map(c => {
                const isEnabled = enabledSet.has(c.code);
                const isBase = c.code === baseCurrency;
                return (
                  <button
                    key={c.code}
                    onClick={() => toggleCurrency(c.code)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                      isEnabled
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="font-mono font-bold text-sm w-8">{c.code}</span>
                    <span className="text-xs flex-1 truncate">{c.name}</span>
                    {isBase ? (
                      <Badge variant="secondary" className="text-xs px-1">Base</Badge>
                    ) : isEnabled ? (
                      <Check className="h-3 w-3 flex-shrink-0" />
                    ) : (
                      <Plus className="h-3 w-3 flex-shrink-0 opacity-40" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Exchange Rates
            </CardTitle>
            <CardDescription>
              Rates relative to USD. Pre-filled with market rates — override as needed.
              Format: 1 USD = X {baseCurrency !== "USD" ? baseCurrency : "currency"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {supported.filter(c => enabledSet.has(c.code) && c.code !== "USD").map(c => (
                <div key={c.code}>
                  <Label className="text-xs text-muted-foreground">1 USD → {c.code}</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={customRates[c.code] ?? ""}
                    onChange={e => setCustomRates(prev => ({ ...prev, [c.code]: e.target.value }))}
                    placeholder={c.code === "EUR" ? "0.92" : "..."}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
              ))}
              {enabledCurrencies.filter(c => c !== "USD").length === 0 && (
                <p className="text-sm text-muted-foreground col-span-4">Enable additional currencies above to configure their exchange rates.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </div>
  );
}
