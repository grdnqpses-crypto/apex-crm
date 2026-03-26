import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Trash2, Edit2, CheckSquare, XSquare } from "lucide-react";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";

type EntityType = "contacts" | "deals" | "companies";

export default function BulkActions() {
  const { t } = useSkin();
  const [entityType, setEntityType] = useState<EntityType>("contacts");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [updateField, setUpdateField] = useState("");
  const [updateValue, setUpdateValue] = useState("");

  const utils = trpc.useUtils();

  // Fetch data for each entity type
  const { data: contacts } = trpc.contacts.list.useQuery({ limit: 100, offset: 0 }, { enabled: entityType === "contacts" });
  const { data: deals } = trpc.deals.list.useQuery({ limit: 100, offset: 0 }, { enabled: entityType === "deals" });
  const { data: companies } = trpc.companies.list.useQuery({ limit: 100, offset: 0 }, { enabled: entityType === "companies" });

  const bulkUpdateMutation = trpc.bulkActions.updateContacts.useMutation({
    onSuccess: (data: { updated: number }) => {
      toast(`Updated ${data.updated} records`);
      setSelectedIds([]);
      utils.contacts.list.invalidate();
      utils.deals.list.invalidate();
      utils.companies.list.invalidate();
    },
    onError: (err: { message: string }) => toast.error(`Update failed: ${err.message}`),
  });

  const bulkDeleteMutation = trpc.bulkActions.deleteContacts.useMutation({
    onSuccess: (data: { deleted: number }) => {
      toast(`Deleted ${data.deleted} records`);
      setSelectedIds([]);
      utils.contacts.list.invalidate();
      utils.deals.list.invalidate();
      utils.companies.list.invalidate();
    },
    onError: (err: { message: string }) => toast.error(`Delete failed: ${err.message}`),
  });

  const items: { id: number; label: string }[] =
    entityType === "contacts"
      ? (contacts?.items ?? []).map((c: { id: number; firstName: string; lastName: string | null; email: string | null }) => ({ id: c.id, label: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || `Contact ${c.id}` }))
      : entityType === "deals"
      ? (deals?.items ?? []).map((d: { id: number; name: string }) => ({ id: d.id, label: d.name }))
      : (companies?.items ?? []).map((c: { id: number; name: string | null }) => ({ id: c.id, label: c.name ?? `Company ${c.id}` }));

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : items.map(i => i.id));
  }

  function toggleItem(id: number) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Layers className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Bulk Actions</h1>
            <p className="text-muted-foreground text-sm">Select multiple records and update or delete them in one operation.</p>
          </div>
        </div>

        {/* Entity type selector */}
        <div className="flex gap-2">
          {(["contacts", "deals", "companies"] as EntityType[]).map(et => (
            <button
              key={et}
              onClick={() => { setEntityType(et); setSelectedIds([]); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${entityType === et ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {et}
            </button>
          ))}
        </div>

        {/* Action bar */}
        {selectedIds.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className="text-sm px-3 py-1">{selectedIds.length} selected</Badge>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Field</Label>
                  <Input
                    placeholder="e.g. status, assignedTo"
                    value={updateField}
                    onChange={e => setUpdateField(e.target.value)}
                    className="w-36"
                  />
                  <Label className="text-sm">Value</Label>
                  <Input
                    placeholder="New value"
                    value={updateValue}
                    onChange={e => setUpdateValue(e.target.value)}
                    className="w-36"
                  />
                  <Button
                    size="sm"
                    disabled={!updateField || !updateValue || bulkUpdateMutation.isPending}
                    onClick={() => bulkUpdateMutation.mutate({
                      ids: selectedIds,
                      updates: { leadStatus: updateValue },
                    })}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    {bulkUpdateMutation.isPending ? "Updating…" : "Update"}
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={bulkDeleteMutation.isPending}
                  onClick={() => {
                    if (confirm(`Delete ${selectedIds.length} ${entityType}? This cannot be undone.`)) {
                      bulkDeleteMutation.mutate({ ids: selectedIds });
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {bulkDeleteMutation.isPending ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base capitalize">{entityType}</CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleAll}>
              {allSelected ? <XSquare className="h-4 w-4 mr-1" /> : <CheckSquare className="h-4 w-4 mr-1" />}
              {allSelected ? "Deselect All" : "Select All"}
            </Button>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No {entityType} found.</div>
            ) : (
              <div className="space-y-1">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${selectedIds.includes(item.id) ? "bg-primary/10" : "hover:bg-muted/50"}`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
