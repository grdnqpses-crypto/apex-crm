import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Flame, TrendingUp, Pause, Play, Plus, Mail, Server, Zap,
  ChevronRight, ChevronLeft, CheckCircle, Info, Shield, Clock,
  ArrowRight, AlertCircle
} from "lucide-react";

type WizardStep = 1 | 2 | 3 | 4;

interface WizardData {
  // Step 1: Email Account
  smtpAccountId?: number;
  // Or new account fields
  emailAddress?: string;
  displayName?: string;
  domain?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  useTls?: boolean;
  // Step 2: Warmup Config
  dailyTarget?: number;
  startingVolume?: number;
  rampUpDays?: number;
}

export default function EmailWarmup() {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [useExistingAccount, setUseExistingAccount] = useState(true);

  const campaigns = trpc.emailWarmup.list.useQuery();
  const smtpAccounts = trpc.smtpAccounts.list.useQuery();
  const utils = trpc.useUtils();

  const createSmtpAccount = trpc.smtpAccounts.create.useMutation({
    onSuccess: (data) => {
      setWizardData(prev => ({ ...prev, smtpAccountId: data.id }));
      utils.smtpAccounts.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const createCampaign = trpc.emailWarmup.create.useMutation({
    onSuccess: () => {
      campaigns.refetch();
      setShowWizard(false);
      setWizardStep(1);
      setWizardData({});
      toast.success("Email warmup campaign started!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateCampaign = trpc.emailWarmup.update.useMutation({
    onSuccess: () => { campaigns.refetch(); toast.success("Campaign updated"); },
  });

  const handleNext = async () => {
    if (wizardStep === 1) {
      // If creating new account, do it now
      if (!useExistingAccount && wizardData.emailAddress && wizardData.smtpHost) {
        await createSmtpAccount.mutateAsync({
          emailAddress: wizardData.emailAddress,
          displayName: wizardData.displayName,
          domain: wizardData.domain || wizardData.emailAddress.split("@")[1],
          smtpHost: wizardData.smtpHost,
          smtpPort: wizardData.smtpPort || 587,
          smtpUsername: wizardData.smtpUsername || wizardData.emailAddress,
          smtpPassword: wizardData.smtpPassword || "",
          useTls: wizardData.useTls ?? true,
        });
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      setWizardStep(3);
    } else if (wizardStep === 3) {
      setWizardStep(4);
    } else if (wizardStep === 4) {
      // Launch
      const accountId = wizardData.smtpAccountId || smtpAccounts.data?.[0]?.id;
      if (!accountId) { toast.error("Please select an email account"); return; }
      const domain = wizardData.domain || smtpAccounts.data?.find((a: any) => a.id === accountId)?.domain || "";
      createCampaign.mutate({
        smtpAccountId: accountId,
        domain,
        dailyTarget: wizardData.dailyTarget || 50,
      });
    }
  };

  const canProceed = () => {
    if (wizardStep === 1) {
      if (useExistingAccount) return !!wizardData.smtpAccountId || (smtpAccounts.data?.length ?? 0) > 0;
      return !!(wizardData.emailAddress && wizardData.smtpHost && wizardData.smtpPassword);
    }
    if (wizardStep === 2) return !!(wizardData.dailyTarget);
    return true;
  };

  const selectedAccount = smtpAccounts.data?.find((a: any) => a.id === wizardData.smtpAccountId) || smtpAccounts.data?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Warmup</h1>
          <p className="text-muted-foreground">Gradually build your domain's sending reputation to land in the inbox, not spam</p>
        </div>
        <Button onClick={() => { setShowWizard(true); setWizardStep(1); setWizardData({}); }}>
          <Plus className="w-4 h-4 mr-2" />New Warmup Campaign
        </Button>
      </div>

      {/* How It Works Banner */}
      <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-orange-400 mb-1">How Email Warmup Works</p>
              <p className="text-muted-foreground">
                Apex automatically sends small batches of real-looking emails to a network of trusted seed inboxes. These inboxes
                open, reply, and mark your emails as "not spam" — signaling to Gmail, Outlook, and other providers that your domain
                is legitimate. Over 30–60 days, your daily sending limit ramps up safely from ~5 to 500+ emails/day.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Warmups", value: campaigns.data?.filter((c: any) => c.status === "active").length || 0, icon: Flame, color: "text-orange-400" },
          { label: "Completed", value: campaigns.data?.filter((c: any) => c.status === "completed").length || 0, icon: TrendingUp, color: "text-green-400" },
          { label: "Paused", value: campaigns.data?.filter((c: any) => c.status === "paused").length || 0, icon: Pause, color: "text-yellow-400" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
              <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="space-y-3">
        {campaigns.data?.map((c: any) => (
          <Card key={c.id} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.status === "active" ? "bg-orange-500/10" : "bg-gray-500/10"}`}>
                  <Flame className={`w-5 h-5 ${c.status === "active" ? "text-orange-400" : "text-gray-400"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.domain}</span>
                    <Badge className={c.status === "active" ? "bg-orange-500/20 text-orange-400 border-0" : c.status === "completed" ? "bg-green-500/20 text-green-400 border-0" : "bg-gray-500/20 border-0"}>
                      {c.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Day {c.currentDay || 0}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.currentDailyLimit || 0} emails/day</span>
                    <span>Target: {c.dailyTarget || 0}/day</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs text-muted-foreground">
                  <div>{Math.round(Math.min(100, ((c.currentDailyLimit || 0) / (c.dailyTarget || 1)) * 100))}% of target</div>
                  <div className="w-32 h-2 rounded-full bg-muted overflow-hidden mt-1">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min(100, ((c.currentDailyLimit || 0) / (c.dailyTarget || 1)) * 100)}%` }} />
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => updateCampaign.mutate({ id: c.id, status: c.status === "active" ? "paused" : "active" })}>
                  {c.status === "active" ? <><Pause className="w-4 h-4 mr-1" />Pause</> : <><Play className="w-4 h-4 mr-1" />Resume</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!campaigns.data || campaigns.data.length === 0) && (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="p-12 text-center">
              <Flame className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No warmup campaigns yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Start warming up a domain to build your sending reputation and land in the inbox</p>
              <Button onClick={() => { setShowWizard(true); setWizardStep(1); setWizardData({}); }}>
                <Plus className="w-4 h-4 mr-2" />Start Your First Warmup
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={(open) => { if (!open) { setShowWizard(false); setWizardStep(1); setWizardData({}); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              New Email Warmup Campaign
            </DialogTitle>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 py-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  wizardStep > step ? "bg-green-500 text-white" :
                  wizardStep === step ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {wizardStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                {step < 4 && <div className={`h-0.5 flex-1 rounded ${wizardStep > step ? "bg-green-500" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground -mt-1 mb-2">
            <span>Email Account</span>
            <span>Configure</span>
            <span>What It Sends</span>
            <span>Launch</span>
          </div>

          {/* Step 1: Email Account */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Connect Your Email Account</h3>
                <p className="text-sm text-muted-foreground">Choose an existing SMTP account or add a new one to warm up.</p>
              </div>

              {smtpAccounts.data && smtpAccounts.data.length > 0 && (
                <div className="flex gap-2 mb-3">
                  <Button variant={useExistingAccount ? "default" : "outline"} size="sm" onClick={() => setUseExistingAccount(true)}>Use Existing Account</Button>
                  <Button variant={!useExistingAccount ? "default" : "outline"} size="sm" onClick={() => setUseExistingAccount(false)}>Add New Account</Button>
                </div>
              )}

              {(useExistingAccount && smtpAccounts.data && smtpAccounts.data.length > 0) ? (
                <div className="space-y-2">
                  {smtpAccounts.data.map((account: any) => (
                    <div
                      key={account.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${wizardData.smtpAccountId === account.id || (!wizardData.smtpAccountId && smtpAccounts.data?.[0]?.id === account.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                      onClick={() => setWizardData(prev => ({ ...prev, smtpAccountId: account.id, domain: account.domain }))}
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{account.emailAddress}</p>
                          <p className="text-xs text-muted-foreground">{account.domain} · {account.smtpHost}</p>
                        </div>
                        {(wizardData.smtpAccountId === account.id || (!wizardData.smtpAccountId && smtpAccounts.data?.[0]?.id === account.id)) && (
                          <CheckCircle className="w-4 h-4 text-primary ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label>Email Address</Label>
                      <Input placeholder="you@yourdomain.com" value={wizardData.emailAddress || ""} onChange={e => setWizardData(prev => ({ ...prev, emailAddress: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Display Name</Label>
                      <Input placeholder="Your Name" value={wizardData.displayName || ""} onChange={e => setWizardData(prev => ({ ...prev, displayName: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>SMTP Host</Label>
                      <Input placeholder="smtp.gmail.com" value={wizardData.smtpHost || ""} onChange={e => setWizardData(prev => ({ ...prev, smtpHost: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>SMTP Port</Label>
                      <Input type="number" placeholder="587" value={wizardData.smtpPort || ""} onChange={e => setWizardData(prev => ({ ...prev, smtpPort: Number(e.target.value) }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Username</Label>
                      <Input placeholder="your@email.com" value={wizardData.smtpUsername || ""} onChange={e => setWizardData(prev => ({ ...prev, smtpUsername: e.target.value }))} />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Password / App Password</Label>
                      <Input type="password" placeholder="••••••••" value={wizardData.smtpPassword || ""} onChange={e => setWizardData(prev => ({ ...prev, smtpPassword: e.target.value }))} />
                      <p className="text-xs text-muted-foreground">For Gmail, use an App Password from your Google Account security settings.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Configure */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Configure Your Warmup</h3>
                <p className="text-sm text-muted-foreground">Set your target sending volume. Apex will ramp up gradually to reach it safely.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Daily Email Target</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="50"
                      value={wizardData.dailyTarget || ""}
                      onChange={e => setWizardData(prev => ({ ...prev, dailyTarget: Number(e.target.value) }))}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">emails/day (recommended: 50–200)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ramp-Up Period</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "30 days", desc: "Conservative", days: 30 },
                      { label: "45 days", desc: "Recommended", days: 45 },
                      { label: "60 days", desc: "Aggressive", days: 60 },
                    ].map(opt => (
                      <div
                        key={opt.days}
                        className={`p-3 rounded-lg border cursor-pointer text-center transition-colors ${wizardData.rampUpDays === opt.days ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                        onClick={() => setWizardData(prev => ({ ...prev, rampUpDays: opt.days }))}
                      >
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="p-3 text-sm">
                    <p className="font-medium mb-1">Estimated Schedule</p>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <span>Start: ~5 emails/day</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>Week 2: ~15 emails/day</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>Target: {wizardData.dailyTarget || 50} emails/day</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 3: What It Sends */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">What Emails Does It Send?</h3>
                <p className="text-sm text-muted-foreground">Understanding the warmup process so you know exactly what to expect.</p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    icon: Mail,
                    color: "text-blue-400",
                    bg: "bg-blue-500/10",
                    title: "Real-Looking Emails",
                    desc: "Apex sends natural, conversational emails (not marketing blasts) to a network of seed inboxes. Topics include business greetings, follow-ups, and short conversations — nothing that looks like spam."
                  },
                  {
                    icon: Shield,
                    color: "text-green-400",
                    bg: "bg-green-500/10",
                    title: "Seed Inbox Network",
                    desc: "Our network of 50,000+ seed inboxes automatically opens, reads, replies to, and marks your emails as important. This positive engagement signals to email providers that your domain is trusted."
                  },
                  {
                    icon: TrendingUp,
                    color: "text-orange-400",
                    bg: "bg-orange-500/10",
                    title: "Gradual Volume Increase",
                    desc: "Starting at 5 emails/day and increasing by ~10% daily, the warmup mimics natural human sending patterns. Sudden volume spikes are the #1 cause of spam flags — we avoid them entirely."
                  },
                  {
                    icon: Zap,
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                    title: "Fully Automated",
                    desc: "Once started, the warmup runs automatically every day. You'll see your domain health score and inbox placement rate improve in real time on this dashboard."
                  },
                ].map(item => (
                  <div key={item.title} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Launch Review */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Ready to Launch</h3>
                <p className="text-sm text-muted-foreground">Review your warmup configuration before starting.</p>
              </div>
              <Card className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email Account</span>
                    <span className="font-medium">{selectedAccount?.emailAddress || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Domain</span>
                    <span className="font-medium">{wizardData.domain || selectedAccount?.domain || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily Target</span>
                    <span className="font-medium">{wizardData.dailyTarget || 50} emails/day</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ramp-Up Period</span>
                    <span className="font-medium">{wizardData.rampUpDays || 45} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Starting Volume</span>
                    <span className="font-medium">~5 emails/day</span>
                  </div>
                </CardContent>
              </Card>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-amber-400">Important:</strong> Do not send large marketing campaigns from this domain during the warmup period. Let the warmup complete before sending bulk emails.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => wizardStep === 1 ? setShowWizard(false) : setWizardStep(prev => (prev - 1) as WizardStep)}>
              {wizardStep === 1 ? "Cancel" : <><ChevronLeft className="w-4 h-4 mr-1" />Back</>}
            </Button>
            <Button onClick={handleNext} disabled={!canProceed() || createCampaign.isPending || createSmtpAccount.isPending}>
              {wizardStep === 4 ? (
                createCampaign.isPending ? "Launching..." : <><Flame className="w-4 h-4 mr-1" />Launch Warmup</>
              ) : (
                <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
