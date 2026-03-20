import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import PageGuide from "@/components/PageGuide";
import { useSkin } from "@/contexts/SkinContext";
import {
  FlaskConical, Sparkles, BarChart3, Target, Trophy,
  Copy, RefreshCw, ArrowRight, CheckCircle2, XCircle,
  Lightbulb, Clock, TrendingUp, Zap,
} from "lucide-react";

export default function ABEngine() {
  const { t } = useSkin();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("B2B freight brokers");
  const [tone, setTone] = useState("professional");
  const [generatedVariants, setGeneratedVariants] = useState<string[]>([]);
  const [aiVariants, setAiVariants] = useState<string[]>([]);

  // Significance calculator state
  const [controlSent, setControlSent] = useState(1000);
  const [controlOpens, setControlOpens] = useState(200);
  const [variantSent, setVariantSent] = useState(1000);
  const [variantOpens, setVariantOpens] = useState(250);

  // Sample size calculator state
  const [baselineRate, setBaselineRate] = useState(0.20);
  const [mde, setMde] = useState(0.05);
  const [confidenceLevel, setConfidenceLevel] = useState("0.95");

  const activeTests = trpc.abEngine.activeTests.useQuery();

  const generateVariants = trpc.abEngine.generateVariants.useMutation({
    onSuccess: (data) => {
      setGeneratedVariants(data.subjectVariants);
      toast.success(`Generated ${data.subjectVariants.length} subject variants and ${data.contentTips.length} content tips`);
    },
  });

  const aiGenerate = trpc.abEngine.aiGenerateSubjects.useMutation({
    onSuccess: (data) => {
      setAiVariants(data as string[]);
      toast.success(`AI generated ${(data as string[]).length} subject line variants`);
    },
  });

  const significance = trpc.abEngine.checkSignificance.useQuery(
    { controlSent, controlOpens, variantSent, variantOpens },
    { enabled: controlSent > 0 && variantSent > 0 }
  );

  const sampleSize = trpc.abEngine.sampleSize.useQuery(
    { baselineRate, minimumDetectableEffect: mde, confidenceLevel: parseFloat(confidenceLevel) },
    { enabled: baselineRate > 0 && mde > 0 }
  );

  const variantData = useMemo(() => generateVariants.data, [generateVariants.data]);

  return (
    <div className="space-y-6">
      <PageGuide
        title="Continuous A/B Testing Engine"
        description="Automatically test and optimize every email campaign. Generate variants, measure significance, and let the system pick winners."
        sections={[
          { title: "How It Works", icon: "purpose", content: "Every campaign automatically splits into variants. The engine tests subject lines, send times, and content, then measures statistical significance to declare winners." },
          { title: "AI-Powered Variants", icon: "actions", content: "Use AI to generate psychologically-optimized subject lines targeting urgency, curiosity, personalization, benefits, and social proof." },
          { title: "Statistical Rigor", icon: "outcomes", content: "Results are only declared significant at 95% confidence. The engine calculates minimum sample sizes to ensure reliable results." },
        ]}
      />

      <Tabs defaultValue="generate">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="generate"><Sparkles className="w-4 h-4 mr-1" />Generate</TabsTrigger>
          <TabsTrigger value="active"><FlaskConical className="w-4 h-4 mr-1" />Active Tests</TabsTrigger>
          <TabsTrigger value="significance"><BarChart3 className="w-4 h-4 mr-1" />Significance</TabsTrigger>
          <TabsTrigger value="calculator"><Target className="w-4 h-4 mr-1" />Sample Size</TabsTrigger>
        </TabsList>

        {/* Generate Variants Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" />Generate A/B Variants</CardTitle>
                <CardDescription>Enter your campaign subject and content to generate optimized variants.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Subject Line</Label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Grow Your Brokerage with REALM CRM" />
                </div>
                <div>
                  <Label>Email Content (brief summary)</Label>
                  <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Brief description of the email content..." rows={3} />
                </div>
                <Button onClick={() => generateVariants.mutate({ subject, content })} disabled={!subject || generateVariants.isPending} className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  {generateVariants.isPending ? "Generating..." : "Generate Rule-Based Variants"}
                </Button>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />AI-Powered Generation</h4>
                  <div>
                    <Label>Target Audience</Label>
                    <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
                  </div>
                  <div>
                    <Label>Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={() => aiGenerate.mutate({ originalSubject: subject, targetAudience, tone })} disabled={!subject || aiGenerate.isPending} className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    {aiGenerate.isPending ? "AI Generating..." : "Generate AI Subject Lines"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              {/* Rule-based variants */}
              {generatedVariants.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Rule-Based Variants</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {generatedVariants.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <Badge variant="outline" className="shrink-0">V{i + 1}</Badge>
                        <span className="text-sm flex-1">{v}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(v); toast.success("Copied!"); }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* AI variants */}
              {aiVariants.length > 0 && (
                <Card className="border-amber-500/30">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />AI-Generated Variants</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {aiVariants.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded bg-amber-500/5">
                        <Badge className="bg-amber-500 shrink-0">AI-{i + 1}</Badge>
                        <span className="text-sm flex-1">{v}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(v); toast.success("Copied!"); }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Content tips */}
              {variantData?.contentTips && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-blue-500" />Content Optimization Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {variantData.contentTips.map((tip: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Send time variants */}
              {variantData?.sendTimeVariants && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-500" />Optimal Send Times</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {variantData.sendTimeVariants.map((time: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                        <Badge variant="outline" className="shrink-0">#{i + 1}</Badge>
                        <span>{time}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Active Tests Tab */}
        <TabsContent value="active" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Active A/B Tests</h3>
            <Button variant="outline" size="sm" onClick={() => activeTests.refetch()}>
              <RefreshCw className="w-4 h-4 mr-1" />Refresh
            </Button>
          </div>
          {(activeTests.data ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No active A/B tests</p>
                <p className="text-sm mt-1">Tests are automatically created when you send campaigns. Go to Campaigns to start one.</p>
              </CardContent>
            </Card>
          ) : (
            (activeTests.data ?? []).map((test: any) => (
              <Card key={test.id} className={`border-l-4 ${test.significance?.significant ? (test.significance.winner === 'variant' ? 'border-l-emerald-500' : 'border-l-blue-500') : 'border-l-amber-500'}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{test.name || `Test #${test.id}`}</h4>
                      <p className="text-sm text-muted-foreground">{test.testType || 'subject_line'} test</p>
                    </div>
                    {test.significance ? (
                      <Badge className={test.significance.significant ? 'bg-emerald-500' : 'bg-amber-500'}>
                        {test.significance.significant ? (
                          <><Trophy className="w-3 h-3 mr-1" />Winner: {test.significance.winner}</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" />{test.significance.confidence}% confidence</>
                        )}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Collecting data</Badge>
                    )}
                  </div>
                  {test.significance && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <div className="text-xs text-muted-foreground">Confidence</div>
                        <div className="font-bold text-lg">{test.significance.confidence}%</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <div className="text-xs text-muted-foreground">Lift</div>
                        <div className={`font-bold text-lg ${test.significance.lift > 0 ? 'text-emerald-500' : test.significance.lift < 0 ? 'text-red-500' : ''}`}>
                          {test.significance.lift > 0 ? '+' : ''}{test.significance.lift}%
                        </div>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <div className="text-xs text-muted-foreground">Significant</div>
                        <div className="font-bold text-lg">
                          {test.significance.significant ? <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" /> : <XCircle className="w-6 h-6 text-muted-foreground mx-auto" />}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Significance Calculator Tab */}
        <TabsContent value="significance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistical Significance Calculator</CardTitle>
                <CardDescription>Enter your A/B test results to check if the difference is statistically significant.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3 p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
                    <h4 className="font-semibold text-blue-600 text-sm">Control (A)</h4>
                    <div>
                      <Label className="text-xs">Emails Sent</Label>
                      <Input type="number" value={controlSent} onChange={e => setControlSent(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label className="text-xs">Opens</Label>
                      <Input type="number" value={controlOpens} onChange={e => setControlOpens(Number(e.target.value))} />
                    </div>
                    <div className="text-center text-sm font-medium">
                      Rate: {controlSent > 0 ? ((controlOpens / controlSent) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="space-y-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                    <h4 className="font-semibold text-emerald-600 text-sm">Variant (B)</h4>
                    <div>
                      <Label className="text-xs">Emails Sent</Label>
                      <Input type="number" value={variantSent} onChange={e => setVariantSent(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label className="text-xs">Opens</Label>
                      <Input type="number" value={variantOpens} onChange={e => setVariantOpens(Number(e.target.value))} />
                    </div>
                    <div className="text-center text-sm font-medium">
                      Rate: {variantSent > 0 ? ((variantOpens / variantSent) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
              </CardHeader>
              <CardContent>
                {significance.data ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg text-center ${significance.data.significant ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                      <div className="text-2xl font-bold mb-1">
                        {significance.data.significant ? (
                          <span className="text-emerald-600">Statistically Significant!</span>
                        ) : (
                          <span className="text-amber-600">Not Yet Significant</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {significance.data.significant
                          ? `Variant ${significance.data.winner === 'variant' ? 'B' : 'A'} wins with ${significance.data.confidence}% confidence`
                          : `Need more data. Current confidence: ${significance.data.confidence}%`}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded bg-muted/50">
                        <div className="text-xs text-muted-foreground">Confidence</div>
                        <div className="text-xl font-bold">{significance.data.confidence}%</div>
                        <Progress value={significance.data.confidence} className="h-1 mt-1" />
                      </div>
                      <div className="text-center p-3 rounded bg-muted/50">
                        <div className="text-xs text-muted-foreground">Winner</div>
                        <div className="text-xl font-bold capitalize">{significance.data.winner === 'tie' ? 'No winner yet' : significance.data.winner === 'variant' ? 'Variant B' : 'Control A'}</div>
                      </div>
                      <div className="text-center p-3 rounded bg-muted/50">
                        <div className="text-xs text-muted-foreground">Lift</div>
                        <div className={`text-xl font-bold ${significance.data.lift > 0 ? 'text-emerald-500' : significance.data.lift < 0 ? 'text-red-500' : ''}`}>
                          {significance.data.lift > 0 ? '+' : ''}{significance.data.lift}%
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">Enter test data to see results</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sample Size Calculator Tab */}
        <TabsContent value="calculator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Minimum Sample Size Calculator</CardTitle>
                <CardDescription>Calculate how many emails you need to send per variant to get reliable results.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Baseline Open Rate</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" step="0.01" min="0.01" max="1" value={baselineRate} onChange={e => setBaselineRate(Number(e.target.value))} />
                    <span className="text-sm text-muted-foreground w-16">{(baselineRate * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <Label>Minimum Detectable Effect</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" step="0.01" min="0.01" max="0.5" value={mde} onChange={e => setMde(Number(e.target.value))} />
                    <span className="text-sm text-muted-foreground w-16">{(mde * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">The smallest improvement you want to detect (absolute)</p>
                </div>
                <div>
                  <Label>Confidence Level</Label>
                  <Select value={confidenceLevel} onValueChange={setConfidenceLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.90">90%</SelectItem>
                      <SelectItem value="0.95">95% (recommended)</SelectItem>
                      <SelectItem value="0.99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Sample Size</CardTitle>
              </CardHeader>
              <CardContent>
                {sampleSize.data ? (
                  <div className="space-y-4">
                    <div className="p-6 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
                      <div className="text-4xl font-bold text-purple-600">{sampleSize.data.perVariant.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground mt-1">emails per variant</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <div className="text-2xl font-bold">{sampleSize.data.total.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">total emails needed (both variants)</p>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-2"><ArrowRight className="w-3 h-3" />Baseline: {(baselineRate * 100).toFixed(0)}% open rate</p>
                      <p className="flex items-center gap-2"><ArrowRight className="w-3 h-3" />Detecting: {(mde * 100).toFixed(0)}% absolute improvement</p>
                      <p className="flex items-center gap-2"><ArrowRight className="w-3 h-3" />Target: {(baselineRate + mde) * 100}% open rate</p>
                      <p className="flex items-center gap-2"><ArrowRight className="w-3 h-3" />Confidence: {(parseFloat(confidenceLevel) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">Configure parameters to calculate</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
