import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import { CheckCircle2, AlertCircle, Download, Upload, Trash2, Tag, Users, FileText } from "lucide-react";

export default function BulkOperations() {
  const { t } = useSkin();
  const [activeTab, setActiveTab] = useState("contacts");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [operationType, setOperationType] = useState<string>("");

  const bulkUpdateMutation = trpc.bulkOperations.bulkUpdateContacts.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowDialog(false);
      setSelectedIds([]);
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkDeleteMutation = trpc.bulkOperations.bulkDeleteContacts.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowDialog(false);
      setSelectedIds([]);
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkExportMutation = trpc.bulkOperations.bulkExportContacts.useMutation({
    onSuccess: (data) => {
      toast.success("Export started!");
      window.open(data.downloadUrl, "_blank");
      setShowDialog(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleBulkAction = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select items");
      return;
    }

    switch (operationType) {
      case "delete":
        bulkDeleteMutation.mutate({ contactIds: selectedIds });
        break;
      case "export":
        bulkExportMutation.mutate({ contactIds: selectedIds, format: "csv" });
        break;
      default:
        toast.error("Select an operation");
    }
  };

  const operations = [
    { id: "update", label: "Update", icon: "✏️" },
    { id: "assign", label: "Assign", icon: "👤" },
    { id: "tag", label: "Add Tags", icon: "🏷️" },
    { id: "export", label: "Export", icon: "📥" },
    { id: "delete", label: "Delete", icon: "🗑️" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bulk Operations</h1>
          <p className="text-muted-foreground">Perform actions on multiple records at once.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowDialog(true)} disabled={selectedIds.length === 0}>
            <FileText className="h-4 w-4 mr-2" />
            Bulk Action ({selectedIds.length})
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(`contact_${i}`)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, `contact_${i}`]);
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== `contact_${i}`));
                        }
                      }}
                      className="rounded border-border"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Contact {i}</p>
                      <p className="text-sm text-muted-foreground">contact{i}@example.com</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(`deal_${i}`)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, `deal_${i}`]);
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== `deal_${i}`));
                        }
                      }}
                      className="rounded border-border"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Deal {i}</p>
                      <p className="text-sm text-muted-foreground">$50,000 - Negotiation</p>
                    </div>
                    <Badge>In Progress</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(`account_${i}`)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, `account_${i}`]);
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== `account_${i}`));
                        }
                      }}
                      className="rounded border-border"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Company {i}</p>
                      <p className="text-sm text-muted-foreground">Tech Industry</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Task Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Create Tasks For:</Label>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="cursor-pointer">All Contacts</Badge>
                  <Badge variant="outline" className="cursor-pointer">Selected Deals</Badge>
                  <Badge variant="outline" className="cursor-pointer">Unassigned</Badge>
                </div>
              </div>
              <Button>Create Bulk Tasks</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operation History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Bulk Update - {i} items</p>
                        <p className="text-sm text-muted-foreground">Completed 2 hours ago</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">Details</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Action Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Operation ({selectedIds.length} items)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Operation</Label>
              <div className="grid grid-cols-2 gap-2">
                {operations.map(op => (
                  <div
                    key={op.id}
                    onClick={() => setOperationType(op.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      operationType === op.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <p className="text-2xl mb-1">{op.icon}</p>
                    <p className="text-sm font-medium">{op.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {operationType === "tag" && (
              <div className="space-y-2">
                <Label>Tags to Add</Label>
                <Input placeholder="Enter tags separated by comma" />
              </div>
            )}

            {operationType === "assign" && (
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Input placeholder="Select user" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleBulkAction}
              disabled={!operationType || bulkUpdateMutation.isPending || bulkDeleteMutation.isPending}
            >
              {bulkUpdateMutation.isPending || bulkDeleteMutation.isPending ? "Processing..." : "Execute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
