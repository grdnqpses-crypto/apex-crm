import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Map, Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TerritoryManagement() {
  const { t } = useSkin();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const utils = trpc.useUtils();
  const { data: territories, isLoading } = trpc.territories.list.useQuery();

  const createMutation = trpc.territories.create.useMutation({
    onSuccess: () => {
      toast("Territory created");
      utils.territories.list.invalidate();
      setShowCreate(false);
      setName("");
      setDescription("");
    },
  });

  const deleteMutation = trpc.territories.delete.useMutation({
    onSuccess: () => {
      toast("Territory deleted");
      utils.territories.list.invalidate();
    },
  });

  return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Map className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Territory Management</h1>
              <p className="text-muted-foreground text-sm">Define sales territories and assign reps to regions.</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Territory
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-3 text-center py-12 text-muted-foreground">Loading territories…</div>
          ) : !territories?.length ? (
            <div className="col-span-3 text-center py-12">
              <Map className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No territories defined yet.</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create First Territory
              </Button>
            </div>
          ) : territories.map(territory => (
            <Card key={territory.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{territory.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-7 px-2"
                    onClick={() => deleteMutation.mutate({ id: territory.id })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {territory.description && (
                  <p className="text-sm text-muted-foreground mt-1">{territory.description}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {(territory.assignedUserIds as number[])?.length ?? 0} rep{(territory.assignedUserIds as number[])?.length !== 1 ? "s" : ""}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(territory.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Territory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Territory Name</Label>
                <Input placeholder="e.g. Northeast US" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the geographic or account scope…"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                disabled={!name.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate({ name: name.trim(), description, assignedUserIds: [] })}
              >
                {createMutation.isPending ? "Creating…" : "Create Territory"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
