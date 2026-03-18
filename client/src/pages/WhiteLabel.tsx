import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Paintbrush, Globe, Image, Type, Palette, Save } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";

export default function WhiteLabel() {
  const config = trpc.whiteLabel.get.useQuery({ companyId: 1 });
  const updateConfig = trpc.whiteLabel.save.useMutation({ onSuccess: () => { config.refetch(); toast.success("Branding updated"); } });
  const [form, setForm] = useState<any>({});

  useEffect(() => { if (config.data) setForm(config.data); }, [config.data]);

  return (
      <FeatureGate
        featureKey="white_labeling"
        featureName="White-Label & Custom Branding"
        description="Full white-labeling with your logo, domain, and brand colors. Fortune plan and above. One-time $299 setup fee applies."
        freemium={false}
      >

    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">White-Label Branding</h1><p className="text-muted-foreground">Customize the platform with your brand — logo, colors, domain, company name</p></div>
        <Button onClick={() => updateConfig.mutate({ companyId: 1, brandName: form.companyName, logoUrl: form.logoUrl, primaryColor: form.primaryColor, accentColor: form.accentColor, customDomain: form.customDomain })} disabled={updateConfig.isPending}><Save className="w-4 h-4 mr-2" />{updateConfig.isPending ? "Saving..." : "Save Changes"}</Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="border-border/50"><CardHeader><CardTitle className="flex items-center gap-2"><Type className="w-5 h-5" />Company Identity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className="text-sm font-medium">Company Name</label><Input value={form.companyName || ""} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="Your Brokerage Name" /></div>
            <div><label className="text-sm font-medium">Tagline</label><Input value={form.tagline || ""} onChange={e => setForm({ ...form, tagline: e.target.value })} placeholder="Your company tagline" /></div>
            <div><label className="text-sm font-medium">Support Email</label><Input value={form.supportEmail || ""} onChange={e => setForm({ ...form, supportEmail: e.target.value })} placeholder="support@yourbrokerage.com" /></div>
          </CardContent>
        </Card>

        <Card className="border-border/50"><CardHeader><CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" />Logo & Assets</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className="text-sm font-medium">Logo URL</label><Input value={form.logoUrl || ""} onChange={e => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." /></div>
            <div><label className="text-sm font-medium">Favicon URL</label><Input value={form.faviconUrl || ""} onChange={e => setForm({ ...form, faviconUrl: e.target.value })} placeholder="https://..." /></div>
            {form.logoUrl && <div className="p-4 rounded-lg bg-muted/30 flex items-center justify-center"><img src={form.logoUrl} alt="Logo preview" className="max-h-16 object-contain" /></div>}
          </CardContent>
        </Card>

        <Card className="border-border/50"><CardHeader><CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />Colors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Primary Color</label><div className="flex gap-2"><Input type="color" value={form.primaryColor || "#6366f1"} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="w-12 h-10 p-1" /><Input value={form.primaryColor || "#6366f1"} onChange={e => setForm({ ...form, primaryColor: e.target.value })} /></div></div>
              <div><label className="text-sm font-medium">Accent Color</label><div className="flex gap-2"><Input type="color" value={form.accentColor || "#8b5cf6"} onChange={e => setForm({ ...form, accentColor: e.target.value })} className="w-12 h-10 p-1" /><Input value={form.accentColor || "#8b5cf6"} onChange={e => setForm({ ...form, accentColor: e.target.value })} /></div></div>
            </div>
            <div className="p-4 rounded-lg" style={{ background: form.primaryColor || "#6366f1" }}><p className="text-white font-semibold">Preview: {form.companyName || "Your Brand"}</p><p className="text-white/70 text-sm">{form.tagline || "Your tagline here"}</p></div>
          </CardContent>
        </Card>

        <Card className="border-border/50"><CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />Custom Domain</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className="text-sm font-medium">Custom Domain</label><Input value={form.customDomain || ""} onChange={e => setForm({ ...form, customDomain: e.target.value })} placeholder="crm.yourbrokerage.com" /></div>
            <p className="text-sm text-muted-foreground">Point your domain's CNAME record to our servers. Contact support for SSL setup.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  
      </FeatureGate>);
}
