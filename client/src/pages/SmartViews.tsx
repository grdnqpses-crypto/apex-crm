import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Filter, Plus, Trash2, Share2, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ENTITY_TYPES = ["contacts", "deals", "companies", "leads"];

export default function SmartViews() {
  const [entityType, setEntityType] = useState("contacts");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newShared, setNewShared] = useState(false);

  const utils = trpc.useUtils();
  const { data: views, isLoading } = trpc.smartViews.list.useQuery({ entityType });

  const createMutation = trpc.smartViews.create.useMutation({
    onSuccess: () => {
      toast("Smart view created");
      utils.smartViews.list.invalidate();
      setShowCreate(false);
      setNewName("");
    },
  });

  const deleteMutation = trpc.smartViews.delete.useMutation({
    onSuccess: () => {
      toast("View deleted");
      utils.smartViews.list.invalidate();
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Smart Views</h1>
              <p className="text-muted-foreground text-sm">Save custom filtered views of contacts, deals, and companies.</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> New View
          </Button>
        </div>

        {/* Entity type tabs */}
        <div className="flex gap-2">
          {ENTITY_TYPES.map(et => (
            <button
              key={et}
              onClick={() => setEntityType(et)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${entityType === et ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {et}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base capitalize">{entityType} Views</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading views…</div>
            ) : !views?.length ? (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No smart views yet. Create one to save your filters.</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Create First View
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {views.map(view => (
                  <Card key={view.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{view.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {Object.keys(view.filters as object).length} filter{Object.keys(view.filters as object).length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {view.isShared ? (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              <Share2 className="h-3 w-3" /> Shared
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Eye className="h-3 w-3" /> Private
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(view.createdAt).toLocaleDateString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive h-7 px-2"
                          onClick={() => deleteMutation.mutate({ id: view.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Smart View</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>View Name</Label>
                <Input
                  placeholder="e.g. High-value leads in California"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map(et => (
                      <SelectItem key={et} value={et} className="capitalize">{et}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={newShared} onCheckedChange={setNewShared} id="shared" />
                <Label htmlFor="shared">Share with team</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                disabled={!newName.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate({
                  name: newName.trim(),
                  entityType,
                  filters: {},
                  isShared: newShared,
                })}
              >
                {createMutation.isPending ? "Creating…" : "Create View"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
