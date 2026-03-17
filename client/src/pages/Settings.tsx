import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, Mail, Phone, Calendar, ListTodo, Shield, Zap,
  Bell, Building2, ScrollText, Users, Sparkles,
  Plug, Key, Globe, Eye, Lock, Brain,
  CreditCard, Database, FileText, Upload, Download,
  Archive, Settings2, MessageSquare, BarChart3,
  Palette, BookOpen, ShoppingCart, ChevronRight,
  Search, Check, AlertTriangle, Info, Monitor
} from "lucide-react";

// ─── Settings Navigation Structure (from SettingsPage.docx) ───
const SETTINGS_SECTIONS = [
  {
    id: "preferences",
    label: "Your Preferences",
    icon: User,
    subsections: [
      { id: "profile", label: "Profile", icon: User, description: "These preferences only apply to you." },
      { id: "email-prefs", label: "Email", icon: Mail, description: "Personal email preferences. For account level email management, go to email logging settings." },
      { id: "calling", label: "Calling", icon: Phone, description: "Personal calling preferences. For account level calling defaults go to account call settings." },
      { id: "calendar", label: "Calendar", icon: Calendar, description: "These preferences only apply to you." },
      { id: "tasks-prefs", label: "Tasks", icon: ListTodo, description: "These preferences only apply to you." },
      { id: "security-prefs", label: "Security", icon: Shield, description: "Personal security settings." },
      { id: "automation-prefs", label: "Automation", icon: Zap, description: "These preferences only apply to you." },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    subsections: [
      { id: "email-desktop", label: "Email & Desktop", icon: Bell, description: "Configure email and desktop notification preferences." },
      { id: "other-apps", label: "Other Apps", icon: Monitor, description: "Manage notifications from connected applications." },
    ],
  },
  {
    id: "account",
    label: "Account Management",
    icon: Building2,
    subsections: [
      { id: "account-defaults", label: "Account Defaults", icon: Settings2, description: "General account defaults, user defaults, notifications, currency, data hosting, and feature releases." },
      { id: "audit-log", label: "Audit Log", icon: ScrollText, description: "View all logs, login history, and security activity." },
      { id: "users-teams", label: "Users & Teams", icon: Users, description: "Manage users, seats, teams, and presets." },
      { id: "product-updates", label: "Product Updates", icon: Sparkles, description: "Search new features, impact levels, favorites, betas, and scheduled releases." },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    subsections: [
      { id: "connected-apps", label: "Connected Apps", icon: Plug, description: "Overview of connected applications, notifications, and app management." },
      { id: "service-keys", label: "Service Keys", icon: Key, description: "Manage personal access, developer API access, and service keys." },
      { id: "private-apps", label: "Private Apps", icon: Lock, description: "Manage private applications, MCP auth apps, and design manager." },
      { id: "marketing-contacts", label: "Marketing Contacts", icon: Users, description: "Apps from the App Store for marketing contact management." },
      { id: "email-provider", label: "Email Service Provider", icon: Mail, description: "Connect your email provider for email sync." },
    ],
  },
  {
    id: "tracking",
    label: "Tracking & Analytics",
    icon: BarChart3,
    subsections: [
      { id: "tracking-code", label: "Tracking Code", icon: BarChart3, description: "Manage tracking code and advanced tracking settings." },
      { id: "external-urls", label: "External Web URLs", icon: Globe, description: "Create and manage external web URLs for tracking." },
    ],
  },
  {
    id: "privacy",
    label: "Privacy & Consent",
    icon: Eye,
    subsections: [
      { id: "privacy-setup", label: "Setup", icon: Eye, description: "Configure privacy and consent settings." },
      { id: "consent-options", label: "Consent Options", icon: Check, description: "Manage consent collection and preferences." },
      { id: "cookies", label: "Cookies", icon: FileText, description: "Configure cookie consent and tracking policies." },
      { id: "data-requests", label: "Data Request Manager", icon: Database, description: "Handle data access and deletion requests." },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Lock,
    subsections: [
      { id: "login-settings", label: "Login", icon: Lock, description: "Configure login requirements and authentication methods." },
      { id: "permissions", label: "Permissions", icon: Shield, description: "Manage role-based permissions and access controls." },
    ],
  },
  {
    id: "ai",
    label: "AI",
    icon: Brain,
    subsections: [
      { id: "ai-access", label: "Access", icon: Brain, description: "Configure AI feature access and permissions." },
      { id: "ai-data-sources", label: "Data Sources", icon: Database, description: "Manage data sources used by AI features." },
    ],
  },
  {
    id: "payments",
    label: "Payments Account",
    icon: CreditCard,
    subsections: [
      { id: "payment-setup", label: "Set Up Payments", icon: CreditCard, description: "Payment processing with your CRM." },
    ],
  },
  {
    id: "data-management",
    label: "Data Management",
    icon: Database,
    subsections: [
      { id: "properties", label: "Properties", icon: FileText, description: "Manage contact, company, deal, and other object properties." },
      { id: "objects", label: "Objects", icon: Database, description: "Configure object settings, associations, lifecycle stages, and customization." },
      { id: "translations", label: "Translations", icon: Globe, description: "Add custom data translations." },
      { id: "data-enrichment", label: "Data Enrichment", icon: Sparkles, description: "Settings, conversational enrichment, and mapping." },
      { id: "import-export", label: "Import & Export", icon: Upload, description: "Import data from files or export your CRM data." },
      { id: "backup-restore", label: "Backup & Restore", icon: Archive, description: "Data backup and restore management." },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    icon: Settings2,
    subsections: [
      { id: "meetings", label: "Meetings", icon: Calendar, description: "Meeting configuration and rotation settings." },
      { id: "calling-tools", label: "Calling", icon: Phone, description: "Call setup, phone numbers, blocked numbers, and IVR." },
      { id: "sales-workspace", label: "Sales Workspace", icon: BarChart3, description: "General settings, guided actions, companies, deals, and dashboard." },
      { id: "inbox", label: "Inbox", icon: MessageSquare, description: "Manage inboxes, channels, SLAs, availability, and allow/deny lists." },
      { id: "marketing-tools", label: "Marketing", icon: Mail, description: "Ads, email configuration, double opt-in, subscriptions, and forms." },
      { id: "content", label: "Content", icon: BookOpen, description: "Domains, navigation menus, themes, blog, pages, and SEO." },
      { id: "commerce", label: "Commerce", icon: ShoppingCart, description: "Payments, tax rates, and automated sales tax." },
    ],
  },
];

// ─── Profile Settings Panel ───
function ProfileSettings() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(" ").slice(1).join(" ") || "");
  const [email] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Profile</h3>
        <p className="text-sm text-muted-foreground">These preferences only apply to you.</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" value={email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email is managed through your authentication provider.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>
          <Button onClick={() => toast.success("Profile updated")}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Image</CardTitle>
          <CardDescription>Upload a profile photo that will be visible to your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
              {(user?.name?.[0] || "U").toUpperCase()}
            </div>
            <Button variant="outline" onClick={() => toast.info("Feature coming soon")}>Upload Photo</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Notification Settings Panel ───
function NotificationSettings() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [desktopNotifs, setDesktopNotifs] = useState(true);
  const [dealUpdates, setDealUpdates] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [campaignAlerts, setCampaignAlerts] = useState(true);
  const [prospectAlerts, setProspectAlerts] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Email & Desktop Notifications</h3>
        <p className="text-sm text-muted-foreground">Choose what notifications you receive and how.</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Desktop Notifications</p>
              <p className="text-sm text-muted-foreground">Show browser push notifications</p>
            </div>
            <Switch checked={desktopNotifs} onCheckedChange={setDesktopNotifs} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Deal Updates</p>
              <p className="text-sm text-muted-foreground">When deals move stages or are won/lost</p>
            </div>
            <Switch checked={dealUpdates} onCheckedChange={setDealUpdates} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Task Reminders</p>
              <p className="text-sm text-muted-foreground">Upcoming and overdue task alerts</p>
            </div>
            <Switch checked={taskReminders} onCheckedChange={setTaskReminders} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Campaign Alerts</p>
              <p className="text-sm text-muted-foreground">Campaign completion and performance alerts</p>
            </div>
            <Switch checked={campaignAlerts} onCheckedChange={setCampaignAlerts} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Prospect Hot Lead Alerts</p>
              <p className="text-sm text-muted-foreground">When prospects become hot leads in Paradigm Engine</p>
            </div>
            <Switch checked={prospectAlerts} onCheckedChange={setProspectAlerts} />
          </div>
        </CardContent>
      </Card>
      <Button onClick={() => toast.success("Notification preferences saved")}>Save Preferences</Button>
    </div>
  );
}

// ─── Account Defaults Panel ───
function AccountDefaults() {
  const { data: myCompany, refetch } = trpc.tenants.myCompany.useQuery();
  const utils = trpc.useUtils();
  const [companyName, setCompanyName] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (myCompany) {
      setCompanyName(myCompany.name || "");
      setPreviewLogo(myCompany.logoUrl || null);
    }
  }, [myCompany]);

  const updateBranding = trpc.tenants.updateBranding.useMutation({
    onSuccess: () => {
      toast.success("Company name updated");
      utils.tenants.myCompany.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadLogo = trpc.tenants.uploadLogo.useMutation({
    onSuccess: (data) => {
      setPreviewLogo(data.logoUrl);
      utils.tenants.myCompany.invalidate();
      toast.success("Logo uploaded successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const generateLogo = trpc.tenants.generateLogo.useMutation({
    onSuccess: (data) => {
      setPreviewLogo(data.logoUrl);
      utils.tenants.myCompany.invalidate();
      toast.success("AI logo generated and saved!");
      setIsGenerating(false);
    },
    onError: (e) => { toast.error(e.message); setIsGenerating(false); },
  });

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewLogo(dataUrl);
      uploadLogo.mutate({ dataUrl, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleAIGenerate = () => {
    if (!companyName.trim()) { toast.error("Enter your company name first"); return; }
    setIsGenerating(true);
    generateLogo.mutate({ companyName: companyName.trim(), industry: myCompany?.industry || undefined });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Account Defaults</h3>
        <p className="text-sm text-muted-foreground">Configure your company branding and default settings.</p>
      </div>

      {/* ─── Company Branding Card ─── */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Company Branding
          </CardTitle>
          <CardDescription>Your logo and company name appear in the sidebar and top navigation for every user in your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label>Company Name</Label>
            <div className="flex gap-2">
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company Name"
                className="flex-1"
              />
              <Button
                onClick={() => updateBranding.mutate({ name: companyName })}
                disabled={updateBranding.isPending || !companyName.trim()}
              >
                {updateBranding.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-3">
            <Label>Company Logo</Label>
            <div className="flex items-start gap-6">
              {/* Preview */}
              <div className="shrink-0">
                {previewLogo ? (
                  <div className="relative group">
                    <img
                      src={previewLogo}
                      alt="Company logo"
                      className="h-20 w-20 rounded-xl object-contain border border-border bg-muted/30"
                    />
                    <button
                      onClick={() => { setPreviewLogo(null); updateBranding.mutate({ logoUrl: null }); }}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border bg-muted/20 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Upload Zone */}
              <div className="flex-1 space-y-3">
                <div
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop your logo here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG up to 5MB · Recommended: 256×256px or larger</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2 border-amber-300/50 text-amber-700 hover:bg-amber-50"
                  onClick={handleAIGenerate}
                  disabled={isGenerating || generateLogo.isPending}
                >
                  <Sparkles className="h-4 w-4" />
                  {isGenerating || generateLogo.isPending ? "Generating AI logo..." : "Generate Logo with AI"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  AI will create a professional logo based on your company name and industry.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Input value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Input value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Defaults</CardTitle>
          <CardDescription>Default settings applied to new users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-assign to default team</p>
              <p className="text-sm text-muted-foreground">New users are automatically added to the default team</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Send welcome email</p>
              <p className="text-sm text-muted-foreground">New users receive a welcome email with getting started guide</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Hosting</CardTitle>
          <CardDescription>Your data hosting region and compliance settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Info className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <p className="font-medium text-sm">United States (US-East)</p>
              <p className="text-xs text-muted-foreground">Your data is hosted in US-East region. Contact support to request a region change.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Button onClick={() => toast.success("Account defaults saved")}>Save Defaults</Button>
    </div>
  );
}

// ─── Audit Log Panel ───
function AuditLogPanel() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Audit Log</h3>
        <p className="text-sm text-muted-foreground">View all system activity, login history, and security events.</p>
      </div>
      <div className="flex gap-2">
        {["all", "login", "security", "data", "admin"].map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} Logs
          </Button>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[
              { action: "User logged in", user: "crm@shiplw.com", time: "2 minutes ago", type: "login" },
              { action: "Contact created", user: "crm@shiplw.com", time: "15 minutes ago", type: "data" },
              { action: "Campaign sent", user: "crm@shiplw.com", time: "1 hour ago", type: "data" },
              { action: "Settings updated", user: "crm@shiplw.com", time: "3 hours ago", type: "admin" },
              { action: "Password changed", user: "crm@shiplw.com", time: "1 day ago", type: "security" },
            ]
              .filter((log) => filter === "all" || log.type === filter)
              .map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs capitalize">{log.type}</Badge>
                    <span className="text-sm">{log.action}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{log.user}</span>
                    <span>{log.time}</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Users & Teams Panel ───
function UsersTeamsPanel() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Users & Teams</h3>
        <p className="text-sm text-muted-foreground">Manage your organization's users, seats, teams, and presets.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">User Hierarchy</CardTitle>
          <CardDescription>Apex CRM uses a multi-level hierarchy for access control.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { role: "Developer Admin", desc: "Full access to entire CRM. Can make system changes of any kind and control any part of the CRM.", color: "text-red-400", badge: "bg-red-500/20 text-red-400" },
              { role: "Super Admin", desc: "Full CRM access but cannot make application changes. Sets up paying customers as companies with their own users.", color: "text-amber-400", badge: "bg-amber-500/20 text-amber-400" },
              { role: "Company Admin", desc: "Manages their company's admin users, sales users, clerical users. Sets permissions for each user under them.", color: "text-blue-400", badge: "bg-blue-500/20 text-blue-400" },
              { role: "Manager", desc: "Manages assigned users and can delegate features from their own allowed set.", color: "text-green-400", badge: "bg-green-500/20 text-green-400" },
              { role: "Daily User", desc: "Access limited to permissions set up by the Company Administrator or Manager.", color: "text-slate-400", badge: "bg-slate-500/20 text-slate-400" },
            ].map((r) => (
              <div key={r.role} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Badge className={`${r.badge} border-0 shrink-0 mt-0.5`}>{r.role}</Badge>
                <p className="text-sm text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Current User</CardTitle>
            <CardDescription>Your account details and role.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info("Navigate to Team page to manage users")}>
            Manage Team
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
              {(user?.name?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{user?.name || "Unknown"}</p>
              <p className="text-sm text-muted-foreground">{user?.email || "No email"}</p>
            </div>
            <Badge className="ml-auto" variant="outline">
              {(user as any)?.systemRole || (user as any)?.role || "user"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Integrations Panel ───
function IntegrationsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Connected Apps</h3>
        <p className="text-sm text-muted-foreground">Manage your connected applications and integrations.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: "Apollo.io", desc: "Lead sourcing and enrichment", status: "Not Connected", icon: "🚀" },
          { name: "NeverBounce", desc: "Email verification service", status: "Not Connected", icon: "✉️" },
          { name: "SendGrid", desc: "Email delivery service", status: "Not Connected", icon: "📧" },
          { name: "PhantomBuster", desc: "LinkedIn automation", status: "Not Connected", icon: "👻" },
          { name: "Google AI Studio", desc: "AI/ML capabilities", status: "Connected", icon: "🤖" },
          { name: "HubSpot", desc: "CRM data import/export", status: "Not Connected", icon: "🔶" },
          { name: "Salesforce", desc: "CRM data migration", status: "Not Connected", icon: "☁️" },
          { name: "Slack", desc: "Team notifications", status: "Not Connected", icon: "💬" },
        ].map((app) => (
          <Card key={app.name} className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{app.icon}</span>
                  <div>
                    <p className="font-medium">{app.name}</p>
                    <p className="text-sm text-muted-foreground">{app.desc}</p>
                  </div>
                </div>
                <Badge variant={app.status === "Connected" ? "default" : "outline"} className={app.status === "Connected" ? "bg-green-500/20 text-green-400 border-0" : ""}>
                  {app.status}
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => toast.info("Feature coming soon")}>
                {app.status === "Connected" ? "Manage" : "Connect"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Service Keys Panel ───
function ServiceKeysPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Service Keys</h3>
        <p className="text-sm text-muted-foreground">Manage API keys for personal access, developer access, and service integrations.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { type: "Personal Access", desc: "Keys for your personal API access", icon: User },
            { type: "Developer API Access", desc: "Keys for developer-level API operations", icon: Key },
            { type: "Service Keys", desc: "Keys for automated service-to-service communication", icon: Lock },
          ].map((k) => (
            <div key={k.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <k.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{k.type}</p>
                  <p className="text-xs text-muted-foreground">{k.desc}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("Navigate to API Keys page for full management")}>Manage</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monitoring</CardTitle>
          <CardDescription>View logs and API call usage.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground mt-1">API Calls Today</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <p className="text-2xl font-bold text-green-400">100%</p>
            <p className="text-xs text-muted-foreground mt-1">Success Rate</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Privacy & Consent Panel ───
function PrivacyConsentPanel() {
  const [gdprEnabled, setGdprEnabled] = useState(true);
  const [ccpaEnabled, setCcpaEnabled] = useState(true);
  const [cookieConsent, setCookieConsent] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Privacy & Consent</h3>
        <p className="text-sm text-muted-foreground">Configure privacy settings, consent collection, and data request handling.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">GDPR Compliance</p>
              <p className="text-sm text-muted-foreground">Enable GDPR consent tracking and right-to-erasure support</p>
            </div>
            <Switch checked={gdprEnabled} onCheckedChange={setGdprEnabled} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">CCPA Compliance</p>
              <p className="text-sm text-muted-foreground">Enable CCPA data access and deletion request handling</p>
            </div>
            <Switch checked={ccpaEnabled} onCheckedChange={setCcpaEnabled} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cookie Consent Banner</p>
              <p className="text-sm text-muted-foreground">Show cookie consent banner to website visitors</p>
            </div>
            <Switch checked={cookieConsent} onCheckedChange={setCookieConsent} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Request Manager</CardTitle>
          <CardDescription>Handle data access and deletion requests from contacts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Check className="h-5 w-5 text-green-400" />
            <p className="text-sm">No pending data requests</p>
          </div>
        </CardContent>
      </Card>
      <Button onClick={() => toast.success("Privacy settings saved")}>Save Settings</Button>
    </div>
  );
}

// ─── Security Panel ───
function SecurityPanel() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Security</h3>
        <p className="text-sm text-muted-foreground">Configure login requirements and access controls.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Login Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Require 2FA for all users in your account</p>
            </div>
            <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Session Timeout (minutes)</Label>
            <Input value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} type="number" className="w-32" />
            <p className="text-xs text-muted-foreground">Inactive sessions will be automatically logged out.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permissions</CardTitle>
          <CardDescription>Role-based access control is managed through the user hierarchy.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10">
            <Info className="h-5 w-5 text-blue-400 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Permissions are managed through the <strong>Users & Teams</strong> section and the <strong>Team Management</strong> page. 
              Feature assignments cascade from Admin → Manager → User.
            </p>
          </div>
        </CardContent>
      </Card>
      <Button onClick={() => toast.success("Security settings saved")}>Save Settings</Button>
    </div>
  );
}

// ─── AI Settings Panel ───
function AISettingsPanel() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiProspecting, setAiProspecting] = useState(true);
  const [aiEmailComposer, setAiEmailComposer] = useState(true);
  const [aiPersonality, setAiPersonality] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">AI Settings</h3>
        <p className="text-sm text-muted-foreground">Configure AI feature access and data sources.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Feature Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">AI Features Enabled</p>
              <p className="text-sm text-muted-foreground">Master toggle for all AI-powered features</p>
            </div>
            <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">AI Prospecting Engine</p>
              <p className="text-sm text-muted-foreground">Quantum Lead Score, ICP matching, and lookalike finding</p>
            </div>
            <Switch checked={aiProspecting} onCheckedChange={setAiProspecting} disabled={!aiEnabled} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">AI Email Composer</p>
              <p className="text-sm text-muted-foreground">Hyper-personalized email generation using prospect DNA</p>
            </div>
            <Switch checked={aiEmailComposer} onCheckedChange={setAiEmailComposer} disabled={!aiEnabled} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Behavioral DNA Profiler</p>
              <p className="text-sm text-muted-foreground">AI personality analysis from public data</p>
            </div>
            <Switch checked={aiPersonality} onCheckedChange={setAiPersonality} disabled={!aiEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Sources</CardTitle>
          <CardDescription>Configure which data sources AI features can access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "CRM Contacts & Companies", enabled: true },
            { name: "Email Engagement History", enabled: true },
            { name: "Website Behavior Data", enabled: true },
            { name: "Social Media Profiles", enabled: true },
            { name: "External Enrichment APIs", enabled: false },
          ].map((ds) => (
            <div key={ds.name} className="flex items-center justify-between p-2">
              <span className="text-sm">{ds.name}</span>
              <Switch defaultChecked={ds.enabled} disabled={!aiEnabled} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Button onClick={() => toast.success("AI settings saved")}>Save Settings</Button>
    </div>
  );
}

// ─── Data Management Panel ───
function DataManagementPanel({ subsectionId }: { subsectionId: string }) {
  if (subsectionId === "properties") {
    return <PropertiesPanel />;
  }
  if (subsectionId === "objects") {
    return <ObjectsPanel />;
  }
  if (subsectionId === "import-export") {
    return <ImportExportPanel />;
  }

  // Default: generic panel
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold capitalize">{subsectionId.replace(/-/g, " ")}</h3>
        <p className="text-sm text-muted-foreground">Configure {subsectionId.replace(/-/g, " ")} settings.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Database className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="font-medium">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1">This feature is being developed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Properties Panel (per HubSpot export structure) ───
function PropertiesPanel() {
  const [selectedObject, setSelectedObject] = useState("contacts");

  const objectTypes = [
    { id: "contacts", label: "Contacts", count: 236 },
    { id: "companies", label: "Companies", count: 148 },
    { id: "deals", label: "Deals", count: 106 },
    { id: "tickets", label: "Tickets", count: 54 },
    { id: "products", label: "Products", count: 26 },
    { id: "quotes", label: "Quotes", count: 80 },
    { id: "calls", label: "Calls", count: 35 },
    { id: "workflows", label: "Workflows", count: 39 },
    { id: "campaigns", label: "Marketing Email", count: 64 },
    { id: "invoices", label: "Invoices", count: 78 },
    { id: "orders", label: "Orders", count: 68 },
    { id: "subscriptions", label: "Subscriptions", count: 60 },
    { id: "segments", label: "Segment Lists", count: 37 },
    { id: "payments", label: "Payments", count: 89 },
    { id: "projects", label: "Projects", count: 56 },
    { id: "carts", label: "Carts", count: 47 },
    { id: "line-items", label: "Line Items", count: 55 },
    { id: "marketing-events", label: "Marketing Events", count: 24 },
  ];

  const propertyGroups: Record<string, { name: string; fields: string[] }[]> = {
    contacts: [
      { name: "Contact Information", fields: ["First Name", "Last Name", "Email", "Phone", "Job Title", "Company", "Address", "City", "State", "Zip", "Country", "Freight Details", "Shipment Dimensions", "Destination"] },
      { name: "Analytics Information", fields: ["Average Pageviews", "First Referring Site", "Time First Seen", "First Page Seen", "Number of Sessions"] },
      { name: "Email Information", fields: ["Email Bounced", "Email Clicked", "Email Opened", "Email Delivered", "Unsubscribed"] },
      { name: "Conversion Information", fields: ["First Conversion", "First Conversion Date", "Recent Conversion", "Destination", "Shipping Origination"] },
      { name: "Lifecycle Stage", fields: ["Lifecycle Stage", "Lead Status", "Lead Score", "Lead Source", "Became a Customer Date"] },
      { name: "Social Media", fields: ["LinkedIn URL", "Twitter Handle", "Facebook Profile", "Instagram Profile"] },
    ],
    companies: [
      { name: "Company Information", fields: ["Name", "Domain", "Industry", "Type", "Annual Revenue", "Employees", "Annual Freight Spend", "Commodity"] },
      { name: "Location", fields: ["Address", "City", "State", "Zip", "Country", "Timezone"] },
      { name: "Lifecycle", fields: ["Lead Source", "Lead Status", "Credit Terms", "Payment Status"] },
      { name: "Logistics", fields: ["Lane Preferences", "TMS Integration", "Freight Volume"] },
    ],
    deals: [
      { name: "Deal Information", fields: ["Deal Name", "Amount", "Close Date", "Pipeline", "Stage", "Owner"] },
      { name: "Analytics", fields: ["Latest Traffic Source", "Days to Close", "Forecast Amount"] },
    ],
  };

  const groups = propertyGroups[selectedObject] || [{ name: "Properties", fields: ["Configure properties for this object type"] }];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Properties</h3>
        <p className="text-sm text-muted-foreground">Manage properties for each object type. Properties define the fields available on records.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {objectTypes.slice(0, 8).map((obj) => (
          <Button key={obj.id} variant={selectedObject === obj.id ? "default" : "outline"} size="sm" onClick={() => setSelectedObject(obj.id)}>
            {obj.label} <Badge variant="secondary" className="ml-1.5 text-xs">{obj.count}</Badge>
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => toast.info("More object types available")}>
          +{objectTypes.length - 8} more
        </Button>
      </div>

      <Tabs defaultValue="properties">
        <TabsList>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="conditional">Conditional Logic</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value="properties" className="space-y-4 mt-4">
          {groups.map((group) => (
            <Card key={group.name}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">{group.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {group.fields.map((field) => (
                    <div key={field} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {field}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="conditional" className="mt-4">
          <Card><CardContent className="pt-6 text-center text-muted-foreground py-8">No conditional logic rules configured.</CardContent></Card>
        </TabsContent>
        <TabsContent value="groups" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {groups.map((g) => (
                <div key={g.name} className="flex items-center justify-between p-2 border-b last:border-0">
                  <span className="text-sm font-medium">{g.name}</span>
                  <Badge variant="secondary">{g.fields.length} fields</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="archived" className="mt-4">
          <Card><CardContent className="pt-6 text-center text-muted-foreground py-8">No archived properties.</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Objects Configuration Panel ───
function ObjectsPanel() {
  const objects = [
    { name: "Contacts", status: "active", tabs: ["Setup", "Associations", "Lifecycle Stage", "Records Customization", "Preview Customization", "Index Customization"] },
    { name: "Companies", status: "active", tabs: ["Setup", "Associations", "Lifecycle Stage", "Records Customization", "Preview Customization", "Index Customization"] },
    { name: "Leads", status: "inactive", tabs: ["Activate the object to access its settings"] },
    { name: "Deals", status: "active", tabs: ["Setup", "Associations", "Pipeline", "Record Customization", "Preview Customization", "Index Customization"] },
    { name: "Tickets", status: "active", tabs: ["Setup", "Associations", "Pipelines", "Records Customization", "Preview Customization", "Index Customization"] },
    { name: "Products", status: "active", tabs: ["Setup", "Preview Customization", "Tax Rates", "Discount Codes"] },
    { name: "Quotes", status: "active", tabs: ["Setup", "E-Signature", "Quote Templates"] },
    { name: "Subscriptions", status: "active", tabs: ["Setup", "Associations", "Preview Customization", "Index Customization", "Default Settings", "Notifications"] },
    { name: "Projects", status: "beta", tabs: ["Setup", "Associations", "Pipelines", "Records Customization", "Preview Customization", "Index Customization"] },
    { name: "Invoices", status: "active", tabs: ["Setup", "Customization", "Automation"] },
    { name: "Forecast", status: "active", tabs: ["Setup", "Pipeline", "Manage"] },
    { name: "Activities", status: "active", tabs: ["Email Log & Tracking", "Email Frequency Controls", "Associations"] },
    { name: "Segments", status: "active", tabs: ["Setup"] },
    { name: "Workflows", status: "active", tabs: ["Setup"] },
    { name: "Orders", status: "active", tabs: ["Setup", "Pipelines", "Records Customization", "Preview Customization", "Index Customization"] },
    { name: "Carts", status: "active", tabs: ["Setup", "Records Customization", "Preview Customization", "Index Customization"] },
    { name: "Custom Objects", status: "available", tabs: ["Create Custom Object"] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Objects</h3>
        <p className="text-sm text-muted-foreground">Configure object settings, associations, lifecycle stages, and customization.</p>
      </div>
      <div className="space-y-2">
        {objects.map((obj) => (
          <Card key={obj.name} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => toast.info(`${obj.name} configuration coming soon`)}>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{obj.name}</span>
                {obj.status === "beta" && <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">Beta</Badge>}
                {obj.status === "inactive" && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{obj.tabs.length} settings</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Import & Export Panel ───
function ImportExportPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Import & Export</h3>
        <p className="text-sm text-muted-foreground">Import data from files or other CRMs, or export your Apex CRM data.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => toast.info("Navigate to the HubSpot Import tool in Developer section")}>
          <CardContent className="pt-6 text-center">
            <Upload className="h-12 w-12 text-primary mx-auto mb-3" />
            <p className="font-medium">Import Data</p>
            <p className="text-sm text-muted-foreground mt-1">Import contacts, companies, deals from CSV, HubSpot, or Salesforce.</p>
            <Button className="mt-4" variant="outline">Start Import</Button>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => toast.info("Feature coming soon")}>
          <CardContent className="pt-6 text-center">
            <Download className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Export Data</p>
            <p className="text-sm text-muted-foreground mt-1">Export your CRM data as CSV, JSON, or Excel files.</p>
            <Button className="mt-4" variant="outline">Start Export</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supported Import Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["CSV Files", "HubSpot Export", "Salesforce", "Excel (.xlsx)", "Google Sheets", "Pipedrive", "Zoho CRM", "Custom API"].map((src) => (
              <div key={src} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-sm">
                <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                {src}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup & Restore</CardTitle>
          <CardDescription>Create backups of your CRM data or restore from a previous backup.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" onClick={() => toast.info("Feature coming soon")}>
            <Archive className="h-4 w-4 mr-2" /> Create Backup
          </Button>
          <Button variant="outline" onClick={() => toast.info("Feature coming soon")}>
            <Upload className="h-4 w-4 mr-2" /> Restore Backup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Generic Coming Soon Panel ───
function ComingSoonPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Settings2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="font-medium text-lg">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              This settings section is being developed. Check back soon for full configuration options.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Settings Page ───
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("preferences");
  const [activeSubsection, setActiveSubsection] = useState("profile");
  const [searchQuery, setSearchQuery] = useState("");

  const currentSection = SETTINGS_SECTIONS.find((s) => s.id === activeSection);

  const filteredSections = useMemo(() => {
    if (!searchQuery) return SETTINGS_SECTIONS;
    const q = searchQuery.toLowerCase();
    return SETTINGS_SECTIONS.map((section) => ({
      ...section,
      subsections: section.subsections.filter(
        (sub) => sub.label.toLowerCase().includes(q) || sub.description.toLowerCase().includes(q) || section.label.toLowerCase().includes(q)
      ),
    })).filter((s) => s.subsections.length > 0);
  }, [searchQuery]);

  const renderPanel = () => {
    // Data Management has sub-panels
    if (activeSection === "data-management") {
      return <DataManagementPanel subsectionId={activeSubsection} />;
    }

    // Map subsection IDs to components
    const panelMap: Record<string, React.ReactNode> = {
      "profile": <ProfileSettings />,
      "email-prefs": <ComingSoonPanel title="Email Preferences" description="Configure your personal email settings." />,
      "calling": <ComingSoonPanel title="Calling Preferences" description="Configure your personal calling settings." />,
      "calendar": <ComingSoonPanel title="Calendar Preferences" description="Configure your calendar integration and settings." />,
      "tasks-prefs": <ComingSoonPanel title="Task Preferences" description="Configure your task defaults and reminders." />,
      "security-prefs": <SecurityPanel />,
      "automation-prefs": <ComingSoonPanel title="Automation Preferences" description="Configure your automation defaults." />,
      "email-desktop": <NotificationSettings />,
      "other-apps": <ComingSoonPanel title="Other App Notifications" description="Manage notifications from connected applications." />,
      "account-defaults": <AccountDefaults />,
      "audit-log": <AuditLogPanel />,
      "users-teams": <UsersTeamsPanel />,
      "product-updates": <ComingSoonPanel title="Product Updates" description="Discover new features, betas, and scheduled releases." />,
      "connected-apps": <IntegrationsPanel />,
      "service-keys": <ServiceKeysPanel />,
      "private-apps": <ComingSoonPanel title="Private Apps" description="Manage private applications and MCP auth apps." />,
      "marketing-contacts": <ComingSoonPanel title="Marketing Contacts" description="Manage marketing contact integrations." />,
      "email-provider": <ComingSoonPanel title="Email Service Provider" description="Connect your email provider for email sync." />,
      "tracking-code": <ComingSoonPanel title="Tracking Code" description="Manage your tracking code and advanced tracking." />,
      "external-urls": <ComingSoonPanel title="External Web URLs" description="Create and manage external web URLs." />,
      "privacy-setup": <PrivacyConsentPanel />,
      "consent-options": <ComingSoonPanel title="Consent Options" description="Manage consent collection preferences." />,
      "cookies": <ComingSoonPanel title="Cookies" description="Configure cookie consent and tracking policies." />,
      "data-requests": <ComingSoonPanel title="Data Request Manager" description="Handle data access and deletion requests." />,
      "login-settings": <SecurityPanel />,
      "permissions": <ComingSoonPanel title="Permissions" description="Manage role-based permissions and access controls." />,
      "ai-access": <AISettingsPanel />,
      "ai-data-sources": <AISettingsPanel />,
      "payment-setup": <ComingSoonPanel title="Payment Setup" description="Configure payment processing with your CRM." />,
      "meetings": <ComingSoonPanel title="Meetings" description="Configure meeting settings and rotation." />,
      "calling-tools": <ComingSoonPanel title="Calling Tools" description="Configure call setup, phone numbers, and IVR." />,
      "sales-workspace": <ComingSoonPanel title="Sales Workspace" description="Configure your sales workspace settings." />,
      "inbox": <ComingSoonPanel title="Inbox" description="Manage inboxes, channels, SLAs, and availability." />,
      "marketing-tools": <ComingSoonPanel title="Marketing" description="Configure ads, email, forms, and subscription settings." />,
      "content": <ComingSoonPanel title="Content" description="Manage domains, navigation, themes, blog, and pages." />,
      "commerce": <ComingSoonPanel title="Commerce" description="Configure payments, tax rates, and automated sales tax." />,
    };

    return panelMap[activeSubsection] || <ComingSoonPanel title="Settings" description="Configure this section." />;
  };

  return (
    <div className="space-y-6">
      <PageGuide
        title="Settings"
        description="Configure your CRM preferences, account settings, integrations, and data management."
        sections={[
          { title: "Your Preferences", content: "Personal settings for profile, email, calling, calendar, tasks, security, and automation.", icon: "purpose" as const },
          { title: "Account Management", content: "Account defaults, audit logs, user hierarchy management, and product updates.", icon: "actions" as const },
          { title: "Data Management", content: "Manage properties per object type, configure objects, import/export data, and handle backups.", icon: "tips" as const },
        ]}
      />

      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="flex gap-6 min-h-[calc(100vh-220px)]">
        {/* Left Navigation */}
        <div className="w-64 shrink-0 space-y-1">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredSections.map((section) => (
            <div key={section.id}>
              <button
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                onClick={() => {
                  setActiveSection(section.id);
                  setActiveSubsection(section.subsections[0]?.id || "");
                }}
              >
                <section.icon className="h-4 w-4 shrink-0" />
                {section.label}
              </button>

              {activeSection === section.id && (
                <div className="ml-6 mt-1 space-y-0.5 mb-2">
                  {section.subsections.map((sub) => (
                    <button
                      key={sub.id}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                        activeSubsection === sub.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setActiveSubsection(sub.id)}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">
          {renderPanel()}
        </div>
      </div>
    </div>
  );
}
