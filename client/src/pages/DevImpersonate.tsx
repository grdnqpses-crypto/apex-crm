import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Eye, Search, Shield, ShieldCheck, UserCog, User, X, CheckCircle, XCircle, Palette, RotateCcw } from "lucide-react";
import PageGuide from "@/components/PageGuide";
import { SkinQAPanel } from "@/components/SkinQAPanel";
import { useSkin, SkinId, SKINS } from "@/contexts/SkinContext";

const roleColors: Record<string, string> = {
  developer: "bg-red-500/10 text-red-400 border-red-500/20",
  axiom_owner: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  company_admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  sales_manager: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  office_manager: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  manager: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  account_manager: "bg-green-500/10 text-green-400 border-green-500/20",
  coordinator: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  user: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const roleLabels: Record<string, string> = {
  developer: "Developer",
  axiom_owner: "AXIOM Owner",
  company_admin: "Company Admin",
  sales_manager: "Sales Manager",
  office_manager: "Office Manager",
  manager: "Sales Manager",
  account_manager: "Account Manager",
  coordinator: "Coordinator",
  user: "Account Manager",
};

const roleIcons: Record<string, any> = {
  developer: Shield,
  axiom_owner: Shield,
  company_admin: ShieldCheck,
  sales_manager: UserCog,
  office_manager: UserCog,
  manager: UserCog,
  account_manager: User,
  coordinator: User,
  user: User,
};

export default function DevImpersonate() {
  const { t } = useSkin();
  const { data: allUsers } = trpc.userManagement.allUsers.useQuery();
  const { data: allFeatures } = trpc.tenants.allFeatures.useQuery();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "skins">("users");
  const { skinId, setSkin } = useSkin();

  const { data: impersonatedUser, isLoading: impLoading } = trpc.devTools.impersonateUser.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  // Fetch the client's skin when a user is selected
  const { data: clientSkinData } = trpc.migration.getClientSkin.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  // Auto-apply the client's skin when a user is selected
  useEffect(() => {
    if (clientSkinData?.skin && selectedUserId) {
      setSkin(clientSkinData.skin as SkinId);
    }
  }, [clientSkinData?.skin, selectedUserId]);

  const filteredUsers = (allUsers || []).filter((u: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.user.name || "").toLowerCase().includes(s) || (u.user.email || "").toLowerCase().includes(s);
  });

  const clientSkin = clientSkinData?.skin as SkinId | undefined;
  const clientSkinName = clientSkin ? SKINS[clientSkin]?.name : undefined;

  return (
    <div className="space-y-6">
      <PageGuide title="Developer Tools" description="View clients as they see it, and QA-test all skins" sections={[
        { title: "User Impersonation", content: "Select a user to view their profile, features, and — critically — their active CRM skin. The UI automatically switches to match their skin so you see exactly what they see.", icon: "purpose" },
        { title: "Skin QA Switcher", content: "Manually switch between all 7 competitor skins to verify colors, fonts, terminology, and layouts are correct before client delivery.", icon: "purpose" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Developer Tools</h1>
          <p className="text-muted-foreground text-sm mt-1">Impersonate clients and QA-test all skins</p>
        </div>
        {skinId !== "axiom" && (
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1">
              <Eye className="h-3 w-3" /> Viewing in: {SKINS[skinId]?.name}
            </Badge>
            <Button variant="outline" size="sm" className="rounded-lg gap-1.5" onClick={() => setSkin("axiom")}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset to AXIOM
            </Button>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl w-fit">
        <Button
          variant={activeTab === "users" ? "default" : "ghost"}
          size="sm"
          className="rounded-lg gap-2"
          onClick={() => setActiveTab("users")}
        >
          <Eye className="h-4 w-4" /> User Impersonation
        </Button>
        <Button
          variant={activeTab === "skins" ? "default" : "ghost"}
          size="sm"
          className="rounded-lg gap-2"
          onClick={() => setActiveTab("skins")}
        >
          <Palette className="h-4 w-4" /> Skin QA Switcher
        </Button>
      </div>

      {/* Skin QA tab */}
      {activeTab === "skins" && (
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardContent className="p-6">
            <SkinQAPanel
              clientSkin={clientSkin}
              clientName={impersonatedUser?.user?.name ?? undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* User Impersonation tab */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select User</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto">
              <Table>
                <TableBody>
                  {filteredUsers.map((item: any) => {
                    const u = item.user;
                    const isSelected = selectedUserId === u.id;
                    const RoleIcon = roleIcons[u.systemRole || "user"] || User;
                    return (
                      <TableRow key={u.id} className={`cursor-pointer ${isSelected ? "bg-primary/5" : ""}`} onClick={() => setSelectedUserId(u.id)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10"}`}>
                              {(u.name || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{u.name || "Unnamed"}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`text-xs ${roleColors[u.systemRole || "account_manager"]}`}>
                            <RoleIcon className="h-3 w-3 mr-1" />{roleLabels[u.systemRole] || u.systemRole}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Impersonation View */}
          <div className="space-y-4">
            {!selectedUserId ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a user to view their perspective</p>
                  <p className="text-xs mt-2 opacity-60">The UI will automatically switch to their active skin</p>
                </CardContent>
              </Card>
            ) : impLoading ? (
              <Card><CardContent className="py-16 text-center text-muted-foreground">Loading user data...</CardContent></Card>
            ) : impersonatedUser ? (
              <>
                {/* Skin indicator for this client */}
                {clientSkin && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl border"
                    style={{
                      background: `${SKINS[clientSkin]?.primaryColor}12`,
                      borderColor: `${SKINS[clientSkin]?.primaryColor}30`,
                    }}
                  >
                    <span className="text-xl">{SKINS[clientSkin]?.logo}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        Viewing in <span style={{ color: SKINS[clientSkin]?.primaryColor }}>{clientSkinName}</span> skin
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This client migrated from {clientSkinName}. The entire UI now matches their experience.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs gap-1.5 shrink-0"
                      onClick={() => { setActiveTab("skins"); }}
                    >
                      <Palette className="h-3.5 w-3.5" /> Change Skin
                    </Button>
                  </div>
                )}

                {/* User Profile Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Eye className="h-4 w-4 text-amber-400" />Viewing as: {impersonatedUser.user.name}
                      </CardTitle>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedUserId(null); setSkin("axiom"); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-2xl font-bold text-amber-400">
                        {(impersonatedUser.user.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{impersonatedUser.user.name}</h3>
                        <p className="text-sm text-muted-foreground">{impersonatedUser.user.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className={roleColors[impersonatedUser.user.systemRole || "account_manager"]}>
                            {roleLabels[impersonatedUser.user.systemRole] || impersonatedUser.user.systemRole}
                          </Badge>
                          <Badge variant="outline" className={impersonatedUser.user.isActive !== false ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}>
                            {impersonatedUser.user.isActive !== false ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm border-t border-border pt-4">
                      <div><span className="text-muted-foreground">Company:</span> <span className="font-medium">{impersonatedUser.companyName || "Unassigned"}</span></div>
                      <div><span className="text-muted-foreground">Job Title:</span> <span className="font-medium">{impersonatedUser.user.jobTitle || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{impersonatedUser.user.phone || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">Last Login:</span> <span className="font-medium">{impersonatedUser.user.lastSignedIn ? new Date(impersonatedUser.user.lastSignedIn).toLocaleString() : "Never"}</span></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature Access Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Feature Access ({impersonatedUser.features.length}/{allFeatures?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {impersonatedUser.user.systemRole === "developer" ? (
                      <div className="text-center py-4">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-red-400" />
                        <p className="text-sm font-medium text-red-400">God Mode — Full Access to All Features</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {(allFeatures || []).map((f: any) => {
                          const hasAccess = impersonatedUser.features.includes(f.key);
                          return (
                            <div key={f.key} className={`flex items-center gap-2 text-sm p-2 rounded ${hasAccess ? "bg-emerald-500/5" : "bg-muted/30 opacity-50"}`}>
                              {hasAccess ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                              <span className={hasAccess ? "" : "line-through"}>{f.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
