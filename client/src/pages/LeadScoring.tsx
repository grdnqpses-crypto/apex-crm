import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Star, Trash2, TrendingUp } from "lucide-react";

const FIELDS = [
  { value: "jobTitle", label: "Job Title" },
  { value: "industry", label: "Industry" },
  { value: "country", label: "Country" },
  { value: "leadSource", label: "Lead Source" },
  { value: "lifecycleStage", label: "Lifecycle Stage" },
  { value: "emailOpened", label: "Email Opened" },
  { value: "websiteVisit", label: "Website Visit" },
  { value: "formSubmitted", label: "Form Submitted" },
  { value: "dealCreated", label: "Deal Created" },
];

const OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "contains", label: "contains" },
  { value: "not_equals", label: "does not equal" },
  { value: "exists", label: "exists" },
  { value: "not_exists", label: "does not exist" },
];

export default function LeadScoring() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", field: "", operator: "equals", value: "", points: "10", entityType: "contact" });

  const utils = trpc.useUtils();
  const { data: rules, isLoading } = trpc.batch2.leadScoring.getRules.useQuery();

  const createMutation = trpc.batch2.leadScoring.createRule.useMutation({
    onSuccess: () => { utils.batch2.leadScoring.getRules.invalidate(); setDialogOpen(false); toast.success("Rule created"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const deleteMutation = trpc.batch2.leadScoring.deleteRule.useMutation({
    onSuccess: () => { utils.batch2.leadScoring.getRules.invalidate(); toast.success("Rule deleted"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.name.trim() || !form.field || !form.operator) return toast.error("Name, field, and operator are required");
    const payload = { name: form.name, field: form.field, value: form.value || undefined, operator: form.operator as "equals" | "contains" | "greater_than" | "less_than" | "is_set" | "is_not_set", entityType: form.entityType as "contact" | "company" | "deal", points: parseInt(form.points) || 10 };
    createMutation.mutate(payload);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 text-primary" />
              Lead Scoring
            </h1>
            <p className="text-muted-foreground mt-1">Define rules to automatically score leads based on their attributes and behavior</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scoring Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Scoring Rules</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded bg-muted animate-pulse" />)}
                </div>
              ) : !rules?.length ? (
                <div className="text-center py-8">
                  <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No scoring rules yet.</p>
                  <Button className="mt-3" size="sm" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Rule
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{rule.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {rule.field} {rule.operator} {rule.value ? `"${rule.value}"` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Badge variant={rule.points > 0 ? "default" : "destructive"} className="tabular-nums">
                          {rule.points > 0 ? "+" : ""}{rule.points} pts
                        </Badge>
                        <Badge variant="outline" className="text-xs">{rule.entityType}</Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate({ id: rule.id })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* How Scoring Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                How Lead Scoring Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Each rule adds or subtracts points from a contact's score when the condition matches their profile.</p>
              <p>Scores are computed automatically when contacts are created or updated.</p>
              <p>Use negative points to penalize unqualified leads (e.g., student job titles, personal email domains).</p>
              <div className="rounded-lg bg-muted p-3 mt-2">
                <p className="font-medium text-foreground mb-1">Example rules:</p>
                <ul className="space-y-1">
                  <li>Job Title <em>contains</em> "CEO" → +30 pts</li>
                  <li>Industry <em>equals</em> "SaaS" → +20 pts</li>
                  <li>Lead Source <em>equals</em> "Referral" → +15 pts</li>
                  <li>Job Title <em>contains</em> "intern" → -20 pts</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Rule Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Scoring Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rule Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. C-Suite Title" />
              </div>
              <div>
                <Label>Entity Type</Label>
                <Select value={form.entityType} onValueChange={(v) => setForm({ ...form, entityType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Field *</Label>
                <Select value={form.field} onValueChange={(v) => setForm({ ...form, field: v })}>
                  <SelectTrigger><SelectValue placeholder="Select field..." /></SelectTrigger>
                  <SelectContent>
                    {FIELDS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Operator *</Label>
                <Select value={form.operator} onValueChange={(v) => setForm({ ...form, operator: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {!["exists", "not_exists"].includes(form.operator) && (
                <div>
                  <Label>Value</Label>
                  <Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="e.g. CEO, Director" />
                </div>
              )}
              <div>
                <Label>Points (negative = penalty)</Label>
                <Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} placeholder="10" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>Add Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
