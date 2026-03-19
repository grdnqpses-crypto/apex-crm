import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, Building2, Globe, UserPlus, Clock, Plus, Code, Copy, Trash2, CheckCircle, AlertCircle, MonitorSmartphone } from "lucide-react";

export default function VisitorTracking() {
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [showScript, setShowScript] = useState<{ name: string; trackingId: string } | null>(null);
  const [siteName, setSiteName] = useState("");
  const [siteDomain, setSiteDomain] = useState("");

  const websites = trpc.visitorTracking.listWebsites.useQuery();
  const sessions = trpc.visitorTracking.list.useQuery();
  const utils = trpc.useUtils();

  const addWebsite = trpc.visitorTracking.addWebsite.useMutation({
    onSuccess: (data) => {
      utils.visitorTracking.listWebsites.invalidate();
      setShowAddWebsite(false);
      setShowScript({ name: siteName, trackingId: data.trackingId });
      setSiteName("");
      setSiteDomain("");
      toast.success("Website added! Copy the tracking script below.");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeWebsite = trpc.visitorTracking.removeWebsite.useMutation({
    onSuccess: () => { utils.visitorTracking.listWebsites.invalidate(); toast.success("Website removed"); },
  });

  const convert = trpc.visitorTracking.convertToProspect.useMutation({
    onSuccess: () => { sessions.refetch(); toast.success("Converted to prospect"); },
  });

  const identified = sessions.data?.filter((s: any) => s.identifiedCompany) || [];
  const anonymous = sessions.data?.filter((s: any) => !s.identifiedCompany) || [];

  const getTrackingScript = (trackingId: string) =>
    `<!-- Apex CRM Visitor Tracking -->\n<script>\n  (function(a,p,e,x,c,r,m){\n    a[x]=a[x]||function(){(a[x].q=a[x].q||[]).push(arguments)};\n    c=p.createElement(e);c.async=1;\n    c.src='https://track.apexcrm.io/v1/tracker.js?id='+r;\n    m=p.getElementsByTagName(e)[0];m.parentNode.insertBefore(c,m);\n  })(window,document,'script','apexTrack','${trackingId}');\n  apexTrack('init', '${trackingId}');\n  apexTrack('pageview');\n</script>`;

  const copyScript = (trackingId: string) => {
    navigator.clipboard.writeText(getTrackingScript(trackingId));
    toast.success("Tracking script copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visitor Tracking</h1>
          <p className="text-muted-foreground">Identify anonymous website visitors — reveal companies, track behavior, convert to prospects</p>
        </div>
        <Button onClick={() => setShowAddWebsite(true)}>
          <Plus className="w-4 h-4 mr-2" />Add Website
        </Button>
      </div>

      <Tabs defaultValue={websites.data?.length === 0 ? "setup" : "visitors"}>
        <TabsList>
          <TabsTrigger value="setup">
            <MonitorSmartphone className="w-4 h-4 mr-2" />My Websites
            {websites.data && websites.data.length > 0 && (
              <Badge className="ml-2 text-xs">{websites.data.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="visitors">
            <Eye className="w-4 h-4 mr-2" />Visitor Sessions
            {sessions.data && sessions.data.length > 0 && (
              <Badge className="ml-2 text-xs">{sessions.data.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* My Websites Tab */}
        <TabsContent value="setup" className="space-y-4">
          {websites.data?.length === 0 ? (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="py-16 text-center">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No websites added yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Add your website to start tracking visitors. You will get a JavaScript snippet to paste into your site's head tag.
                </p>
                <Button onClick={() => setShowAddWebsite(true)}>
                  <Plus className="w-4 h-4 mr-2" />Add Your First Website
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {websites.data?.map((site: any) => (
                <Card key={site.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{site.twName}</span>
                          <Badge variant={site.twIsActive ? "default" : "secondary"} className="text-xs">
                            {site.twIsActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{site.twDomain}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">ID: {site.twTrackingId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowScript({ name: site.twName, trackingId: site.twTrackingId })}>
                        <Code className="w-4 h-4 mr-1" />Get Script
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeWebsite.mutate({ id: site.id })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" onClick={() => setShowAddWebsite(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />Add Another Website
              </Button>
            </div>
          )}

          {/* Setup Instructions */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 font-bold">1</span><span>Add your website and get a unique tracking ID</span></div>
              <div className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 font-bold">2</span><span>Paste the JavaScript snippet into your website's head section</span></div>
              <div className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 font-bold">3</span><span>Apex identifies anonymous visitors using IP intelligence and reverse DNS lookup</span></div>
              <div className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 font-bold">4</span><span>Convert identified companies to prospects with one click</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visitor Sessions Tab */}
        <TabsContent value="visitors" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Visitors", value: sessions.data?.length || 0, icon: Eye, color: "text-blue-400" },
              { label: "Identified", value: identified.length, icon: Building2, color: "text-green-400" },
              { label: "Anonymous", value: anonymous.length, icon: Globe, color: "text-gray-400" },
              { label: "Converted", value: sessions.data?.filter((s: any) => s.convertedToProspect).length || 0, icon: UserPlus, color: "text-purple-400" },
            ].map(s => (
              <Card key={s.label} className="border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
                  <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
                </CardContent>
              </Card>
            ))}
          </div>

          {sessions.data?.length === 0 ? (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No visitor sessions yet</h3>
                <p className="text-sm text-muted-foreground">Add a website and install the tracking script to start seeing visitors.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {identified.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Building2 className="w-5 h-5" />Identified Companies</h3>
                  <div className="space-y-3">
                    {identified.map((s: any) => (
                      <Card key={s.id} className="border-border/50 border-l-4 border-l-green-500">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-green-400" /></div>
                            <div>
                              <div className="flex items-center gap-2"><span className="font-semibold">{s.identifiedCompany}</span>{s.identifiedIndustry && <Badge variant="outline">{s.identifiedIndustry}</Badge>}</div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                {s.identifiedDomain && <span><Globe className="w-3 h-3 inline mr-1" />{s.identifiedDomain}</span>}
                                <span><Clock className="w-3 h-3 inline mr-1" />{s.totalPageViews || 0} pages · {Math.round((s.totalDuration || 0) / 60)}min</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => convert.mutate({ id: s.id })} disabled={s.convertedToProspect || convert.isPending}>
                            <UserPlus className="w-4 h-4 mr-1" />{s.convertedToProspect ? "Converted" : "Convert to Prospect"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {anonymous.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Eye className="w-5 h-5" />Anonymous Visitors</h3>
                  <div className="space-y-2">
                    {anonymous.slice(0, 10).map((s: any) => (
                      <Card key={s.id} className="border-border/50">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Eye className="w-4 h-4 text-muted-foreground" /></div>
                            <div>
                              <p className="text-sm font-medium">Anonymous Visitor</p>
                              <p className="text-xs text-muted-foreground">{s.totalPageViews || 1} page{(s.totalPageViews || 1) > 1 ? "s" : ""} · {new Date(s.lastVisit).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Unidentified</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Website Dialog */}
      <Dialog open={showAddWebsite} onOpenChange={setShowAddWebsite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Website</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="siteName">Website Name</Label>
              <Input id="siteName" placeholder="e.g. My Company Website" value={siteName} onChange={e => setSiteName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDomain">Domain</Label>
              <Input id="siteDomain" placeholder="e.g. mycompany.com or https://mycompany.com" value={siteDomain} onChange={e => setSiteDomain(e.target.value)} />
              <p className="text-xs text-muted-foreground">Enter your website's domain. The protocol will be stripped automatically.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWebsite(false)}>Cancel</Button>
            <Button onClick={() => addWebsite.mutate({ name: siteName, domain: siteDomain })} disabled={!siteName || !siteDomain || addWebsite.isPending}>
              {addWebsite.isPending ? "Adding..." : "Add Website & Get Script"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Script Dialog */}
      <Dialog open={!!showScript} onOpenChange={() => setShowScript(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />Tracking Script for {showScript?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-700 dark:text-green-400">Website added successfully!</p>
                <p className="text-muted-foreground mt-1">Paste this script into the head section of every page on your website.</p>
              </div>
            </div>
            <div className="relative">
              <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-border">
                {showScript && getTrackingScript(showScript.trackingId)}
              </pre>
              <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => showScript && copyScript(showScript.trackingId)}>
                <Copy className="w-3 h-3 mr-1" />Copy
              </Button>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Where to add this script:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>WordPress:</strong> Appearance → Theme Editor → header.php, or use a header plugin</li>
                <li><strong>Shopify:</strong> Online Store → Themes → Edit Code → theme.liquid</li>
                <li><strong>Webflow:</strong> Project Settings → Custom Code → Head Code</li>
                <li><strong>Any HTML site:</strong> Paste before the closing head tag</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => showScript && copyScript(showScript.trackingId)}>
              <Copy className="w-4 h-4 mr-2" />Copy Script
            </Button>
            <Button variant="outline" onClick={() => setShowScript(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
