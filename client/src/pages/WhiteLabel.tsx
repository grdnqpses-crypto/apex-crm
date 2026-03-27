import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Paintbrush, Globe, Image, Type, Palette, Save, Eye, Monitor, Smartphone, Building2 } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import { useSkin } from "@/contexts/SkinContext";

export default function WhiteLabel() {
  const { t } = useSkin();
  const config = trpc.whiteLabel.get.useQuery({ companyId: 1 });
  const updateConfig = trpc.whiteLabel.save.useMutation({ onSuccess: () => { config.refetch(); toast.success("Branding saved and applied"); } });
  const [form, setForm] = useState<any>({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => { if (config.data) setForm(config.data); }, [config.data]);

  const handleSave = () => updateConfig.mutate({
    companyId: 1,
    brandName: form.companyName,
    logoUrl: form.logoUrl,
    primaryColor: form.primaryColor,
    accentColor: form.accentColor,
    customDomain: form.customDomain,
  });

  return (
    <FeatureGate
      featureKey="white_labeling"
      featureName="White-Label & Custom Branding"
      description="Full white-labeling with your logo, domain, and brand colors. Fortune plan and above. One-time $299 setup fee applies."
      freemium={false}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">White-Label Branding</h1>
            <p className="text-muted-foreground">Customize the platform with your brand — logo, colors, domain, company name</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="w-4 h-4 mr-2" /> Preview
            </Button>
            <Button onClick={handleSave} disabled={updateConfig.isPending}>
              <Save className="w-4 h-4 mr-2" />{updateConfig.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="identity">
          <TabsList className="mb-4">
            <TabsTrigger value="identity"><Type className="w-4 h-4 mr-2" />Identity</TabsTrigger>
            <TabsTrigger value="assets"><Image className="w-4 h-4 mr-2" />Assets</TabsTrigger>
            <TabsTrigger value="colors"><Palette className="w-4 h-4 mr-2" />Colors</TabsTrigger>
            <TabsTrigger value="domain"><Globe className="w-4 h-4 mr-2" />Domain</TabsTrigger>
            <TabsTrigger value="tenant"><Building2 className="w-4 h-4 mr-2" />Per-Tenant</TabsTrigger>
          </TabsList>

          <TabsContent value="identity">
            <Card className="border-border/50">
              <CardHeader><CardTitle>Company Identity</CardTitle></CardHeader>
              <CardContent className="space-y-4 max-w-lg">
                <div><Label>Company Name</Label><Input value={form.companyName || ""} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="Your Brokerage Name" className="mt-1" /></div>
                <div><Label>Tagline</Label><Input value={form.tagline || ""} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="Your company tagline" className="mt-1" /></div>
                <div><Label>Support Email</Label><Input value={form.supportEmail || ""} onChange={e => setForm({ ...form, supportEmail: e.target.value })} placeholder="support@yourbrokerage.com" className="mt-1" /></div>
                <div><Label>Support Phone</Label><Input value={form.supportPhone || ""} onChange={e => setForm({ ...form, supportPhone: e.target.value })} placeholder="+1 (800) 000-0000" className="mt-1" /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets">
            <Card className="border-border/50">
              <CardHeader><CardTitle>Logo & Assets</CardTitle></CardHeader>
              <CardContent className="space-y-4 max-w-lg">
                <div><Label>Logo URL</Label><Input value={form.logoUrl || ""} onChange={e => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." className="mt-1" /></div>
                <div><Label>Favicon URL</Label><Input value={form.faviconUrl || ""} onChange={e => setForm({ ...form, faviconUrl: e.target.value })} placeholder="https://..." className="mt-1" /></div>
                {form.logoUrl && (
                  <div className="p-4 rounded-lg bg-muted/30 flex items-center gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Sidebar (32px)</p>
                      <img src={form.logoUrl} alt="Logo" className="h-8 object-contain" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Header (48px)</p>
                      <img src={form.logoUrl} alt="Logo" className="h-12 object-contain" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Full (96px)</p>
                      <img src={form.logoUrl} alt="Logo" className="h-24 object-contain" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors">
            <Card className="border-border/50">
              <CardHeader><CardTitle>Brand Colors</CardTitle></CardHeader>
              <CardContent className="space-y-4 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="color" value={form.primaryColor || "#6366f1"} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="w-12 h-10 p-1" />
                      <Input value={form.primaryColor || "#6366f1"} onChange={e => setForm({ ...form, primaryColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Accent Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="color" value={form.accentColor || "#8b5cf6"} onChange={e => setForm({ ...form, accentColor: e.target.value })} className="w-12 h-10 p-1" />
                      <Input value={form.accentColor || "#8b5cf6"} onChange={e => setForm({ ...form, accentColor: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <div className="p-4" style={{ background: form.primaryColor || "#6366f1" }}>
                    <p className="text-white font-semibold text-lg">{form.companyName || "Your Brand"}</p>
                    <p className="text-white/70 text-sm">{form.tagline || "Your tagline here"}</p>
                  </div>
                  <div className="p-4 bg-card flex items-center gap-3">
                    {form.logoUrl && <img src={form.logoUrl} alt="Logo" className="h-8 object-contain" />}
                    <div className="flex gap-2">
                      <div className="h-8 px-4 rounded-lg flex items-center text-sm text-white font-medium" style={{ background: form.primaryColor || "#6366f1" }}>Primary Button</div>
                      <div className="h-8 px-4 rounded-lg flex items-center text-sm text-white font-medium" style={{ background: form.accentColor || "#8b5cf6" }}>Accent Button</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domain">
            <Card className="border-border/50">
              <CardHeader><CardTitle>Custom Domain</CardTitle></CardHeader>
              <CardContent className="space-y-4 max-w-lg">
                <div><Label>Custom Domain</Label><Input value={form.customDomain || ""} onChange={e => setForm({ ...form, customDomain: e.target.value })} placeholder="crm.yourbrokerage.com" className="mt-1" /></div>
                <div className="p-4 rounded-lg bg-muted/30 text-sm space-y-2">
                  <p className="font-medium">DNS Setup Instructions</p>
                  <p className="text-muted-foreground">1. Add a CNAME record pointing <code className="bg-muted px-1 rounded">{form.customDomain || "your-domain.com"}</code> to <code className="bg-muted px-1 rounded">cname.manus.space</code></p>
                  <p className="text-muted-foreground">2. SSL certificate is provisioned automatically within 24 hours.</p>
                  <p className="text-muted-foreground">3. Contact support once DNS is configured to activate the domain.</p>
                </div>
                {form.customDomain && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Pending Verification</Badge>
                    <span className="text-xs text-muted-foreground">DNS propagation can take up to 48 hours</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenant">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Per-Tenant Configuration</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Control which branding elements individual tenant companies can customize within your white-label.</p>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg">
                {[
                  { key: "allowTenantLogo", label: "Allow tenants to upload their own logo", description: "Tenants can replace your logo with their own in their CRM instance" },
                  { key: "allowTenantColors", label: "Allow tenants to customize colors", description: "Tenants can set their own primary and accent colors" },
                  { key: "allowTenantDomain", label: "Allow tenants to use custom domains", description: "Tenants can configure their own subdomain or custom domain" },
                  { key: "allowTenantName", label: "Allow tenants to set company name", description: "Tenants can override the platform name shown in their instance" },
                  { key: "showPoweredBy", label: "Show 'Powered by AXIOM CRM'", description: "Display a small attribution badge in the footer of tenant instances" },
                ].map(item => (
                  <div key={item.key} className="flex items-start justify-between gap-4 py-3 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                    <Switch checked={form[item.key] ?? false} onCheckedChange={v => setForm({ ...form, [item.key]: v })} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Full-Page Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Branding Preview</DialogTitle>
                <div className="flex items-center gap-2">
                  <Button variant={previewDevice === "desktop" ? "default" : "outline"} size="sm" onClick={() => setPreviewDevice("desktop")}>
                    <Monitor className="w-4 h-4 mr-1" /> Desktop
                  </Button>
                  <Button variant={previewDevice === "mobile" ? "default" : "outline"} size="sm" onClick={() => setPreviewDevice("mobile")}>
                    <Smartphone className="w-4 h-4 mr-1" /> Mobile
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-auto bg-muted/20 rounded-lg p-4 flex items-start justify-center">
              <div className={`bg-card border border-border/50 rounded-xl overflow-hidden shadow-xl transition-all ${previewDevice === "mobile" ? "w-80" : "w-full"}`}>
                {/* Simulated sidebar + header */}
                <div className="flex h-[500px]">
                  <div className="w-48 border-r border-border/30 p-4 flex flex-col gap-3" style={{ background: form.primaryColor ? `${form.primaryColor}15` : undefined }}>
                    <div className="flex items-center gap-2 mb-2">
                      {form.logoUrl ? <img src={form.logoUrl} alt="Logo" className="h-6 object-contain" /> : <div className="h-6 w-6 rounded bg-primary/20" />}
                      <span className="text-sm font-bold truncate">{form.companyName || "Your Brand"}</span>
                    </div>
                    {["Dashboard", "Companies", "Contacts", "Deals", "Tasks", "Campaigns", "Reports"].map(item => (
                      <div key={item} className="text-xs px-2 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer text-muted-foreground">{item}</div>
                    ))}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="h-12 border-b border-border/30 flex items-center px-4 gap-3" style={{ background: form.primaryColor || "#6366f1" }}>
                      <span className="text-white font-semibold text-sm">{form.companyName || "Your Brand"} CRM</span>
                      <div className="ml-auto flex items-center gap-2">
                        <div className="h-7 px-3 rounded-lg bg-white/20 text-white text-xs flex items-center">New Deal</div>
                        <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">JD</div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-sm font-semibold">Dashboard</p>
                      <div className="grid grid-cols-3 gap-2">
                        {["Revenue", "Deals", "Contacts"].map(k => (
                          <div key={k} className="p-3 rounded-lg border border-border/30 bg-card">
                            <p className="text-xs text-muted-foreground">{k}</p>
                            <p className="text-lg font-bold mt-1" style={{ color: form.primaryColor || "#6366f1" }}>—</p>
                          </div>
                        ))}
                      </div>
                      <div className="h-8 rounded-lg flex items-center justify-center text-sm text-white font-medium" style={{ background: form.primaryColor || "#6366f1" }}>
                        {form.companyName || "Your Brand"} — Primary Action
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  );
}
