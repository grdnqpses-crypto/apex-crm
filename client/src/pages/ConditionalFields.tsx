import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GitBranch, Plus, Trash2, Info } from "lucide-react";
import { toast } from "sonner";

const OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "greater_than", label: "greater than" },
  { value: "less_than", label: "less than" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
];

const ACTIONS = [
  { value: "show", label: "Show field" },
  { value: "hide", label: "Hide field" },
  { value: "require", label: "Make required" },
];

const ACTION_STYLES: Record<string, string> = {
  show: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  hide: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  require: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function ConditionalFields() {
  const { data: conditions, isLoading } = trpc.customFieldConditions.listAll.useQuery();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fieldId: "" as string,
    conditionFieldId: "" as string,
    operator: "equals" as "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty",
    conditionValue: "",
    action: "show" as "show" | "hide" | "require",
  });

  const create = trpc.customFieldConditions.create.useMutation({
    onSuccess: () => {
      toast.success("Conditional rule created");
      utils.customFieldConditions.listAll.invalidate();
      setOpen(false);
      setForm({ fieldId: "", conditionFieldId: "", operator: "equals", conditionValue: "", action: "show" });
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.customFieldConditions.delete.useMutation({
    onSuccess: () => {
      toast.success("Rule deleted");
      utils.customFieldConditions.listAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    const fieldId = parseInt(form.fieldId);
    const conditionFieldId = parseInt(form.conditionFieldId);
    if (isNaN(fieldId) || fieldId <= 0) return toast.error("Enter a valid target field ID");
    if (isNaN(conditionFieldId) || conditionFieldId <= 0) return toast.error("Enter a valid trigger field ID");
    create.mutate({
      fieldId,
      conditionFieldId,
      operator: form.operator,
      conditionValue: form.conditionValue || undefined,
      action: form.action,
    });
  };

  return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-violet-500" />
              Conditional Field Logic
            </h1>
            <p className="text-muted-foreground mt-1">Show, hide, or require fields based on other field values</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Conditional Rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Use custom field IDs from the Custom Fields settings page. When the trigger field meets the condition, the target field will be affected.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Trigger Field ID</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 12"
                      value={form.conditionFieldId}
                      onChange={(e) => setForm((f) => ({ ...f, conditionFieldId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Target Field ID</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 15"
                      value={form.fieldId}
                      onChange={(e) => setForm((f) => ({ ...f, fieldId: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Operator</Label>
                  <Select value={form.operator} onValueChange={(v) => setForm((f) => ({ ...f, operator: v as typeof form.operator }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {!["is_empty", "is_not_empty"].includes(form.operator) && (
                  <div>
                    <Label className="text-xs">Condition Value</Label>
                    <Input
                      placeholder="Value to match"
                      value={form.conditionValue}
                      onChange={(e) => setForm((f) => ({ ...f, conditionValue: e.target.value }))}
                    />
                  </div>
                )}
                <div>
                  <Label className="text-xs">Action</Label>
                  <Select value={form.action} onValueChange={(v) => setForm((f) => ({ ...f, action: v as typeof form.action }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} disabled={create.isPending} className="w-full">
                  {create.isPending ? "Creating..." : "Create Rule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Card key={i} className="animate-pulse"><CardContent className="h-16 bg-muted/30 rounded-xl" /></Card>)}
          </div>
        ) : !conditions?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <GitBranch className="w-12 h-12 text-violet-500/30 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No conditional rules yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Create rules to dynamically show, hide, or require fields based on other field values — making your forms smarter and cleaner.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Rules ({conditions.length})</CardTitle>
              <CardDescription>These rules apply to all forms across AXIOM CRM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {conditions.map((c: { id: number; fieldId: number; conditionFieldId: number; operator: string; conditionValue?: string | null; action: string }) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3 flex-wrap text-sm">
                    <span className="font-medium text-muted-foreground">Field #{c.fieldId}</span>
                    <Badge variant="outline" className="text-xs font-mono">{c.operator}</Badge>
                    {c.conditionValue && (
                      <span className="text-muted-foreground">"{c.conditionValue}"</span>
                    )}
                    <span className="text-muted-foreground">when Field #{c.conditionFieldId}</span>
                    <Badge className={`text-xs ${ACTION_STYLES[c.action] ?? ""}`}>{c.action}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => remove.mutate({ id: c.id })}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
  );
}
