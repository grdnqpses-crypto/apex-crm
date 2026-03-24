import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Trash2, Download, FileText, Clock, CheckCircle2, AlertTriangle, Search, Plus } from "lucide-react";
import { toast } from "sonner";

export default function GDPRTools() {
  const [searchQ, setSearchQ] = useState("");
  const [consentForm, setConsentForm] = useState({ contactId: "", type: "marketing", status: "granted" });
  const [consentOpen, setConsentOpen] = useState(false);
  const [deletionContactId, setDeletionContactId] = useState("");
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [exportContactId, setExportContactId] = useState("");

  const utils = trpc.useUtils();

  const { data: deletionRequests } = trpc.gdpr.listDeletionRequests.useQuery();
  const { data: consents } = trpc.gdpr.listConsents.useQuery({ contactId: searchQ ? parseInt(searchQ) : undefined });
  const { data: auditLog } = trpc.gdpr.getAuditLog.useQuery({ limit: 50 });
  const { data: stats } = trpc.gdpr.getStats.useQuery();

  const requestDeletion = trpc.gdpr.requestDeletion.useMutation({
    onSuccess: () => {
      toast.success("Deletion request submitted");
      setDeletionOpen(false);
      setDeletionContactId("");
      utils.gdpr.listDeletionRequests.invalidate();
      utils.gdpr.getStats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const processDeletion = trpc.gdpr.processDeletion.useMutation({
    onSuccess: () => {
      toast.success("Contact data erased");
      utils.gdpr.listDeletionRequests.invalidate();
      utils.gdpr.getStats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const recordConsent = trpc.gdpr.recordConsent.useMutation({
    onSuccess: () => {
      toast.success("Consent recorded");
      setConsentOpen(false);
      utils.gdpr.listConsents.invalidate();
      utils.gdpr.getStats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const exportData = trpc.gdpr.exportContactData.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contact-${exportContactId}-data-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    },
    onError: (e) => toast.error(e.message),
  });

  const statusColor = (s: string) => {
    if (s === "granted") return "bg-green-500/20 text-green-400";
    if (s === "revoked") return "bg-red-500/20 text-red-400";
    return "bg-yellow-500/20 text-yellow-400";
  };

  const deletionStatusColor = (s: string) => {
    if (s === "completed") return "bg-green-500/20 text-green-400";
    if (s === "pending") return "bg-yellow-500/20 text-yellow-400";
    return "bg-blue-500/20 text-blue-400";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> GDPR Compliance
            </h1>
            <p className="text-muted-foreground mt-1">Consent management, right-to-be-forgotten, data export, and audit trail</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Record Consent</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Consent</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-sm font-medium">Contact ID</label>
                    <Input type="number" placeholder="e.g. 42" value={consentForm.contactId} onChange={e => setConsentForm(f => ({ ...f, contactId: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Consent Type</label>
                    <Select value={consentForm.type} onValueChange={v => setConsentForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="data_processing">Data Processing</SelectItem>
                        <SelectItem value="third_party_sharing">Third-Party Sharing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={consentForm.status} onValueChange={v => setConsentForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="granted">Granted</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={() => recordConsent.mutate({ contactId: parseInt(consentForm.contactId), type: consentForm.type as any, status: consentForm.status as any })} disabled={recordConsent.isPending || !consentForm.contactId}>
                    {recordConsent.isPending ? "Saving…" : "Save Consent"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={deletionOpen} onOpenChange={setDeletionOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /> Request Deletion</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Right-to-Be-Forgotten Request</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-300">This will queue a deletion request. An admin must confirm before data is permanently erased.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact ID</label>
                    <Input type="number" placeholder="e.g. 42" value={deletionContactId} onChange={e => setDeletionContactId(e.target.value)} />
                  </div>
                  <Button variant="destructive" className="w-full" onClick={() => requestDeletion.mutate({ contactId: parseInt(deletionContactId) })} disabled={requestDeletion.isPending || !deletionContactId}>
                    {requestDeletion.isPending ? "Submitting…" : "Submit Deletion Request"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Consents Granted", value: stats?.consentsGranted ?? 0, icon: CheckCircle2, color: "text-green-400" },
            { label: "Consents Revoked", value: stats?.consentsRevoked ?? 0, icon: AlertTriangle, color: "text-red-400" },
            { label: "Deletion Requests", value: stats?.deletionRequests ?? 0, icon: Trash2, color: "text-yellow-400" },
            { label: "Audit Events (30d)", value: stats?.auditEvents ?? 0, icon: FileText, color: "text-blue-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className={`w-8 h-8 ${s.color} opacity-40`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="consents">
          <TabsList>
            <TabsTrigger value="consents">Consent Records</TabsTrigger>
            <TabsTrigger value="deletions">Deletion Requests</TabsTrigger>
            <TabsTrigger value="export">Data Export</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* Consents */}
          <TabsContent value="consents" className="mt-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Filter by Contact ID…" value={searchQ} onChange={e => setSearchQ(e.target.value)} className="max-w-xs h-8 text-sm" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {(!consents || consents.length === 0) ? (
                  <p className="text-center text-muted-foreground py-10">No consent records found.</p>
                ) : (
                  <div className="divide-y divide-border/30">
                    {consents.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium">Contact #{c.contactId}</p>
                          <p className="text-xs text-muted-foreground capitalize">{c.type.replace(/_/g, " ")} · {new Date(c.recordedAt).toLocaleDateString()}</p>
                        </div>
                        <Badge className={statusColor(c.status)}>{c.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deletion Requests */}
          <TabsContent value="deletions" className="mt-4">
            <Card className="border-border/50">
              <CardContent className="p-0">
                {(!deletionRequests || deletionRequests.length === 0) ? (
                  <p className="text-center text-muted-foreground py-10">No deletion requests.</p>
                ) : (
                  <div className="divide-y divide-border/30">
                    {deletionRequests.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium">Contact #{r.contactId}</p>
                          <p className="text-xs text-muted-foreground">Requested {new Date(r.requestedAt).toLocaleDateString()}</p>
                          {r.processedAt && <p className="text-xs text-muted-foreground">Processed {new Date(r.processedAt).toLocaleDateString()}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={deletionStatusColor(r.status)}>{r.status}</Badge>
                          {r.status === "pending" && (
                            <Button size="sm" variant="destructive" onClick={() => processDeletion.mutate({ requestId: r.id })} disabled={processDeletion.isPending}>
                              Erase Data
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Export */}
          <TabsContent value="export" className="mt-4">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="max-w-md space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Export Contact Data</h3>
                    <p className="text-sm text-muted-foreground">Download all data held for a specific contact in JSON format, compliant with GDPR Article 20 (data portability).</p>
                  </div>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Contact ID" value={exportContactId} onChange={e => setExportContactId(e.target.value)} />
                    <Button onClick={() => exportData.mutate({ contactId: parseInt(exportContactId) })} disabled={exportData.isPending || !exportContactId} className="gap-1.5 shrink-0">
                      <Download className="w-4 h-4" /> {exportData.isPending ? "Exporting…" : "Export"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log */}
          <TabsContent value="audit" className="mt-4">
            <Card className="border-border/50">
              <CardContent className="p-0">
                {(!auditLog || auditLog.length === 0) ? (
                  <p className="text-center text-muted-foreground py-10">No audit events yet.</p>
                ) : (
                  <div className="divide-y divide-border/30">
                    {auditLog.map((e: any) => (
                      <div key={e.id} className="flex items-start gap-3 px-5 py-3">
                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{e.action}</p>
                          <p className="text-xs text-muted-foreground truncate">{e.details}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{new Date(e.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
