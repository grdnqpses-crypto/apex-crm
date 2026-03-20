import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, XCircle, AlertTriangle, Plus, Globe, Loader2, Mail, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";


const AUTH_STATUS_ICONS: Record<string, any> = {
  pass: CheckCircle,
  fail: XCircle,
  missing: AlertTriangle,
  unknown: AlertTriangle,
};
const AUTH_STATUS_COLORS: Record<string, string> = {
  pass: "text-success",
  fail: "text-destructive",
  missing: "text-warning",
  unknown: "text-muted-foreground",
};

export default function Deliverability() {
  const { t } = useSkin();
  const [showAdd, setShowAdd] = useState(false);
  const [checkDomain, setCheckDomain] = useState("");
  const [authResult, setAuthResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const utils = trpc.useUtils();

  const { data: domains, isLoading } = trpc.domainHealth.list.useQuery();
  const addDomain = trpc.domainHealth.create.useMutation({
    onSuccess: () => { utils.domainHealth.list.invalidate(); setShowAdd(false); setCheckDomain(""); toast.success("Domain added"); },
    onError: (e) => toast.error(e.message),
  });
  const checkAuth = trpc.domainHealth.checkAuth.useMutation({
    onSuccess: (data) => { setAuthResult(data); setChecking(false); },
    onError: (e) => { toast.error(e.message); setChecking(false); },
  });

  const handleCheckAuth = (domain: string) => {
    setChecking(true);
    setAuthResult(null);
    setCheckDomain(domain);
    checkAuth.mutate({ domain });
  };

  const warmupPhases = [
    { phase: 1, daily: 50, description: "Initial warm-up: 50 emails/day" },
    { phase: 2, daily: 100, description: "Gradual increase: 100 emails/day" },
    { phase: 3, daily: 250, description: "Building reputation: 250 emails/day" },
    { phase: 4, daily: 500, description: "Moderate volume: 500 emails/day" },
    { phase: 5, daily: 1000, description: "Standard volume: 1,000 emails/day" },
    { phase: 6, daily: 2500, description: "High volume: 2,500 emails/day" },
    { phase: 7, daily: 5000, description: "Full capacity: 5,000+ emails/day" },
  ];

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.deliverability} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Deliverability</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor domain health, authentication, and sender reputation.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Domain
        </Button>
      </div>

      {/* Quick Auth Check */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Authentication Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Check SPF, DKIM, and DMARC configuration for any domain to maximize inbox placement.</p>
          <div className="flex gap-3">
            <Input
              value={checkDomain}
              onChange={(e) => setCheckDomain(e.target.value)}
              placeholder="example.com"
              className="bg-secondary/30 max-w-sm"
            />
            <Button onClick={() => handleCheckAuth(checkDomain)} disabled={!checkDomain.trim() || checking} className="gap-2">
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              {checking ? "Checking..." : "Check Authentication"}
            </Button>
          </div>

          {authResult && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                  <p className={`text-3xl font-bold ${authResult.overallScore >= 80 ? "text-success" : authResult.overallScore >= 50 ? "text-warning" : "text-destructive"}`}>{authResult.overallScore}/100</p>
                </div>
                <p className="text-sm text-muted-foreground max-w-sm text-right">{authResult.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["spf", "dkim", "dmarc"] as const).map((protocol) => {
                  const data = authResult[protocol];
                  if (!data) return null;
                  return (
                    <Card key={protocol} className="bg-secondary/20 border-border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold uppercase text-foreground">{protocol}</span>
                          <Badge variant="secondary" className={`text-[10px] ${data.status === "configured" || data.status === "pass" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                            {data.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-mono break-all">{data.record}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{data.recommendation}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Domain Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-6"><div className="space-y-3 animate-pulse"><div className="h-5 w-32 bg-muted rounded" /><div className="h-4 w-48 bg-muted rounded" /></div></CardContent></Card>
          ))
        ) : domains?.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-card border-border"><CardContent className="p-12 text-center text-muted-foreground">No domains tracked yet. Add a domain to monitor its health.</CardContent></Card>
          </div>
        ) : (
          domains?.map((domain) => {
            const SpfIcon = AUTH_STATUS_ICONS[domain.spfStatus ?? "unknown"];
            const DkimIcon = AUTH_STATUS_ICONS[domain.dkimStatus ?? "unknown"];
            const DmarcIcon = AUTH_STATUS_ICONS[domain.dmarcStatus ?? "unknown"];
            return (
              <Card key={domain.id} className="bg-card border-border">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-foreground">{domain.domain}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleCheckAuth(domain.domain)}>Check</Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <SpfIcon className={`h-4 w-4 ${AUTH_STATUS_COLORS[domain.spfStatus ?? "unknown"]}`} />
                      <span className="text-xs font-medium">SPF</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DkimIcon className={`h-4 w-4 ${AUTH_STATUS_COLORS[domain.dkimStatus ?? "unknown"]}`} />
                      <span className="text-xs font-medium">DKIM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DmarcIcon className={`h-4 w-4 ${AUTH_STATUS_COLORS[domain.dmarcStatus ?? "unknown"]}`} />
                      <span className="text-xs font-medium">DMARC</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Reputation</span>
                      <span className="font-medium text-foreground">{domain.reputationScore ?? 0}/100</span>
                    </div>
                    <Progress value={domain.reputationScore ?? 0} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Warm-up Schedule */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-chart-2" /> IP/Domain Warm-up Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Follow this recommended warm-up schedule to build sender reputation gradually and avoid deliverability issues.</p>
          <div className="space-y-3">
            {warmupPhases.map((phase) => (
              <div key={phase.phase} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/20">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{phase.phase}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{phase.description}</p>
                  <p className="text-xs text-muted-foreground">Week {phase.phase}: Maintain for 7 days before advancing</p>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">{phase.daily.toLocaleString()}/day</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Domain Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Add Domain to Monitor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Domain Name</Label>
              <Input value={checkDomain} onChange={(e) => setCheckDomain(e.target.value)} placeholder="yourdomain.com" className="bg-secondary/30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => { if (!checkDomain.trim()) { toast.error("Domain required"); return; } addDomain.mutate({ domain: checkDomain }); }} disabled={addDomain.isPending}>
              {addDomain.isPending ? "Adding..." : "Add Domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
