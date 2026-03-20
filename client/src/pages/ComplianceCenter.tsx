import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Mail, FileText, Search, BarChart3, Loader2 } from "lucide-react";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { FeatureGate } from "@/components/FeatureGate";
import { useSkin } from "@/contexts/SkinContext";


export default function ComplianceCenter() {
  const { t } = useSkin();
  const [tab, setTab] = useState("overview");
  const stats = trpc.compliance.stats.useQuery();
  const audits = trpc.compliance.audits.useQuery({ limit: 20 });

  // Pre-send check form
  const [checkForm, setCheckForm] = useState({ htmlContent: "", subject: "", fromEmail: "", toEmail: "" });
  const preCheck = trpc.compliance.preCheck.useMutation({ onSuccess: () => toast.success("Compliance check complete") });

  // Email analyzer form
  const [analyzeForm, setAnalyzeForm] = useState({ htmlContent: "", subject: "", fromName: "" });
  const analyzeEmail = trpc.compliance.analyzeEmail.useMutation({ onSuccess: () => toast.success("Analysis complete") });

  return (
      <FeatureGate
        featureKey="compliance_full"
        featureName="Compliance Fortress™ — Full GDPR/CCPA"
        description="Full GDPR consent tracking, CCPA data access/deletion handling, and audit logs. Fortune Foundation and above."
        freemium={false}
      >

    <div className="space-y-6">
      <PageGuide {...pageGuides.complianceCenter} />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-emerald-500" /> Compliance Fortress</h1>
        <p className="text-muted-foreground mt-1">CAN-SPAM, GDPR, CCPA compliance enforcement and email deliverability analysis</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Checks</p>
                <p className="text-2xl font-bold">{stats.data?.total || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-emerald-500">{stats.data?.passed || 0}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-500">{stats.data?.failed || 0}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{stats.data?.passRate || 100}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Audit Log</TabsTrigger>
          <TabsTrigger value="precheck">Pre-Send Check</TabsTrigger>
          <TabsTrigger value="analyzer">AI Email Analyzer</TabsTrigger>
          <TabsTrigger value="rules">Compliance Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Audit Log</CardTitle>
              <CardDescription>Every email is checked against CAN-SPAM, GDPR, and provider-specific requirements before sending</CardDescription>
            </CardHeader>
            <CardContent>
              {audits.data?.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No compliance audits yet. Send your first campaign to see results here.</p>
              ) : (
                <div className="space-y-2">
                  {audits.data?.items.map((audit) => (
                    <div key={audit.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {audit.compliancePassed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                        <div>
                          <p className="text-sm font-medium">{audit.toEmail}</p>
                          <p className="text-xs text-muted-foreground">From: {audit.fromEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {audit.recipientProvider && <Badge variant="outline">{audit.recipientProvider}</Badge>}
                        <Badge variant={audit.compliancePassed ? "default" : "destructive"}>{audit.compliancePassed ? "PASSED" : "BLOCKED"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="precheck" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Send Compliance Check</CardTitle>
              <CardDescription>Test an email against all compliance rules before sending. This checks CAN-SPAM requirements, suppression list, and provider-specific rules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Email</Label>
                  <Input value={checkForm.fromEmail} onChange={e => setCheckForm(f => ({ ...f, fromEmail: e.target.value }))} placeholder="sender@yourdomain.com" />
                </div>
                <div>
                  <Label>To Email</Label>
                  <Input value={checkForm.toEmail} onChange={e => setCheckForm(f => ({ ...f, toEmail: e.target.value }))} placeholder="recipient@gmail.com" />
                </div>
              </div>
              <div>
                <Label>Subject Line</Label>
                <Input value={checkForm.subject} onChange={e => setCheckForm(f => ({ ...f, subject: e.target.value }))} placeholder="Your email subject" />
              </div>
              <div>
                <Label>HTML Content</Label>
                <Textarea value={checkForm.htmlContent} onChange={e => setCheckForm(f => ({ ...f, htmlContent: e.target.value }))} rows={6} placeholder="Paste your email HTML content here..." />
              </div>
              <Button onClick={() => preCheck.mutate(checkForm)} disabled={preCheck.isPending}>
                {preCheck.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Checking...</> : <><Search className="h-4 w-4 mr-2" /> Run Compliance Check</>}
              </Button>

              {preCheck.data && (
                <div className={`p-4 rounded-lg border-2 ${preCheck.data.passed ? 'border-emerald-500 bg-emerald-500/5' : 'border-red-500 bg-red-500/5'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    {preCheck.data.passed ? <ShieldCheck className="h-6 w-6 text-emerald-500" /> : <ShieldAlert className="h-6 w-6 text-red-500" />}
                    <h3 className="font-bold text-lg">{preCheck.data.passed ? 'ALL CHECKS PASSED' : 'COMPLIANCE FAILED — EMAIL BLOCKED'}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(preCheck.data.checks).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {val ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                        <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                      </div>
                    ))}
                  </div>
                  {preCheck.data.failures.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="font-semibold text-red-500">Failures:</p>
                      {preCheck.data.failures.map((f, i) => (
                        <p key={i} className="text-sm text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {f}</p>
                      ))}
                    </div>
                  )}
                  <Badge variant="outline" className="mt-2">Provider: {preCheck.data.recipientProvider}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyzer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Email Deliverability Analyzer</CardTitle>
              <CardDescription>AI-powered deep analysis of your email content for spam triggers, provider-specific risks, and deliverability optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject Line</Label>
                  <Input value={analyzeForm.subject} onChange={e => setAnalyzeForm(f => ({ ...f, subject: e.target.value }))} placeholder="Your email subject" />
                </div>
                <div>
                  <Label>From Name</Label>
                  <Input value={analyzeForm.fromName} onChange={e => setAnalyzeForm(f => ({ ...f, fromName: e.target.value }))} placeholder="Sender Name" />
                </div>
              </div>
              <div>
                <Label>Email HTML Content</Label>
                <Textarea value={analyzeForm.htmlContent} onChange={e => setAnalyzeForm(f => ({ ...f, htmlContent: e.target.value }))} rows={8} placeholder="Paste your full email HTML here for deep analysis..." />
              </div>
              <Button onClick={() => analyzeEmail.mutate(analyzeForm)} disabled={analyzeEmail.isPending}>
                {analyzeEmail.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing with AI...</> : <><Mail className="h-4 w-4 mr-2" /> Analyze Email</>}
              </Button>

              {analyzeEmail.data && (
                <div className="space-y-4">
                  {/* Score Header */}
                  <div className={`p-4 rounded-lg border-2 ${analyzeEmail.data.score >= 80 ? 'border-emerald-500 bg-emerald-500/5' : analyzeEmail.data.score >= 60 ? 'border-yellow-500 bg-yellow-500/5' : 'border-red-500 bg-red-500/5'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Deliverability Score</p>
                        <p className="text-4xl font-bold">{analyzeEmail.data.score}/100</p>
                      </div>
                      <Badge className="text-lg px-3 py-1">{analyzeEmail.data.grade}</Badge>
                    </div>
                  </div>

                  {/* Provider Risks */}
                  <Card>
                    <CardHeader><CardTitle className="text-base">Provider-Specific Risks</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(analyzeEmail.data.providerRisks).map(([provider, risk]) => (
                          <div key={provider} className="p-3 rounded-lg border">
                            <p className="font-semibold capitalize">{provider}</p>
                            <p className="text-sm text-muted-foreground">{risk as string}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Issues */}
                  {analyzeEmail.data.issues.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">Issues Found ({analyzeEmail.data.issues.length})</CardTitle></CardHeader>
                      <CardContent className="space-y-2">
                        {analyzeEmail.data.issues.map((issue: any, i: number) => (
                          <div key={i} className={`p-3 rounded-lg border-l-4 ${issue.severity === 'critical' ? 'border-l-red-500 bg-red-500/5' : issue.severity === 'warning' ? 'border-l-yellow-500 bg-yellow-500/5' : 'border-l-blue-500 bg-blue-500/5'}`}>
                            <div className="flex items-center gap-2">
                              <Badge variant={issue.severity === 'critical' ? 'destructive' : 'outline'} className="text-xs">{issue.severity}</Badge>
                              <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                            </div>
                            <p className="text-sm font-medium mt-1">{issue.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">Fix: {issue.fix}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Subject Analysis */}
                  <Card>
                    <CardHeader><CardTitle className="text-base">Subject Line Analysis</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm">Spam Score: <span className="font-bold">{analyzeEmail.data.subjectAnalysis.spamScore}/100</span></p>
                      {analyzeEmail.data.subjectAnalysis.improvements.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium">Improvements:</p>
                          {analyzeEmail.data.subjectAnalysis.improvements.map((imp: string, i: number) => (
                            <p key={i} className="text-sm text-muted-foreground">• {imp}</p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Content Analysis */}
                  <Card>
                    <CardHeader><CardTitle className="text-base">Content Analysis</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Text-to-Image Ratio:</span> <span className="font-medium">{analyzeEmail.data.contentAnalysis.textToImageRatio}</span></div>
                        <div><span className="text-muted-foreground">Link Density:</span> <span className="font-medium">{analyzeEmail.data.contentAnalysis.linkDensity}</span></div>
                        <div><span className="text-muted-foreground">Readability:</span> <span className="font-medium">{analyzeEmail.data.contentAnalysis.readability}</span></div>
                        {analyzeEmail.data.contentAnalysis.spamWords.length > 0 && (
                          <div><span className="text-muted-foreground">Spam Words:</span> <span className="font-medium text-red-400">{analyzeEmail.data.contentAnalysis.spamWords.join(', ')}</span></div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card>
                    <CardHeader><CardTitle className="text-base">Recommendations</CardTitle></CardHeader>
                    <CardContent className="space-y-1">
                      {analyzeEmail.data.recommendations.map((rec: string, i: number) => (
                        <p key={i} className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> {rec}</p>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enforced Compliance Rules</CardTitle>
              <CardDescription>These rules are automatically enforced on every email before it leaves the system. Non-compliant emails are blocked.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { law: "CAN-SPAM Act (USA)", rules: ["Physical mailing address required in every email", "Functional unsubscribe link required", "Honor opt-outs within 10 business days", "No deceptive subject lines", "Identify commercial messages", "No harvested email addresses"], penalty: "Up to $51,744 per email" },
                  { law: "GDPR (EU)", rules: ["Explicit consent required for marketing emails", "Right to erasure (unsubscribe = permanent removal)", "Data processing transparency", "Privacy policy link required"], penalty: "Up to €20M or 4% of annual revenue" },
                  { law: "CCPA (California)", rules: ["Right to opt-out of data sale", "Privacy notice required", "Do Not Sell link for California residents"], penalty: "Up to $7,500 per intentional violation" },
                  { law: "Gmail Requirements (2024+)", rules: ["One-click unsubscribe (RFC 8058)", "SPF and DKIM authentication required", "DMARC policy required", "Spam complaint rate below 0.10%", "Valid forward and reverse DNS"], penalty: "Emails rejected or sent to spam" },
                  { law: "Outlook/Microsoft Requirements (2025+)", rules: ["SPF, DKIM, DMARC all required for bulk senders", "One-click unsubscribe required", "Complaint rate monitoring", "Sender reputation scoring"], penalty: "Emails rejected at gateway" },
                  { law: "Yahoo Requirements (2024+)", rules: ["SPF or DKIM authentication required", "DMARC policy required", "One-click unsubscribe for bulk", "Low complaint rate required"], penalty: "Emails throttled or rejected" },
                ].map((section) => (
                  <div key={section.law} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{section.law}</h3>
                      <Badge variant="outline" className="text-xs">{section.penalty}</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {section.rules.map((rule, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{rule}</span>
                          <Badge variant="default" className="text-xs ml-auto">ENFORCED</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  
      </FeatureGate>);
}
