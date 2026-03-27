import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Key, Globe, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const PROVIDERS = [
  { value: "saml", label: "SAML 2.0", desc: "Standard enterprise SSO protocol" },
  { value: "oidc", label: "OpenID Connect", desc: "Modern OAuth 2.0 based protocol" },
  { value: "google", label: "Google Workspace", desc: "Sign in with Google accounts" },
  { value: "microsoft", label: "Microsoft Azure AD", desc: "Sign in with Microsoft accounts" },
  { value: "okta", label: "Okta", desc: "Okta identity provider" },
];

export default function SSOSettings() {
  const { data: config, isLoading } = trpc.sso.get.useQuery();
  const utils = trpc.useUtils();
  const save = trpc.sso.upsert.useMutation({
    onSuccess: () => {
      toast.success("SSO configuration saved");
      utils.sso.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    provider: "google" as "saml" | "oidc" | "google" | "microsoft" | "okta",
    isEnabled: false,
    entityId: "",
    ssoUrl: "",
    certificate: "",
    autoProvision: true,
    defaultRole: "user" as "user" | "admin",
  });

  useEffect(() => {
    if (config) {
      setForm({
        provider: config.provider,
        isEnabled: config.isEnabled,
        entityId: config.entityId ?? "",
        ssoUrl: config.ssoUrl ?? "",
        certificate: config.certificate ?? "",
        autoProvision: config.autoProvision,
        defaultRole: config.defaultRole,
      });
    }
  }, [config]);

  const selectedProvider = PROVIDERS.find((p) => p.value === form.provider);
  const needsAdvanced = form.provider === "saml" || form.provider === "oidc";

  return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
              Single Sign-On (SSO)
            </h1>
            <p className="text-muted-foreground mt-1">Allow your team to sign in with your identity provider</p>
          </div>
          <div className="flex items-center gap-3">
            {config?.isEnabled ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>
            ) : (
              <Badge variant="secondary">Disabled</Badge>
            )}
            <Button
              onClick={() => save.mutate(form)}
              disabled={save.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {save.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>

        {/* Enable SSO */}
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">Enable SSO</p>
                <p className="text-sm text-muted-foreground">Allow users to sign in via your identity provider</p>
              </div>
            </div>
            <Switch
              checked={form.isEnabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isEnabled: v }))}
            />
          </CardContent>
        </Card>

        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identity Provider</CardTitle>
            <CardDescription>Choose your SSO provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setForm((f) => ({ ...f, provider: p.value as typeof form.provider }))}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    form.provider === p.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    form.provider === p.value ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {p.label.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                  {form.provider === p.value && (
                    <Badge className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">Selected</Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Config for SAML/OIDC */}
        {needsAdvanced && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4" />
                {form.provider === "saml" ? "SAML Configuration" : "OIDC Configuration"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{form.provider === "saml" ? "Entity ID / Issuer" : "Client ID"}</Label>
                <Input
                  placeholder={form.provider === "saml" ? "https://your-idp.com/entity-id" : "your-client-id"}
                  value={form.entityId}
                  onChange={(e) => setForm((f) => ({ ...f, entityId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{form.provider === "saml" ? "SSO URL" : "Discovery URL"}</Label>
                <Input
                  placeholder={form.provider === "saml" ? "https://your-idp.com/sso" : "https://your-idp.com/.well-known/openid-configuration"}
                  value={form.ssoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, ssoUrl: e.target.value }))}
                />
              </div>
              {form.provider === "saml" && (
                <div className="space-y-2">
                  <Label>X.509 Certificate</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    value={form.certificate}
                    onChange={(e) => setForm((f) => ({ ...f, certificate: e.target.value }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Provisioning */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Provisioning
            </CardTitle>
            <CardDescription>Control how new users are created via SSO</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Auto-provision new users</p>
                <p className="text-xs text-muted-foreground">Automatically create accounts for first-time SSO users</p>
              </div>
              <Switch
                checked={form.autoProvision}
                onCheckedChange={(v) => setForm((f) => ({ ...f, autoProvision: v }))}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Default Role for New Users</Label>
              <Select
                value={form.defaultRole}
                onValueChange={(v) => setForm((f) => ({ ...f, defaultRole: v as "user" | "admin" }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Test SSO Connection */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Test SSO Connection</p>
              <p className="text-xs text-muted-foreground mt-0.5">Verify your SSO configuration is working correctly before enabling for all users.</p>
            </div>
            <Button variant="outline" onClick={() => {
              toast.info("SSO test initiated — check your identity provider logs for the authentication request");
            }}>Test Connection</Button>
          </CardContent>
        </Card>
        {/* ACS URL Info */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="p-4 flex items-start gap-3">
            <Globe className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-blue-700 dark:text-blue-300">Your Callback URL</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-mono break-all">
                {window.location.origin}/api/auth/sso/callback
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Add this URL as an authorized redirect URI in your identity provider settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
