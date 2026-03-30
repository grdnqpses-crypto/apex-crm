import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Eye, Code, Settings, GripVertical, FileText, CheckCircle } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

type FieldType = "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "date" | "number";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
];

export default function WebFormsBuilder() {
  const { t } = useSkin();
  const [showGuide, setShowGuide] = useState(false);
  const utils = trpc.useUtils();

  const { data: forms, isLoading } = trpc.webForms.list.useQuery();

  const createMutation = trpc.webForms.create.useMutation({
    onSuccess: () => {
      utils.webForms.list.invalidate();
      setCreateOpen(false);
      resetForm();
      toast.success("Form created", { description: "Your web form is ready to embed." });
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const deleteMutation = trpc.webForms.delete.useMutation({
    onSuccess: () => {
      utils.webForms.list.invalidate();
      toast.success("Form deleted");
    },
  });

  const toggleMutation = trpc.webForms.update.useMutation({
    onSuccess: () => utils.webForms.list.invalidate(),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<{ id: number; name: string; embedCode: string | null } | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [fields, setFields] = useState<FormField[]>([
    { id: "1", type: "text", label: "Full Name", required: true },
    { id: "2", type: "email", label: "Email Address", required: true },
    { id: "3", type: "phone", label: "Phone Number", required: false },
  ]);
  const [activeTab, setActiveTab] = useState("builder");

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFields([
      { id: "1", type: "text", label: "Full Name", required: true },
      { id: "2", type: "email", label: "Email Address", required: true },
      { id: "3", type: "phone", label: "Phone Number", required: false },
    ]);
    setActiveTab("builder");
  };

  const addField = () => {
    setFields(prev => [...prev, {
      id: Date.now().toString(),
      type: "text",
      label: "New Field",
      required: false,
    }]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const handleCreate = () => {
    if (!formName.trim()) {
      toast.error("Form name required");
      return;
    }
    createMutation.mutate({
      name: formName,
      description: formDesc || undefined,
      fields,
      settings: {
        submitButtonText: "Submit",
        successMessage: "Thank you! We'll be in touch soon.",
        createContact: true,
      },
    });
  };

  const copyEmbed = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied!", { description: "Embed code copied to clipboard." });
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="bg-green-500/5 border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><FileText className="w-5 h-5 text-green-500" /> Web Forms 101</span>
            <Button size="sm" variant="ghost" onClick={() => setShowGuide(!showGuide)}>{ showGuide ? "Hide" : "Show"}</Button>
          </CardTitle>
        </CardHeader>
        {showGuide && (
          <CardContent className="space-y-3 text-sm">
            <p><strong>What are Web Forms?</strong> Embeddable forms you place on your website to capture visitor information. When someone fills it out, they automatically become a contact/lead in your CRM.</p>
            <p><strong>How to use:</strong> (1) Create a form with fields like Name, Email, Phone. (2) Copy the embed code. (3) Paste it on your website. (4) Leads auto-populate in Contacts.</p>
            <p><strong>Example:</strong> Create a "Demo Request" form with fields: Name, Email, Company, Phone. Embed on your pricing page.</p>
          </CardContent>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Web Forms Builder</h1>
          <p className="text-muted-foreground">Create embeddable forms that capture leads directly into your CRM.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Form
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{forms?.length ?? 0}</div>
            <div className="text-sm text-muted-foreground">Total Forms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{forms?.filter(f => f.isActive).length ?? 0}</div>
            <div className="text-sm text-muted-foreground">Active Forms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{forms?.reduce((s, f) => s + (f.submissionCount ?? 0), 0) ?? 0}</div>
            <div className="text-sm text-muted-foreground">Total Submissions</div>
          </CardContent>
        </Card>
      </div>

      {/* Forms list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading forms...</div>
      ) : forms?.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
            <p className="text-muted-foreground mb-4">Create your first web form to start capturing leads.</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms?.map(form => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{form.name}</CardTitle>
                    {form.description && (
                      <CardDescription className="mt-1 line-clamp-2">{form.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant={form.isActive ? "default" : "secondary"} className="ml-2 shrink-0">
                    {form.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{Array.isArray(form.fields) ? form.fields.length : 0} fields</span>
                  <span>{form.submissionCount ?? 0} submissions</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedForm({ id: form.id, name: form.name, embedCode: form.embedCode });
                      setEmbedOpen(true);
                    }}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Embed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleMutation.mutate({ id: form.id, isActive: !form.isActive })}
                  >
                    {form.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate({ id: form.id })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Web Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Form Name *</Label>
                <Input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Contact Us, Demo Request"
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="builder">Field Builder</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="space-y-3 mt-4">
                {fields.map((field, idx) => (
                  <div key={field.id} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-xs text-muted-foreground font-medium">Field {idx + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-6 w-6 p-0 text-destructive"
                        onClick={() => removeField(field.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select value={field.type} onValueChange={v => updateField(field.id, { type: v as FieldType })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input
                          className="h-8 text-xs"
                          value={field.label}
                          onChange={e => updateField(field.id, { label: e.target.value })}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex items-center gap-1 pb-1">
                          <Switch
                            checked={field.required}
                            onCheckedChange={v => updateField(field.id, { required: v })}
                            className="scale-75"
                          />
                          <Label className="text-xs">Required</Label>
                        </div>
                      </div>
                    </div>
                    {field.type === "select" && (
                      <div className="mt-2">
                        <Label className="text-xs">Options (comma-separated)</Label>
                        <Input
                          className="h-8 text-xs"
                          placeholder="Option 1, Option 2, Option 3"
                          value={field.options?.join(", ") ?? ""}
                          onChange={e => updateField(field.id, { options: e.target.value.split(",").map(o => o.trim()).filter(Boolean) })}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addField} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-lg p-6 bg-background space-y-4">
                  <h3 className="text-lg font-semibold">{formName || "Form Preview"}</h3>
                  {fields.map(field => (
                    <div key={field.id} className="space-y-1">
                      <Label className="text-sm">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {field.type === "textarea" ? (
                        <Textarea placeholder={field.placeholder || field.label} rows={3} disabled />
                      ) : field.type === "select" ? (
                        <Select disabled>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${field.label}`} />
                          </SelectTrigger>
                        </Select>
                      ) : field.type === "checkbox" ? (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled />
                          <span className="text-sm">{field.label}</span>
                        </div>
                      ) : (
                        <Input type={field.type} placeholder={field.placeholder || field.label} disabled />
                      )}
                    </div>
                  ))}
                  <Button className="w-full" disabled>Submit</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embed Code Dialog */}
      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Embed: {selectedForm?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy this code and paste it into your website's HTML where you want the form to appear.
            </p>
            <div className="bg-muted rounded-lg p-4 font-mono text-xs break-all">
              {selectedForm?.embedCode ?? `<script src="https://app.axiomcrm.com/forms/embed.js" data-form-id="${selectedForm?.id}"></script>`}
            </div>
            <Button
              className="w-full"
              onClick={() => copyEmbed(selectedForm?.embedCode ?? `<script src="https://app.axiomcrm.com/forms/embed.js" data-form-id="${selectedForm?.id}"></script>`)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Embed Code
            </Button>
            <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-green-500" />
                What happens when someone submits
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                <li>• Contact is automatically created in your CRM</li>
                <li>• You receive a real-time notification</li>
                <li>• Submission is logged in the form analytics</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
