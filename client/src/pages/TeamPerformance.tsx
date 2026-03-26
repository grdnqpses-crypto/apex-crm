import { useState, useMemo } from "react";
import { RefreshCw, Download, FileText, X, MessageSquare, Send, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users, TrendingUp, DollarSign, CheckCircle2, AlertTriangle,
  Building2, UserCheck, BarChart3, ArrowUpRight,
  Activity, Target, Clock, KeyRound, Eye, EyeOff, Copy, LogIn,
  ShieldCheck, Trophy, Flame, Star, TrendingDown
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSkin } from "@/contexts/SkinContext";
import { useLocation } from "wouter";

const roleLabels: Record<string, string> = {
  developer: "Developer",
  axiom_admin: "Axiom Admin",
  axiom_owner: "Axiom Owner",
  company_admin: "Company Admin",
  sales_manager: "Sales Manager",
  office_manager: "Office Manager",
  manager: "Manager",
  account_manager: "Account Manager",
  coordinator: "Coordinator",
  user: "Sales Rep",
};

const COMPANY_ADMIN_ROLES = ["company_admin", "axiom_owner", "axiom_admin", "developer"];

// ── Rep Drill-Down Drawer ──────────────────────────────────────────────────────
function RepDrawer({ member, open, onClose }: { member: any; open: boolean; onClose: () => void }) {
  const { t } = useSkin();
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<Array<{ text: string; date: string }>>(() => {
    try { return JSON.parse(localStorage.getItem(`coaching_notes_${member?.userId}`) || "[]"); } catch { return []; }
  });

  const saveNote = () => {
    if (!note.trim()) return;
    const newNote = { text: note.trim(), date: new Date().toLocaleString() };
    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem(`coaching_notes_${member?.userId}`, JSON.stringify(updated));
    setNote("");
    toast.success("Coaching note saved");
  };

  const deleteNote = (idx: number) => {
    const updated = notes.filter((_, i) => i !== idx);
    setNotes(updated);
    localStorage.setItem(`coaching_notes_${member?.userId}`, JSON.stringify(updated));
  };

  if (!member) return null;

  const winRate = member.totalDeals > 0 ? ((member.wonDeals / member.totalDeals) * 100).toFixed(1) : "0";
  const taskCompletionRate = member.totalTasks > 0
    ? (((member.totalTasks - (member.overdueTasks || 0)) / member.totalTasks) * 100).toFixed(0)
    : "100";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {(member.name || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <SheetTitle className="text-xl">{member.name}</SheetTitle>
              <SheetDescription className="text-sm">
                {roleLabels[member.systemRole] || member.systemRole} &middot; {member.email || "No email"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-5">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t("companies"), value: member.companies || 0, icon: Building2, color: "text-blue-500" },
              { label: t("contacts"), value: member.contacts || 0, icon: Users, color: "text-cyan-500" },
              { label: "Total Deals", value: member.totalDeals || 0, icon: Target, color: "text-purple-500" },
              { label: "Won Deals", value: member.wonDeals || 0, icon: Trophy, color: "text-green-500" },
              { label: "Pipeline Value", value: `$${((member.totalDealValue || 0) / 1000).toFixed(1)}K`, icon: DollarSign, color: "text-emerald-500" },
              { label: "Won Value", value: `$${((member.wonDealValue || 0) / 1000).toFixed(1)}K`, icon: TrendingUp, color: "text-green-600" },
              { label: "Win Rate", value: `${winRate}%`, icon: Star, color: "text-amber-500" },
              { label: "Active Tasks", value: member.totalTasks || 0, icon: CheckCircle2, color: "text-indigo-500" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/50">
                <Icon className={`h-5 w-5 ${color} shrink-0`} />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-bold text-lg leading-none mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Overdue alert */}
          {(member.overdueTasks || 0) > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">{member.overdueTasks} overdue tasks</p>
                <p className="text-xs opacity-80">Task completion rate: {taskCompletionRate}%</p>
              </div>
            </div>
          )}

          {/* Coaching Notes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Coaching Notes</h3>
              <Badge variant="outline" className="text-xs">{notes.length}</Badge>
            </div>
            <div className="space-y-2">
              <Textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a coaching note, observation, or action item..."
                className="resize-none bg-secondary/30"
                rows={3}
              />
              <Button size="sm" onClick={saveNote} disabled={!note.trim()} className="gap-2">
                <Send className="h-3.5 w-3.5" /> Save Note
              </Button>
            </div>
            {notes.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notes.map((n, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/20 border border-border/50 group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm flex-1">{n.text}</p>
                      <button
                        onClick={() => deleteNote(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{n.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TeamPerformance() {
  const { t } = useSkin();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({});
  const [credSearch, setCredSearch] = useState("");
  const [emulatingId, setEmulatingId] = useState<number | null>(null);
  const [resetTarget, setResetTarget] = useState<{ id: number; name: string; email: string | null } | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [drillMember, setDrillMember] = useState<any | null>(null);

  const isCompanyAdmin = COMPANY_ADMIN_ROLES.includes(user?.systemRole || "");

  const { data: teamData, isLoading } = trpc.teamOversight.performance.useQuery();
  const { data: credData, isLoading: credLoading } = trpc.teamOversight.getTeamCredentials.useQuery(
    undefined,
    { enabled: isCompanyAdmin }
  );

  const resetPasswordMutation = trpc.teamOversight.resetTeamMemberPassword.useMutation({
    onSuccess: (data) => {
      setNewPassword(data.tempPassword);
      toast.success("Password reset", { description: data.emailSent ? "New password emailed to user." : "Password updated. No email sent (no SMTP configured)." });
      utils.teamOversight.getTeamCredentials.invalidate();
    },
    onError: (err) => toast.error("Reset failed", { description: err.message }),
  });
  const utils = trpc.useUtils();

  const emulateMutation = trpc.tenants.emulate.useMutation({
    onSuccess: (data) => {
      sessionStorage.setItem("emulation_active", "true");
      sessionStorage.setItem("emulation_target", data.name || data.username || `User #${data.userId}`);
      toast.success(`Emulating ${data.name || data.username}`, { description: "You are now viewing the CRM as this user." });
      setTimeout(() => { window.location.href = "/dashboard"; }, 600);
    },
    onError: (err) => { toast.error("Emulation failed", { description: err.message }); setEmulatingId(null); },
  });

  const handleEmulate = (userId: number) => { setEmulatingId(userId); emulateMutation.mutate({ userId }); };
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  };
  const toggleReveal = (userId: number) => setRevealedPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!team.length) { toast.error("No data to export"); return; }
    const headers = ["Name", "Email", "Role", "Companies", "Contacts", "Total Deals", "Won Deals", "Win Rate %", "Pipeline Value", "Won Value", "Active Tasks", "Overdue Tasks"];
    const rows = team.map((m: any) => {
      const wr = m.totalDeals > 0 ? ((m.wonDeals / m.totalDeals) * 100).toFixed(1) : "0";
      return [m.name, m.email || "", roleLabels[m.systemRole] || m.systemRole, m.companies || 0, m.contacts || 0, m.totalDeals || 0, m.wonDeals || 0, wr, m.totalDealValue || 0, m.wonDealValue || 0, m.totalTasks || 0, m.overdueTasks || 0];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-performance-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${team.length} team members`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Team Performance</h1><p className="text-muted-foreground">Loading team data...</p></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}</div>
      </div>
    );
  }

  const team = teamData || [];
  const creds = credData || [];

  const totalMembers = team.length;
  const totalDeals = team.reduce((s: number, m: any) => s + (m.totalDeals || 0), 0);
  const wonDeals = team.reduce((s: number, m: any) => s + (m.wonDeals || 0), 0);
  const totalDealValue = team.reduce((s: number, m: any) => s + (m.totalDealValue || 0), 0);
  const wonDealValue = team.reduce((s: number, m: any) => s + (m.wonDealValue || 0), 0);
  const totalCompanies = team.reduce((s: number, m: any) => s + (m.companies || 0), 0);
  const totalContacts = team.reduce((s: number, m: any) => s + (m.contacts || 0), 0);
  const totalTasks = team.reduce((s: number, m: any) => s + (m.totalTasks || 0), 0);
  const winRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) : "0";

  const roleName = roleLabels[user?.systemRole || ""] || "User";
  const roleAccessNotes: Record<string, string> = {
    developer: "As a Developer, you have full platform access across all tenants.",
    axiom_admin: "As an Axiom Admin, you can see all Company Admins, Managers, and their teams.",
    axiom_owner: "As an Axiom Owner, you can see all users at every level.",
    company_admin: "As a Company Admin, you can see all Managers and team members within your organization.",
    sales_manager: "As a Sales Manager, you can see only the Account Managers directly assigned to you.",
    office_manager: "As an Office Manager, you can see only the Coordinators directly assigned to you.",
    manager: "As a Manager, you can see data from all sales reps assigned to you.",
    account_manager: "As an Account Manager, you can only see your own data.",
    coordinator: "As a Coordinator, you can only see your own data.",
    user: "As a Sales Rep, you can only see your own data.",
  };

  const filteredCreds = creds.filter((c: any) =>
    !credSearch ||
    c.name?.toLowerCase().includes(credSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(credSearch.toLowerCase()) ||
    c.username?.toLowerCase().includes(credSearch.toLowerCase())
  );

  // Sort by won deal value descending for leaderboard
  const sortedTeam = [...team].sort((a: any, b: any) => (b.wonDealValue || 0) - (a.wonDealValue || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Team Performance
          </h1>
          <p className="text-muted-foreground mt-1">{roleName} view — {totalMembers} team member{totalMembers !== 1 ? "s" : ""} reporting to you</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV} disabled={!team.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Activity className="h-3 w-3 mr-1" /> Live Data
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Team Members</p>
                <p className="text-2xl font-bold mt-1">{totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Pipeline</p>
                <p className="text-2xl font-bold mt-1">${(totalDealValue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-green-600">${(wonDealValue / 1000).toFixed(0)}K won</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate</p>
                <p className="text-2xl font-bold mt-1">{winRate}%</p>
                <p className="text-xs text-muted-foreground">{wonDeals}/{totalDeals} deals</p>
              </div>
              <Target className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Tasks</p>
                <p className="text-2xl font-bold mt-1">{totalTasks}</p>
                <p className="text-xs text-muted-foreground">{totalCompanies} companies</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="performance">
        <TabsList className={isCompanyAdmin ? "grid grid-cols-3 w-full max-w-lg" : "grid grid-cols-1 w-full max-w-xs"}>
          <TabsTrigger value="performance" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" /> Performance
          </TabsTrigger>
          {isCompanyAdmin && (
            <>
              <TabsTrigger value="credentials" className="flex items-center gap-1">
                <KeyRound className="h-4 w-4" /> Credentials
              </TabsTrigger>
              <TabsTrigger value="emulate" className="flex items-center gap-1">
                <LogIn className="h-4 w-4" /> Emulate
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* ── Performance Tab ── */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Individual Performance</CardTitle>
                  <CardDescription>Click any row to open a detailed breakdown and add coaching notes.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {team.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No team members found</p>
                  <p className="text-sm">Users assigned to you will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-3 px-2 font-medium">Team Member</th>
                        <th className="text-left py-3 px-2 font-medium">Role</th>
                        <th className="text-center py-3 px-2 font-medium">{t("companies")}</th>
                        <th className="text-center py-3 px-2 font-medium">{t("contacts")}</th>
                        <th className="text-center py-3 px-2 font-medium">{t("deals")}</th>
                        <th className="text-center py-3 px-2 font-medium">Won</th>
                        <th className="text-right py-3 px-2 font-medium">{t("pipeline")}</th>
                        <th className="text-center py-3 px-2 font-medium">{t("tasks")}</th>
                        <th className="text-center py-3 px-2 font-medium">Goal %</th>
                        <th className="text-center py-3 px-2 font-medium">Status</th>
                        <th className="text-center py-3 px-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTeam.map((member: any, idx: number) => {
                        const memberWinRate = member.totalDeals > 0
                          ? ((member.wonDeals / member.totalDeals) * 100).toFixed(0)
                          : "—";
                        const isTop = idx === 0 && (member.wonDealValue || 0) > 0;
                        return (
                          <tr
                            key={member.userId}
                            className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => setDrillMember(member)}
                          >
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                                    {(member.name || "?").charAt(0).toUpperCase()}
                                  </div>
                                  {isTop && <Trophy className="h-3 w-3 text-amber-400 absolute -top-1 -right-1" />}
                                </div>
                                <div>
                                  <p className="font-medium">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">{member.email || "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {(member.systemRole || "user").replace(/_/g, " ")}
                              </Badge>
                            </td>
                            <td className="text-center py-3 px-2"><span className="font-medium">{member.companies || 0}</span></td>
                            <td className="text-center py-3 px-2"><span className="font-medium">{member.contacts || 0}</span></td>
                            <td className="text-center py-3 px-2"><span className="font-medium">{member.totalDeals || 0}</span></td>
                            <td className="text-center py-3 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-medium text-green-600">{member.wonDeals || 0}</span>
                                <span className="text-xs text-muted-foreground">({memberWinRate}%)</span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-2">
                              <span className="font-medium">${((member.totalDealValue || 0) / 1000).toFixed(0)}K</span>
                            </td>
                            <td className="text-center py-3 px-2">
                              {(() => {
                                const quota = member.salesQuota || 0;
                                const won = member.wonDealValue || 0;
                                if (!quota) return <span className="text-xs text-muted-foreground">&mdash;</span>;
                                const pct = Math.round((won / quota) * 100);
                                const color = pct >= 100 ? 'text-green-600' : pct >= 75 ? 'text-amber-500' : 'text-red-500';
                                return (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className={`font-bold text-sm ${color}`}>{pct}%</span>
                                    <div className="w-14 h-1 bg-muted rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="text-center py-3 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-medium">{member.totalTasks || 0}</span>
                                {(member.overdueTasks || 0) > 0 && (
                                  <Badge variant="destructive" className="text-[10px] px-1">{member.overdueTasks} late</Badge>
                                )}
                              </div>
                            </td>
                            <td className="text-center py-3 px-2">
                              {member.isActive !== false ? (
                                <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                              )}
                            </td>
                            <td className="text-center py-3 px-2">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30 font-medium">
                        <td className="py-3 px-2" colSpan={2}><span className="text-muted-foreground">Team Total</span></td>
                        <td className="text-center py-3 px-2">{totalCompanies}</td>
                        <td className="text-center py-3 px-2">{totalContacts}</td>
                        <td className="text-center py-3 px-2">{totalDeals}</td>
                        <td className="text-center py-3 px-2 text-green-600">{wonDeals}</td>
                        <td className="text-right py-3 px-2">${(totalDealValue / 1000).toFixed(0)}K</td>
                        <td className="text-center py-3 px-2">{totalTasks}</td>
                        <td className="text-center py-3 px-2">&mdash;</td>
                        <td className="text-center py-3 px-2" colSpan={2}>
                          <Badge variant="outline" className="text-xs">{winRate}% win</Badge>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Credentials Tab ── */}
        {isCompanyAdmin && (
          <TabsContent value="credentials">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-amber-500" /> Team Credentials</CardTitle>
                    <CardDescription className="mt-1">Login usernames and passwords for all users under your company. Keep this information confidential.</CardDescription>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 shrink-0"><ShieldCheck className="h-3 w-3 mr-1" /> Admin Only</Badge>
                </div>
                <div className="mt-3">
                  <Input placeholder="Search by name, email, or username..." value={credSearch} onChange={e => setCredSearch(e.target.value)} className="max-w-sm" />
                </div>
              </CardHeader>
              <CardContent>
                {credLoading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
                ) : filteredCreds.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <KeyRound className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No team members found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCreds.map((member: any) => (
                      <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {(member.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{member.name}</p>
                            <Badge variant="outline" className="text-[10px] capitalize shrink-0">{(member.systemRole || "user").replace(/_/g, " ")}</Badge>
                            {member.isActive === false && <Badge variant="secondary" className="text-[10px] shrink-0">Inactive</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 min-w-[180px]">
                          <div className="flex-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Username / Email</p>
                            <p className="text-sm font-mono truncate">{member.username || member.email || "—"}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(member.username || member.email || "", "Username")}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 min-w-[160px]">
                          <div className="flex-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Password</p>
                            <p className="text-sm font-mono">
                              {member.plainTextPassword
                                ? (revealedPasswords[member.id] ? member.plainTextPassword : "••••••••")
                                : <span className="text-muted-foreground italic text-xs">Not stored</span>
                              }
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {member.plainTextPassword && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleReveal(member.id)}>
                                  {revealedPasswords[member.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(member.plainTextPassword, "Password")}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:text-amber-700" onClick={() => { setResetTarget({ id: member.id, name: member.name, email: member.email }); setNewPassword(null); }}>
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── Emulate Tab ── */}
        {isCompanyAdmin && (
          <TabsContent value="emulate">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2"><LogIn className="h-5 w-5 text-blue-500" /> Emulate Team Member</CardTitle>
                    <CardDescription className="mt-1">Log in as any user under your company to view the CRM exactly as they see it.</CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 shrink-0"><ShieldCheck className="h-3 w-3 mr-1" /> Admin Only</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {credLoading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
                ) : creds.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No team members to emulate</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {creds.map((member: any) => (
                      <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {(member.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{member.name}</p>
                            <Badge variant="outline" className="text-[10px] capitalize shrink-0">{(member.systemRole || "user").replace(/_/g, " ")}</Badge>
                            {member.isActive === false && <Badge variant="secondary" className="text-[10px] shrink-0">Inactive</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          {member.lastSignedIn && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">Last signed in: {new Date(member.lastSignedIn).toLocaleDateString()}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="shrink-0 gap-1.5" disabled={emulatingId === member.id || emulateMutation.isPending} onClick={() => handleEmulate(member.id)}>
                          <LogIn className="h-3.5 w-3.5" />
                          {emulatingId === member.id ? "Switching..." : "Emulate"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open) { setResetTarget(null); setNewPassword(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-amber-500" /> Reset Password</DialogTitle>
            <DialogDescription>
              {newPassword
                ? `Password has been reset for ${resetTarget?.name}.`
                : `Generate a new temporary password for ${resetTarget?.name}. ${resetTarget?.email ? "A copy will be emailed to them." : "Note: no email on file — share the password manually."}`
              }
            </DialogDescription>
          </DialogHeader>
          {newPassword ? (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted p-4">
                <p className="text-xs text-muted-foreground mb-1">New Temporary Password</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono font-bold tracking-widest flex-1">{newPassword}</code>
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(newPassword); toast.success("Copied!"); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Ask the user to log in and change their password immediately.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">This will immediately replace their current password.</p>
          )}
          <DialogFooter>
            {newPassword ? (
              <Button onClick={() => { setResetTarget(null); setNewPassword(null); }}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setResetTarget(null)}>Cancel</Button>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white" disabled={resetPasswordMutation.isPending} onClick={() => resetTarget && resetPasswordMutation.mutate({ userId: resetTarget.id, sendEmail: !!resetTarget.email })}>
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Access Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Role-Based Data Access</p>
              <p className="text-muted-foreground mt-1">{roleAccessNotes[user?.systemRole || ""] || "You can only see data for team members at or below your role level."}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rep Drill-Down Drawer */}
      <RepDrawer member={drillMember} open={!!drillMember} onClose={() => setDrillMember(null)} />
    </div>
  );
}
