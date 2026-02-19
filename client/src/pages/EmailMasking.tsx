import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, Shield, Eye, Trash2, Plus, CheckCircle, AlertTriangle, Info } from "lucide-react";

export default function EmailMasking() {
  const masks = trpc.emailMask.list.useQuery();
  const preview = trpc.emailMask.preview.useQuery({});
  const saveMask = trpc.emailMask.save.useMutation({
    onSuccess: () => { masks.refetch(); preview.refetch(); toast.success("Email mask saved successfully"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMask = trpc.emailMask.delete.useMutation({
    onSuccess: () => { masks.refetch(); preview.refetch(); toast.success("Email mask deleted"); },
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    id: undefined as number | undefined,
    displayName: "",
    displayEmail: "",
    replyToName: "",
    replyToEmail: "",
    organizationName: "",
    applyTo: "all" as "all" | "campaigns_only" | "manual_only",
    dmarcAlignment: "relaxed" as "relaxed" | "strict",
  });

  const activeMask = masks.data?.find(m => m.isActive);

  function startEdit(mask?: any) {
    if (mask) {
      setForm({
        id: mask.id,
        displayName: mask.displayName || "",
        displayEmail: mask.displayEmail || "",
        replyToName: mask.replyToName || "",
        replyToEmail: mask.replyToEmail || "",
        organizationName: mask.organizationName || "",
        applyTo: mask.applyTo || "all",
        dmarcAlignment: mask.dmarcAlignment || "relaxed",
      });
    } else {
      setForm({ id: undefined, displayName: "", displayEmail: "", replyToName: "", replyToEmail: "", organizationName: "", applyTo: "all", dmarcAlignment: "relaxed" });
    }
    setEditing(true);
  }

  function handleSave() {
    if (!form.displayName || !form.displayEmail) {
      toast.error("Display name and email are required");
      return;
    }
    saveMask.mutate(form);
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Email Masking
        </h1>
        <p className="text-muted-foreground mt-1">
          Set a single display address for all outbound emails. Recipients see your brand — not your sending infrastructure.
        </p>
      </div>

      {/* How It Works - Simple Explanation */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-blue-400">How Email Masking Works</p>
              <p className="text-sm text-muted-foreground">
                When you send emails through multiple domains for deliverability (outreach1.company.com, outreach2.company.com, etc.),
                the recipient always sees your <strong>display address</strong> (e.g., <code>you@company.com</code>) in their inbox.
                Replies go to your chosen reply-to address. It's completely transparent to your recipients — they only see your brand.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 p-3 rounded-lg bg-background/50">
                <div className="text-center">
                  <div className="font-mono text-orange-400">outreach1.co</div>
                  <div className="text-[10px]">Actual Sender</div>
                </div>
                <div className="text-lg">→</div>
                <div className="text-center">
                  <Shield className="h-5 w-5 mx-auto text-green-400" />
                  <div className="text-[10px]">Mask Applied</div>
                </div>
                <div className="text-lg">→</div>
                <div className="text-center">
                  <div className="font-mono text-green-400">you@company.com</div>
                  <div className="text-[10px]">What Recipient Sees</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Active Mask */}
      {activeMask && !editing && (
        <Card className="border-green-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Active Email Mask</CardTitle>
              </div>
              <Badge variant="outline" className="text-green-500 border-green-500/30">Active</Badge>
            </div>
            <CardDescription>All outbound emails display this identity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Display Name</Label>
                <p className="font-medium">{activeMask.displayName}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Display Email</Label>
                <p className="font-medium font-mono">{activeMask.displayEmail}</p>
              </div>
              {activeMask.replyToEmail && (
                <div>
                  <Label className="text-xs text-muted-foreground">Reply-To</Label>
                  <p className="font-medium font-mono">{activeMask.replyToEmail}</p>
                </div>
              )}
              {activeMask.organizationName && (
                <div>
                  <Label className="text-xs text-muted-foreground">Organization</Label>
                  <p className="font-medium">{activeMask.organizationName}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Applies To</Label>
                <p className="font-medium capitalize">{(activeMask.applyTo || "all").replace(/_/g, " ")}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">DMARC Alignment</Label>
                <p className="font-medium capitalize">{activeMask.dmarcAlignment || "relaxed"}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => startEdit(activeMask)}>Edit Mask</Button>
              <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300" onClick={() => deleteMask.mutate({ id: activeMask.id })}>
                <Trash2 className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Mask Set */}
      {!activeMask && !editing && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6 text-center py-12">
            <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">No Email Mask Configured</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Without a mask, outbound emails show the actual sending domain. Set up a mask so all emails appear to come from your primary business address.
            </p>
            <Button onClick={() => startEdit()}>
              <Plus className="h-4 w-4 mr-2" /> Set Up Email Mask
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit / Create Form */}
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>{form.id ? "Edit Email Mask" : "Set Up Email Mask"}</CardTitle>
            <CardDescription>Configure what recipients see when they receive your emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Display Identity */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                Display Identity — What Recipients See
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Display Name <span className="text-red-400">*</span></Label>
                  <Input
                    placeholder="e.g. J. Lavallee"
                    value={form.displayName}
                    onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">The name shown in the "From" field</p>
                </div>
                <div>
                  <Label>Display Email <span className="text-red-400">*</span></Label>
                  <Input
                    type="email"
                    placeholder="e.g. jlavallee@shiplw.com"
                    value={form.displayEmail}
                    onChange={e => setForm(f => ({ ...f, displayEmail: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">The email address shown to recipients</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Step 2: Reply-To */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                Reply-To Address — Where Replies Go
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Reply-To Name</Label>
                  <Input
                    placeholder="Same as display name if blank"
                    value={form.replyToName}
                    onChange={e => setForm(f => ({ ...f, replyToName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Reply-To Email</Label>
                  <Input
                    type="email"
                    placeholder="Same as display email if blank"
                    value={form.replyToEmail}
                    onChange={e => setForm(f => ({ ...f, replyToEmail: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Leave blank to use the display email for replies. Set a different address if you want replies going to a specific inbox.</p>
            </div>

            <Separator />

            {/* Step 3: Options */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Organization Name</Label>
                  <Input
                    placeholder="e.g. Logistics Worldwide"
                    value={form.organizationName}
                    onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Apply Mask To</Label>
                  <Select value={form.applyTo} onValueChange={v => setForm(f => ({ ...f, applyTo: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Outbound Emails</SelectItem>
                      <SelectItem value="campaigns_only">Campaigns Only</SelectItem>
                      <SelectItem value="manual_only">Manual Emails Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>DMARC Alignment</Label>
                  <Select value={form.dmarcAlignment} onValueChange={v => setForm(f => ({ ...f, dmarcAlignment: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relaxed">Relaxed (Recommended)</SelectItem>
                      <SelectItem value="strict">Strict</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Relaxed allows subdomains to send on behalf of parent domain</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Live Preview */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" /> Live Preview — What Recipients Will See
              </h3>
              <div className="bg-background/50 border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">From:</span>
                  <span className="font-medium">{form.displayName || "Your Name"} &lt;{form.displayEmail || "you@company.com"}&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Reply-To:</span>
                  <span className="font-medium">{form.replyToName || form.displayName || "Your Name"} &lt;{form.replyToEmail || form.displayEmail || "you@company.com"}&gt;</span>
                </div>
                {form.organizationName && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">Org:</span>
                    <span className="font-medium">{form.organizationName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed">
                  <span className="text-xs text-muted-foreground w-16">Actual:</span>
                  <span className="text-xs font-mono text-muted-foreground">Sent via rotating SMTP domains (hidden from recipient)</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saveMask.isPending}>
                {saveMask.isPending ? "Saving..." : form.id ? "Update Mask" : "Activate Mask"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DNS Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            DNS Setup for Email Masking
          </CardTitle>
          <CardDescription>Required DNS records to ensure masked emails land in inboxes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">SPF</Badge>
                <span className="text-sm font-medium">Sender Policy Framework</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Add to your display domain's DNS (e.g., shiplw.com)</p>
              <code className="text-xs bg-muted p-2 rounded block font-mono">v=spf1 include:_spf.outreach1.shiplw.com include:_spf.outreach2.shiplw.com ~all</code>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">DKIM</Badge>
                <span className="text-sm font-medium">DomainKeys Identified Mail</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Each sending domain needs its own DKIM key</p>
              <code className="text-xs bg-muted p-2 rounded block font-mono">selector._domainkey.outreach1.shiplw.com → CNAME → dkim.provider.com</code>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">DMARC</Badge>
                <span className="text-sm font-medium">Domain-based Message Authentication</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Add to your display domain with relaxed alignment</p>
              <code className="text-xs bg-muted p-2 rounded block font-mono">v=DMARC1; p=none; aspf=r; adkim=r; rua=mailto:dmarc@shiplw.com</code>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>Why relaxed alignment?</strong> With relaxed DMARC, emails sent from subdomains (outreach1.shiplw.com) 
            pass authentication when the display address is the parent domain (shiplw.com). This is the industry standard for 
            multi-domain email infrastructure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
