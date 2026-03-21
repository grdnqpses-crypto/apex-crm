import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, TrendingUp, DollarSign, CheckCircle2, AlertTriangle,
  Building2, UserCheck, BarChart3, ArrowUpRight, ArrowDownRight,
  Activity, Target, Clock
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSkin } from "@/contexts/SkinContext";

export default function TeamPerformance() {
  const { t } = useSkin();
  const { user } = useAuth();
  const { data: teamData, isLoading } = trpc.teamOversight.performance.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Team Performance</h1>
          <p className="text-muted-foreground">Loading team data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const team = teamData || [];

  // Aggregate stats
  const totalMembers = team.length;
  const totalDeals = team.reduce((s: number, m: any) => s + (m.totalDeals || 0), 0);
  const wonDeals = team.reduce((s: number, m: any) => s + (m.wonDeals || 0), 0);
  const totalDealValue = team.reduce((s: number, m: any) => s + (m.totalDealValue || 0), 0);
  const wonDealValue = team.reduce((s: number, m: any) => s + (m.wonDealValue || 0), 0);
  const totalCompanies = team.reduce((s: number, m: any) => s + (m.companies || 0), 0);
  const totalContacts = team.reduce((s: number, m: any) => s + (m.contacts || 0), 0);
  const totalTasks = team.reduce((s: number, m: any) => s + (m.totalTasks || 0), 0);
  const winRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) : "0";

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
  const roleName = roleLabels[user?.systemRole || ""] || "User";

  const roleAccessNotes: Record<string, string> = {
    developer: "As a Developer, you have full platform access across all tenants. You can see all users at every role level.",
    axiom_admin: "As an Axiom Admin, you can see all Company Admins, Managers, and their teams across the platform.",
    axiom_owner: "As an Axiom Owner, you can see all users at every level.",
    company_admin: "As a Company Admin, you can see all Managers and team members within your organization. You cannot see Axiom-level users.",
    sales_manager: "As a Sales Manager, you can see only the Account Managers directly assigned to you.",
    office_manager: "As an Office Manager, you can see only the Coordinators directly assigned to you.",
    manager: "As a Manager, you can see data from all sales reps assigned to you.",
    account_manager: "As an Account Manager, you can only see your own data. Contact your manager for team data.",
    coordinator: "As a Coordinator, you can only see your own data. Contact your manager for team data.",
    user: "As a Sales Rep, you can only see your own data. Contact your manager for team data.",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Team Performance
          </h1>
          <p className="text-muted-foreground mt-1">
            {roleName} view — {totalMembers} team member{totalMembers !== 1 ? "s" : ""} reporting to you
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          <Activity className="h-3 w-3 mr-1" /> Live Data
        </Badge>
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

      {/* Team Member Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Individual Performance
          </CardTitle>
          <CardDescription>
            Detailed breakdown of each team member's activity and results
          </CardDescription>
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
                    <th className="text-center py-3 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member: any) => {
                    const memberWinRate = member.totalDeals > 0
                      ? ((member.wonDeals / member.totalDeals) * 100).toFixed(0)
                      : "—";
                    return (
                      <tr key={member.userId} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                              {(member.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.email || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {(member.systemRole || "user").replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className="font-medium">{member.companies || 0}</span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className="font-medium">{member.contacts || 0}</span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className="font-medium">{member.totalDeals || 0}</span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-medium text-green-600">{member.wonDeals || 0}</span>
                            <span className="text-xs text-muted-foreground">({memberWinRate}%)</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">
                          <span className="font-medium">
                            ${((member.totalDealValue || 0) / 1000).toFixed(0)}K
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-medium">{member.totalTasks || 0}</span>
                            {(member.overdueTasks || 0) > 0 && (
                              <Badge variant="destructive" className="text-[10px] px-1">
                                {member.overdueTasks} late
                              </Badge>
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
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="bg-muted/30 font-medium">
                    <td className="py-3 px-2" colSpan={2}>
                      <span className="text-muted-foreground">Team Total</span>
                    </td>
                    <td className="text-center py-3 px-2">{totalCompanies}</td>
                    <td className="text-center py-3 px-2">{totalContacts}</td>
                    <td className="text-center py-3 px-2">{totalDeals}</td>
                    <td className="text-center py-3 px-2 text-green-600">{wonDeals}</td>
                    <td className="text-right py-3 px-2">${(totalDealValue / 1000).toFixed(0)}K</td>
                    <td className="text-center py-3 px-2">{totalTasks}</td>
                    <td className="text-center py-3 px-2">
                      <Badge variant="outline" className="text-xs">{winRate}% win</Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Role-Based Data Access</p>
              <p className="text-muted-foreground mt-1">
                {roleAccessNotes[user?.systemRole || ""] || "You can only see data for team members at or below your role level."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
