import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Database, Trash2, Edit, Layers, ChevronRight } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Checkbox" },
  { value: "select", label: "Dropdown" },
  { value: "multi_select", label: "Multi-Select" },
  { value: "url", label: "URL" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "currency", label: "Currency" },
  { value: "textarea", label: "Long Text" },
];

export default function CustomObjects() {
  const { t } = useSkin();
  const [showCreate, setShowCreate] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", pluralName: "", description: "", icon: "📦", color: "#6366f1" });
  const [fieldForm, setFieldForm] = useState({ name: "", fieldType: "text", isRequired: false, options: "" });

  const { data: objectTypes = [], refetch } = trpc.customObjects.listTypes.useQuery();
  const { data: fields = [] } = trpc.customObjects.listFields.useQuery(
    { typeId: selectedObjectId! },
    { enabled: !!selectedObjectId }
  );
  const createMutation = trpc.customObjects.createType.useMutation();
  const deleteMutation = trpc.customObjects.deleteType.useMutation();
  const addFieldMutation = trpc.customObjects.addField.useMutation();
  const deleteFieldMutation = trpc.customObjects.deleteField.useMutation();

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createMutation.mutateAsync(form);
      toast.success(`"${form.name}" object type created`);
      setShowCreate(false);
      setForm({ name: "", pluralName: "", description: "", icon: "📦", color: "#6366f1" });
      refetch();
    } catch { toast.error("Create failed"); }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success(`"${name}" deleted`);
      if (selectedObjectId === id) setSelectedObjectId(null);
      refetch();
    } catch { toast.error("Delete failed"); }
  };

  const handleAddField = async () => {
    if (!fieldForm.name.trim() || !selectedObjectId) return;
    try {
      await addFieldMutation.mutateAsync({
        typeId: selectedObjectId,
        name: fieldForm.name,
        fieldType: fieldForm.fieldType as "text" | "number" | "date" | "boolean" | "select" | "url" | "email",
        required: fieldForm.isRequired,
      });
      toast.success("Field added");
      setShowAddField(false);
      setFieldForm({ name: "", fieldType: "text", isRequired: false, options: "" });
    } catch { toast.error("Add field failed"); }
  };

  const selectedType = objectTypes.find(t => t.id === selectedObjectId);
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* For Dummies Guide */}
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Database className="w-5 h-5 text-blue-500" /> Custom Objects 101</span>
              <Button size="sm" variant="ghost" onClick={() => setShowGuide(!showGuide)}>{ showGuide ? "Hide" : "Show"}</Button>
            </CardTitle>
          </CardHeader>
          {showGuide && (
            <CardContent className="space-y-3 text-sm">
              <p><strong>What are Custom Objects?</strong> Think of them as custom database tables. Instead of storing data in Contacts or Companies, you can create your own object types (e.g., "Projects", "Subscriptions", "Assets") with custom fields.</p>
              <p><strong>How to use:</strong> (1) Click "New Object Type" to define a new object (e.g., "Project"). (2) Add fields like "Project Name", "Budget", "Status". (3) Use these objects in workflows, reports, and automations.</p>
              <p><strong>Example:</strong> Create a "Service Ticket" object with fields: Ticket ID, Customer, Issue Description, Priority, Status, Resolution Date.</p>
            </CardContent>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Custom Objects</h1>
            <p className="text-muted-foreground mt-1">Create custom data structures beyond contacts, companies, and deals</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />New Object Type
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Object Types List */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Object Types</h2>
            {objectTypes.map(type => (
              <Card key={type.id}
                className={`cursor-pointer hover:shadow-md transition-all ${selectedObjectId === type.id ? "border-primary ring-1 ring-primary" : ""}`}
                onClick={() => setSelectedObjectId(type.id)}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{type.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">{type.name}</div>
                        <div className="text-xs text-muted-foreground">{type.pluralName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {objectTypes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No custom objects yet</p>
              </div>
            )}
          </div>

          {/* Fields Panel */}
          <div className="lg:col-span-2">
            {selectedType ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedType.icon}</span>
                    <div>
                      <h2 className="font-bold text-lg">{selectedType.name}</h2>
                      {selectedType.description && <p className="text-sm text-muted-foreground">{selectedType.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAddField(true)}>
                      <Plus className="h-3 w-3 mr-1" />Add Field
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(selectedType.id, selectedType.name)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Built-in fields */}
                  {["Name", "Created At", "Updated At", "Owner"].map(f => (
                    <div key={f} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{f}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">Built-in</Badge>
                    </div>
                  ))}
                  {/* Custom fields */}
                  {fields.map(field => (
                    <div key={field.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{field.name}</span>
                        {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs capitalize">{field.fieldType.replace("_", " ")}</Badge>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive"
                          onClick={() => deleteFieldMutation.mutate({ typeId: selectedObjectId!, fieldId: field.id })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p className="text-sm">No custom fields yet</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowAddField(true)}>
                        <Plus className="h-3 w-3 mr-1" />Add First Field
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                <Database className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">Select an object type</p>
                <p className="text-sm mt-1">Or create a new one to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Object Type Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Custom Object Type</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Singular Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Project" className="mt-1" />
              </div>
              <div>
                <Label>Plural Name</Label>
                <Input value={form.pluralName} onChange={e => setForm(f => ({ ...f, pluralName: e.target.value }))} placeholder="e.g. Projects" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this object for?" className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Icon (emoji)</Label>
                <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="📦" className="mt-1" />
              </div>
              <div>
                <Label>Color</Label>
                <Input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="mt-1 h-10" />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim() || createMutation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Field Dialog */}
      <Dialog open={showAddField} onOpenChange={setShowAddField}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Field to {selectedType?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Field Name</Label>
              <Input value={fieldForm.name} onChange={e => setFieldForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Budget" className="mt-1" />
            </div>
            <div>
              <Label>Field Type</Label>
              <Select value={fieldForm.fieldType} onValueChange={v => setFieldForm(f => ({ ...f, fieldType: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(fieldForm.fieldType === "select" || fieldForm.fieldType === "multi_select") && (
              <div>
                <Label>Options <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                <Input value={fieldForm.options} onChange={e => setFieldForm(f => ({ ...f, options: e.target.value }))} placeholder="Option 1, Option 2, Option 3" className="mt-1" />
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddField(false)}>Cancel</Button>
            <Button onClick={handleAddField} disabled={!fieldForm.name.trim() || addFieldMutation.isPending}>Add Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  
    </>);
}
