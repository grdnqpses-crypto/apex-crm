import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
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
                  <Badge className={verifyResult.allPassed ? "bg-emerald-100 text-emerald-700 border-0" : "bg-amber-100 text-amber-700 border-0"}>
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
                              <div className="mt-2">
                                <p className="text-xs font-medium text-red-700 mb-1">Action required:</p>
                                <div className="flex items-start gap-2">
                                  <code className="text-xs bg-white border border-red-200 px-2 py-1.5 rounded-lg text-stone-700 flex-1">{val.recommendation}</code>
                                  <button onClick={() => copyToClipboard(val.recommendation!)} className="p-1 rounded hover:bg-red-100 flex-shrink-0 mt-0.5">
                                    <Copy className="w-3.5 h-3.5 text-red-400" />
                                  </button>
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
                      <p className="font-semibold text-emerald-800">All checks passed!</p>
                      <p className="text-sm text-emerald-700 mt-0.5">Your domain is fully configured for professional email sending.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800">Action required</p>
                      <p className="text-sm text-amber-700 mt-0.5">Add the missing records to your DNS provider, then click Check DNS again. DNS changes can take up to 24 hours to propagate.</p>
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
          {dnsRecords && <DnsRecordTable records={dnsRecords} domain={domain} onCopy={copyToClipboard} onVerify={() => { setPath("existing"); setStep(1); }} />}
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
          {dnsRecords && <DnsRecordTable records={dnsRecords} domain={domain} onCopy={copyToClipboard} onVerify={() => { setPath("existing"); setStep(1); }} />}
        </div>
      )}

      {/* PATH: Start Fresh */}
      {path === "fresh" && (
        <div className="space-y-5">
          <h2 className="font-semibold text-stone-800">Setting up from scratch</h2>

          {/* Step 1: Choose a domain */}
          <Card className="border-stone-200 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">1</div>
                <span className="font-semibold text-stone-800">Choose and purchase a domain name</span>
              </div>
              <p className="text-sm text-stone-600">Your domain is your professional identity. Choose something short, memorable, and related to your business name. Aim for a <code className="text-xs bg-stone-100 px-1 rounded">.com</code> if possible.</p>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="yourbusiness.com"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <Button
                  onClick={async () => {
                    if (!domain.trim()) return;
                    const result = await checkAvailabilityMutation.mutateAsync({ domain: domain.trim() });
                    if (result.available) {
                      toast.success(`${domain} appears to be available! Check a registrar to confirm.`);
                    } else {
                      toast.error(`${domain} is already registered. Try a variation.`);
                    }
                  }}
                  disabled={!domain.trim() || checkAvailabilityMutation.isPending}
                  variant="outline"
                  className="gap-2"
                >
                  {checkAvailabilityMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  Check Availability
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {Object.values(REGISTRAR_LINKS).map(reg => (
                  <a key={reg.name} href={reg.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all group">
                    <span className="text-xl">{reg.logo}</span>
                    <div className="flex-1">
                      <p className="font-medium text-stone-800 text-sm">{reg.name}</p>
                      <p className="text-xs text-stone-500">Purchase domain</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-500" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Set up email hosting */}
          <Card className="border-stone-200 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">2</div>
                <span className="font-semibold text-stone-800">Set up email hosting</span>
              </div>
              <p className="text-sm text-stone-600">We recommend <strong>Google Workspace</strong> ($6/user/month) — it gives you professional Gmail addresses, Google Drive, Meet, and Calendar all in one.</p>
              <div className="flex gap-3">
                <a href="https://workspace.google.com/landing/partners/referral/googleapps.html" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Set Up Google Workspace
                  </Button>
                </a>
                <a href="https://www.microsoft.com/en-us/microsoft-365/business/compare-all-plans" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Microsoft 365 Instead
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Configure DNS */}
          <Card className="border-stone-200 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">3</div>
                <span className="font-semibold text-stone-800">Configure DNS records</span>
              </div>
              <p className="text-sm text-stone-600">Once you have your domain and email hosting, generate the DNS records you need to add to your registrar:</p>
              <div className="flex gap-3 flex-wrap">
                <Button onClick={() => handleGenerateRecords("google")} disabled={!domain.trim() || generateMutation.isPending} className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                  Generate Google Workspace Records
                </Button>
                <Button onClick={() => handleGenerateRecords("microsoft")} disabled={!domain.trim() || generateMutation.isPending} variant="outline" className="gap-2">
                  Generate Microsoft 365 Records
                </Button>
              </div>
              {!domain.trim() && <p className="text-xs text-amber-600">Enter your domain name above first</p>}
            </CardContent>
          </Card>

          {/* Step 4: Verify */}
          {dnsRecords && (
            <>
              <DnsRecordTable records={dnsRecords} domain={domain} onCopy={copyToClipboard} onVerify={() => { setPath("existing"); setStep(1); }} />
              <Card className="border-stone-200 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">4</div>
                    <span className="font-semibold text-stone-800">Verify your setup</span>
                  </div>
                  <p className="text-sm text-stone-600">After adding the DNS records, wait 15-60 minutes for propagation, then verify everything is working:</p>
                  <Button onClick={() => { setPath("existing"); setVerifyResult(null); }} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Verify My Domain Now
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DnsRecordTable({ records, domain, onCopy, onVerify }: {
  records: DnsRecord[];
  domain: string;
  onCopy: (text: string) => void;
  onVerify: () => void;
}) {
  return (
    <Card className="border-stone-200 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-stone-800">DNS Records for {domain}</h3>
          <Badge className="bg-amber-100 text-amber-700 border-0">{records.length} records</Badge>
        </div>
        <p className="text-sm text-stone-600">Add these records to your domain registrar's DNS settings. Copy each value exactly as shown.</p>
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2.5 font-medium text-stone-600">Type</th>
                <th className="text-left px-4 py-2.5 font-medium text-stone-600">Host / Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-stone-600">Value</th>
                <th className="text-left px-4 py-2.5 font-medium text-stone-600">TTL</th>
                <th className="text-right px-4 py-2.5 font-medium text-stone-600">Copy</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, i) => (
                <tr key={i} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50">
                  <td className="px-4 py-3">
                    <Badge className="bg-stone-100 text-stone-700 border-0 font-mono text-xs">{rec.type}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-stone-700 max-w-[120px] truncate">{rec.host}</td>
                  <td className="px-4 py-3 font-mono text-stone-600 max-w-[200px] truncate" title={rec.value}>{rec.value}</td>
                  <td className="px-4 py-3 text-stone-500">{rec.ttl}s{rec.priority !== undefined ? ` (P${rec.priority})` : ""}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onCopy(rec.value)} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
                      <Copy className="w-3.5 h-3.5 text-stone-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 pt-1">
          <Button onClick={onVerify} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Verify My Domain
          </Button>
          <Button variant="outline" onClick={() => onCopy(records.map(r => `${r.type}\t${r.host}\t${r.value}`).join("\n"))} className="gap-2">
            <Copy className="w-4 h-4" />
            Copy All Records
          </Button>
        </div>
        <p className="text-xs text-stone-400">DNS changes can take up to 24 hours to propagate globally. Most changes take effect within 15-60 minutes.</p>
      </CardContent>
    </Card>
  );
}
