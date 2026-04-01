import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import { DnsRecordGuide } from "@/components/DnsRecordGuide";
import {
  Mail, Globe, CheckCircle2, XCircle, AlertCircle, Copy, RefreshCw,
  ArrowLeft, ArrowRight, Wifi, Building2, Sparkles, ExternalLink,
  Shield, Zap, Server, ChevronRight
} from "lucide-react";

type Path = "existing" | "google" | "microsoft" | "fresh" | null;
type VerifyResult = {
  domain: string;
  allPassed: boolean;
  results: Record<string, { found: boolean; value?: string; recommendation?: string }>;
};
type DnsRecord = { type: string; host: string; value: string; ttl: number; priority?: number };

const RECORD_LABELS: Record<string, { label: string; description: string }> = {
  mx: { label: "MX Record", description: "Routes incoming email to your mail server" },
  spf: { label: "SPF Record", description: "Proves your domain is authorized to send email" },
  dkim: { label: "DKIM Record", description: "Cryptographically signs outgoing emails" },
  dmarc: { label: "DMARC Record", description: "Tells receivers what to do with unauthenticated email" },
};

const REGISTRAR_LINKS: Record<string, { name: string; url: string; logo: string }> = {
  namecheap: { name: "Namecheap", url: "https://www.namecheap.com/domains/", logo: "🟠" },
  godaddy: { name: "GoDaddy", url: "https://www.godaddy.com/domains", logo: "🟢" },
  cloudflare: { name: "Cloudflare", url: "https://www.cloudflare.com/products/registrar/", logo: "🟡" },
  google: { name: "Google Domains", url: "https://domains.google/", logo: "🔵" },
};

export default function EmailSetup() {
  const { t } = useSkin();
  const [, navigate] = useLocation();
  const [path, setPath] = useState<Path>(null);
  const [domain, setDomain] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[] | null>(null);
  const [step, setStep] = useState(1);
  const [guideOpen, setGuideOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{ type: string; value: string } | null>(null);

  const verifyMutation = trpc.emailSetup.verifyDomain.useMutation();
  const generateMutation = trpc.emailSetup.generateDnsRecords.useMutation();
  const checkAvailabilityMutation = trpc.emailSetup.checkDomainAvailability.useMutation();

  const handleVerify = async () => {
    if (!domain.trim()) return;
    try {
      const result = await verifyMutation.mutateAsync({ domain: domain.trim() });
      setVerifyResult(result as VerifyResult);
    } catch {
      toast.error("Could not verify domain. Please check the domain name and try again.");
    }
  };

  const handleGenerateRecords = async (provider: "google" | "microsoft" | "custom") => {
    if (!domain.trim()) return;
    try {
      const result = await generateMutation.mutateAsync({ domain: domain.trim(), provider });
      setDnsRecords(result.records);
      setStep(3);
    } catch {
      toast.error("Could not generate DNS records.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const passedCount = verifyResult ? Object.values(verifyResult.results).filter(r => r.found).length : 0;
  const totalChecks = verifyResult ? Object.keys(verifyResult.results).length : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => { if (path) { setPath(null); setStep(1); setVerifyResult(null); setDnsRecords(null); } else navigate("/settings"); }} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-stone-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Email Infrastructure Setup</h1>
          <p className="text-stone-500 text-sm mt-0.5">Configure your domain for professional email sending</p>
        </div>
      </div>

      {/* Why this matters */}
      {!path && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Shield, title: "Inbox Delivery", desc: "SPF, DKIM & DMARC prevent your emails landing in spam", color: "text-emerald-600 bg-emerald-50" },
            { icon: Zap, title: "Higher Open Rates", desc: "Authenticated domains see 2-3× better open rates", color: "text-amber-600 bg-amber-50" },
            { icon: Server, title: "Brand Trust", desc: "Your company domain builds credibility with prospects", color: "text-blue-600 bg-blue-50" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <Card key={title} className="border-stone-200 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-stone-800 text-sm">{title}</p>
                <p className="text-xs text-stone-500 mt-1">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Path Selection */}
      {!path && (
        <div className="space-y-3">
          <h2 className="font-semibold text-stone-800">Choose your setup path</h2>
          {[
            {
              id: "existing" as Path,
              icon: Globe,
              title: "I already have a domain",
              desc: "Verify and configure DNS records for your existing domain",
              badge: "Most common",
              badgeColor: "bg-emerald-100 text-emerald-700",
            },
            {
              id: "google" as Path,
              icon: Mail,
              title: "I use Google Workspace",
              desc: "Get the exact DNS records to add for Gmail / Google Workspace",
              badge: "Recommended",
              badgeColor: "bg-blue-100 text-blue-700",
            },
            {
              id: "microsoft" as Path,
              icon: Building2,
              title: "I use Microsoft 365 / Outlook",
              desc: "Get the exact DNS records to add for Microsoft 365",
              badge: null,
              badgeColor: "",
            },
            {
              id: "fresh" as Path,
              icon: Sparkles,
              title: "I need to set up everything from scratch",
              desc: "Step-by-step guide to purchase a domain and configure email",
              badge: "New business",
              badgeColor: "bg-amber-100 text-amber-700",
            },
          ].map(({ id, icon: Icon, title, desc, badge, badgeColor }) => (
            <button
              key={id}
              onClick={() => setPath(id)}
              className="w-full text-left p-4 rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all group flex items-center gap-4 shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors flex-shrink-0">
                <Icon className="w-5 h-5 text-stone-600 group-hover:text-amber-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-800">{title}</span>
                  {badge && <Badge className={`text-xs border-0 ${badgeColor}`}>{badge}</Badge>}
                </div>
                <p className="text-sm text-stone-500 mt-0.5">{desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-amber-500 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* PATH: Existing Domain */}
      {path === "existing" && (
        <div className="space-y-5">
          <h2 className="font-semibold text-stone-800">Verify your domain's email configuration</h2>

          {/* Step 1: Enter domain */}
          <Card className="border-stone-200 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">1</div>
                <span className="font-medium text-stone-800">Enter your domain</span>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
                  onKeyDown={e => e.key === "Enter" && handleVerify()}
                />
                <Button
                  onClick={handleVerify}
                  disabled={!domain.trim() || verifyMutation.isPending}
                  className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
                >
                  {verifyMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                  Check DNS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {verifyResult && (
            <Card className="border-stone-200 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">2</div>
                    <span className="font-medium text-stone-800">DNS Check Results — {verifyResult.domain}</span>
                  </div>
                  <Badge className={verifyResult.allPassed ? "bg-emerald-100 text-emerald-700 border-0" : "bg-red-100 text-red-700 border-0"}>
                    {passedCount}/{totalChecks} Passing
                  </Badge>
                </div>

                <div className="space-y-3">
                  {Object.entries(verifyResult.results).map(([key, val]) => {
                    const label = RECORD_LABELS[key] ?? { label: key.toUpperCase(), description: "" };
                    return (
                      <div key={key} className={`p-4 rounded-xl border ${val.found ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"}`}>
                        <div className="flex items-start gap-3">
                          {val.found
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          }
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-stone-800 text-sm">{label.label}</span>
                              <span className="text-xs text-stone-500">{label.description}</span>
                            </div>
                            {val.found && val.value && (
                              <div className="mt-1.5 flex items-center gap-2">
                                <code className="text-xs bg-white border border-stone-200 px-2 py-1 rounded-lg text-stone-700 truncate max-w-[400px]">{val.value}</code>
                                <button onClick={() => copyToClipboard(val.value!)} className="p-1 rounded hover:bg-stone-100">
                                  <Copy className="w-3.5 h-3.5 text-stone-400" />
                                </button>
                              </div>
                            )}
                            {!val.found && val.recommendation && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                  <p className="text-xs font-semibold text-red-700">Action Required: Add {key.toUpperCase()} Record</p>
                                  <button 
                                    onClick={() => { 
                                      setSelectedRecord({ type: key, value: val.recommendation! }); 
                                      setGuideOpen(true); 
                                    }} 
                                    className="ml-auto text-xs text-blue-600 hover:text-blue-700 underline font-medium"
                                  >
                                    View Step-by-Step Guide →
                                  </button>
                                </div>
                                <div className="bg-white border border-red-200 rounded-lg p-3 space-y-2">
                                  <p className="text-xs text-stone-600 font-medium">Record Value (copy this):</p>
                                  <div className="flex items-start gap-2">
                                    <code className="text-xs bg-stone-50 border border-stone-200 px-2 py-1.5 rounded-lg text-stone-700 flex-1 break-all font-mono">{val.recommendation}</code>
                                    <button onClick={() => copyToClipboard(val.recommendation!)} className="p-1 rounded hover:bg-blue-100 flex-shrink-0 mt-0.5">
                                      <Copy className="w-4 h-4 text-blue-500" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {verifyResult.allPassed ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-800">✓ All checks passed!</p>
                      <p className="text-sm text-emerald-700 mt-0.5">Your domain is fully configured for professional email sending.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-800">⚠ Action Required: Add Missing DNS Records</p>
                        <p className="text-sm text-red-700 mt-0.5">Click "View Step-by-Step Guide" next to each missing record above for detailed instructions for your registrar (GoDaddy, Namecheap, Cloudflare, etc.)</p>
                      </div>
                    </div>
                    <div className="bg-white border border-red-200 rounded-lg p-3 text-xs text-stone-600 space-y-1">
                      <p className="font-semibold text-stone-700">Quick Timeline:</p>
                      <ul className="list-disc list-inside space-y-1 text-stone-600">
                        <li>Add records to your registrar (5-10 minutes)</li>
                        <li>DNS propagates globally (5 minutes to 24 hours)</li>
                        <li>Click "Re-check DNS" to verify</li>
                      </ul>
                    </div>
                  </div>
                )}

                <Button variant="outline" onClick={handleVerify} disabled={verifyMutation.isPending} className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${verifyMutation.isPending ? "animate-spin" : ""}`} />
                  Re-check DNS
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* DNS Record Guide Modal */}
      {selectedRecord && (
        <DnsRecordGuide
          recordType={selectedRecord.type as "spf" | "dkim" | "dmarc" | "mx"}
          domain={domain}
          recordValue={selectedRecord.value}
          isOpen={guideOpen}
          onClose={() => setGuideOpen(false)}
        />
      )}

      {/* PATH: Google Workspace */}
      {path === "google" && (
        <div className="space-y-5">
          <h2 className="font-semibold text-stone-800">Google Workspace DNS Records</h2>
          {step === 1 && (
            <Card className="border-stone-200 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <p className="text-sm text-stone-600">Enter your domain and we'll generate the exact DNS records you need to add to your registrar for Google Workspace to work correctly.</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="yourdomain.com"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <Button onClick={() => handleGenerateRecords("google")} disabled={!domain.trim() || generateMutation.isPending} className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                    {generateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Generate Records
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* PATH: Microsoft 365 */}
      {path === "microsoft" && (
        <div className="space-y-5">
          <h2 className="font-semibold text-stone-800">Microsoft 365 DNS Records</h2>
          {step === 1 && (
            <Card className="border-stone-200 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <p className="text-sm text-stone-600">Enter your domain to generate the DNS records required for Microsoft 365 / Outlook email to work with your domain.</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="yourdomain.com"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <Button onClick={() => handleGenerateRecords("microsoft")} disabled={!domain.trim() || generateMutation.isPending} className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                    {generateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Generate Records
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* PATH: Start Fresh */}
      {path === "fresh" && (
        <div className="space-y-5">
          <h2 className="font-semibold text-stone-800">Setting up from scratch</h2>
          <Card className="border-stone-200 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-stone-600">Coming soon: Complete guide to purchase a domain and set up email from scratch.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
