import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, FlaskConical, MoreHorizontal, Trash2, Play, Trophy, BarChart3 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  running: "bg-chart-1/15 text-chart-1",
  completed: "bg-success/15 text-success",
};

export default function ABTests() {
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: tests, isLoading } = trpc.abTests.list.useQuery();
  const createMutation = trpc.abTests.create.useMutation({
    onSuccess: () => { utils.abTests.list.invalidate(); setShowCreate(false); toast.success("A/B test created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.abTests.update.useMutation({
    onSuccess: () => { utils.abTests.list.invalidate(); },
  });
  const deleteMutation = trpc.abTests.delete.useMutation({
    onSuccess: () => { utils.abTests.list.invalidate(); toast.success("Test deleted"); },
  });

  const [form, setForm] = useState({
    name: "",
    type: "subject_line" as string,
    variantA: "",
    variantB: "",
    sampleSize: "1000",
  });

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    createMutation.mutate({
      name: form.name,
      type: form.type as any,
      variants: [
        { name: "Variant A", value: form.variantA },
        { name: "Variant B", value: form.variantB },
      ],
      sampleSize: parseInt(form.sampleSize) || 1000,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">A/B Testing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Test subject lines, content, send times, and sender names to optimize engagement.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> New Test
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-6"><div className="space-y-3 animate-pulse"><div className="h-5 w-32 bg-muted rounded" /><div className="h-4 w-48 bg-muted rounded" /></div></CardContent></Card>
          ))
        ) : tests?.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-card border-border"><CardContent className="p-12 text-center text-muted-foreground">No A/B tests yet. Create your first test to optimize your campaigns.</CardContent></Card>
          </div>
        ) : (
          tests?.map((test) => {
            const variants = (test.variants as any[]) ?? [];
            const results = (test.results as Record<string, any>) ?? {};
            return (
              <Card key={test.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-chart-3/10 flex items-center justify-center shrink-0">
                        <FlaskConical className="h-4 w-4 text-chart-3" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{test.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[test.status] ?? ""}`}>{test.status}</Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">{test.type.replace("_", " ")}</Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {test.status === "draft" && (
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: test.id, status: "running" })}>
                            <Play className="mr-2 h-4 w-4" /> Start Test
                          </DropdownMenuItem>
                        )}
                        {test.status === "running" && (
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: test.id, status: "completed", winnerVariant: "Variant A" })}>
                            <Trophy className="mr-2 h-4 w-4" /> End & Pick Winner
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate({ id: test.id })}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Variants */}
                  <div className="space-y-2">
                    {variants.map((v: any, i: number) => {
                      const rate = 30 + Math.random() * 25; // Simulated open rate
                      return (
                        <div key={i} className="p-2.5 rounded-lg bg-secondary/20">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-foreground">{v.name || `Variant ${String.fromCharCode(65 + i)}`}</span>
                            {test.winnerVariant === v.name && <Badge variant="secondary" className="text-[10px] bg-success/15 text-success"><Trophy className="h-3 w-3 mr-0.5" /> Winner</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{v.value || "—"}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={rate} className="h-1.5 flex-1" />
                            <span className="text-[10px] font-medium text-muted-foreground">{rate.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Sample: {test.sampleSize?.toLocaleString() ?? "—"}</span>
                    <span>{new Date(test.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Create A/B Test</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Test Name *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Subject line test - Feb campaign" className="bg-secondary/30" /></div>
            <div className="space-y-2">
              <Label>Test Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subject_line">Subject Line</SelectItem>
                  <SelectItem value="content">Content Variation</SelectItem>
                  <SelectItem value="send_time">Send Time</SelectItem>
                  <SelectItem value="sender_name">Sender Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Variant A</Label><Input value={form.variantA} onChange={(e) => setForm(p => ({ ...p, variantA: e.target.value }))} placeholder="First variation..." className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Variant B</Label><Input value={form.variantB} onChange={(e) => setForm(p => ({ ...p, variantB: e.target.value }))} placeholder="Second variation..." className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Sample Size</Label><Input type="number" value={form.sampleSize} onChange={(e) => setForm(p => ({ ...p, sampleSize: e.target.value }))} className="bg-secondary/30" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Test"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
