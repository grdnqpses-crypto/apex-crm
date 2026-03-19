/**
 * CustomFieldsPanel — Renders migrated custom fields for any record type.
 *
 * Queries custom field definitions and values from the DB, then renders
 * them in a grouped card layout. Supports all field types: text, number,
 * currency, date, datetime, boolean, select, multiselect, url, email,
 * phone, textarea.
 *
 * Usage:
 *   <CustomFieldsPanel objectType="contact" recordId={contactId} />
 */
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ExternalLink, Sparkles, Save, Pencil, X } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

type ObjectType = "contact" | "company" | "deal" | "lead" | "activity" | "custom_object";

interface CustomFieldsPanelProps {
  objectType: ObjectType;
  recordId: number;
  /** If true, shows an edit button to inline-edit values */
  editable?: boolean;
}

function formatValue(fieldType: string, value: {
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: number | null;
  valueJson?: unknown;
}): string {
  switch (fieldType) {
    case "boolean":
      return value.valueBoolean === true ? "Yes" : value.valueBoolean === false ? "No" : "—";
    case "date":
      return value.valueDate ? new Date(value.valueDate).toLocaleDateString() : "—";
    case "datetime":
      return value.valueDate ? new Date(value.valueDate).toLocaleString() : "—";
    case "currency":
      return value.valueNumber != null
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value.valueNumber)
        : "—";
    case "number":
      return value.valueNumber != null ? String(value.valueNumber) : "—";
    case "multiselect":
      if (Array.isArray(value.valueJson)) return (value.valueJson as string[]).join(", ");
      return value.valueText ?? "—";
    default:
      return value.valueText ?? "—";
  }
}

export default function CustomFieldsPanel({ objectType, recordId, editable = true }: CustomFieldsPanelProps) {
  const { data: fieldDefs = [] } = trpc.migration.getCustomFields.useQuery({ objectType });
  const { data: fieldValues = [], refetch } = trpc.migration.getCustomFieldValues.useQuery(
    { objectType, recordId },
    { enabled: recordId > 0 }
  );
  const utils = trpc.useUtils();

  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const setCustomFieldValue = trpc.migration.setCustomFieldValue.useMutation({
    onSuccess: () => {
      utils.migration.getCustomFieldValues.invalidate({ objectType, recordId });
      toast.success("Custom fields saved");
      setEditMode(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save"),
  });

  // Group fields by groupName
  const grouped = useMemo(() => {
    const map = new Map<string, typeof fieldDefs>();
    for (const def of fieldDefs) {
      const group = def.groupName ?? "Custom Fields";
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(def);
    }
    return map;
  }, [fieldDefs]);

  // Build a value lookup map by fieldDefId
  const valueMap = useMemo(() => {
    const m = new Map<number, typeof fieldValues[0]>();
    for (const v of fieldValues) m.set(v.fieldDefId, v);
    return m;
  }, [fieldValues]);

  if (fieldDefs.length === 0) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [fieldDefIdStr, rawValue] of Object.entries(editValues)) {
        const fieldDefId = parseInt(fieldDefIdStr);
        const def = fieldDefs.find(d => d.id === fieldDefId);
        if (!def) continue;
        await setCustomFieldValue.mutateAsync({
          objectType,
          recordId,
          fieldDefId,
          fieldType: def.fieldType,
          value: rawValue,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    const initial: Record<number, string> = {};
    for (const def of fieldDefs) {
      const val = valueMap.get(def.id);
      if (val) {
        initial[def.id] = val.valueText ?? String(val.valueNumber ?? val.valueBoolean ?? "");
      }
    }
    setEditValues(initial);
    setEditMode(true);
  };

  return (
    <Card className="rounded-2xl border-border/40 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Migrated Custom Fields
            </p>
          </div>
          {editable && !editMode && (
            <Button variant="ghost" size="sm" onClick={startEdit} className="h-7 rounded-lg text-xs gap-1.5">
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          )}
          {editMode && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditMode(false)} className="h-7 rounded-lg text-xs gap-1">
                <X className="h-3 w-3" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 rounded-lg text-xs gap-1">
                <Save className="h-3 w-3" /> {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([groupName, defs]) => (
            <div key={groupName}>
              {grouped.size > 1 && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                  {groupName}
                </p>
              )}
              <div className="grid grid-cols-1 gap-3">
                {defs.map(def => {
                  const val = valueMap.get(def.id);
                  const displayValue = val ? formatValue(def.fieldType, val) : "—";
                  const isEmpty = displayValue === "—";

                  if (editMode) {
                    return (
                      <div key={def.id} className="space-y-1">
                        <Label className="text-xs font-semibold text-foreground/80">{def.label}</Label>
                        {def.fieldType === "textarea" ? (
                          <Textarea
                            value={editValues[def.id] ?? ""}
                            onChange={e => setEditValues(p => ({ ...p, [def.id]: e.target.value }))}
                            className="rounded-xl bg-muted/30 border-border/50 text-sm min-h-[60px]"
                            placeholder={def.label}
                          />
                        ) : (
                          <Input
                            value={editValues[def.id] ?? ""}
                            onChange={e => setEditValues(p => ({ ...p, [def.id]: e.target.value }))}
                            className="rounded-xl bg-muted/30 border-border/50 text-sm h-8"
                            placeholder={def.label}
                            type={def.fieldType === "number" || def.fieldType === "currency" ? "number" : "text"}
                          />
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={def.id} className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground shrink-0 min-w-[120px]">{def.label}</span>
                      {isEmpty ? (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      ) : def.fieldType === "url" || def.fieldType === "email" ? (
                        <a
                          href={def.fieldType === "email" ? `mailto:${displayValue}` : displayValue}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 truncate max-w-[200px]"
                        >
                          {displayValue}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : def.fieldType === "boolean" ? (
                        <Badge variant="secondary" className={`text-[10px] rounded-md ${displayValue === "Yes" ? "bg-emerald-50 text-emerald-600" : "bg-muted/60 text-muted-foreground"}`}>
                          {displayValue}
                        </Badge>
                      ) : def.fieldType === "multiselect" ? (
                        <div className="flex flex-wrap gap-1 justify-end">
                          {displayValue.split(", ").map(v => (
                            <Badge key={v} variant="secondary" className="text-[10px] rounded-md bg-primary/8 text-primary">{v}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-foreground text-right truncate max-w-[200px]">{displayValue}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
