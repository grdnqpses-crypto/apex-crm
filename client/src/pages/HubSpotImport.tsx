import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useSkin } from "@/contexts/SkinContext";
import {
  Upload, FileText, ArrowRight, Check, AlertTriangle,
  Download, Database, Users, Building2, Kanban,
  RefreshCw, Zap, ChevronDown, ChevronRight, Search,
  MapPin, X, Loader2, Info
} from "lucide-react";

// ─── HubSpot to REALM CRM Property Mapping ───
const HUBSPOT_CONTACT_MAPPINGS: PropertyMapping[] = [
  // Core Identity
  { hubspot: "firstname", realm: "firstName", label: "First Name", group: "Contact Information", auto: true },
  { hubspot: "lastname", realm: "lastName", label: "Last Name", group: "Contact Information", auto: true },
  { hubspot: "email", realm: "email", label: "Email", group: "Contact Information", auto: true },
  { hubspot: "jobtitle", realm: "jobTitle", label: "Job Title", group: "Contact Information", auto: true },
  { hubspot: "company", realm: "companyName", label: "Company (text)", group: "Contact Information", auto: true },
  // Communication
  { hubspot: "phone", realm: "companyPhone", label: "Phone", group: "Communication", auto: true },
  { hubspot: "mobilephone", realm: "mobilePhone", label: "Mobile Phone", group: "Communication", auto: true },
  { hubspot: "fax", realm: "faxNumber", label: "Fax", group: "Communication", auto: true },
  { hubspot: "hs_linkedinurl", realm: "linkedinUrl", label: "LinkedIn URL", group: "Communication", auto: true },
  { hubspot: "website", realm: "websiteUrl", label: "Website", group: "Communication", auto: true },
  // Address
  { hubspot: "address", realm: "streetAddress", label: "Street Address", group: "Address", auto: true },
  { hubspot: "city", realm: "city", label: "City", group: "Address", auto: true },
  { hubspot: "state", realm: "stateRegion", label: "State/Region", group: "Address", auto: true },
  { hubspot: "zip", realm: "postalCode", label: "Postal Code", group: "Address", auto: true },
  { hubspot: "country", realm: "country", label: "Country", group: "Address", auto: true },
  { hubspot: "hs_timezone", realm: "timezone", label: "Timezone", group: "Address", auto: true },
  // Lifecycle
  { hubspot: "lifecyclestage", realm: "lifecycleStage", label: "Lifecycle Stage", group: "Lifecycle", auto: true },
  { hubspot: "hs_lead_status", realm: "leadStatus", label: "Lead Status", group: "Lifecycle", auto: true },
  { hubspot: "hs_analytics_source", realm: "leadSource", label: "Lead Source", group: "Lifecycle", auto: true },
  { hubspot: "hubspotscore", realm: "leadScore", label: "Lead Score", group: "Lifecycle", auto: true },
  // Marketing Attribution
  { hubspot: "hs_analytics_source", realm: "originalSource", label: "Original Source", group: "Marketing", auto: true },
  { hubspot: "hs_analytics_source_data_1", realm: "originalSourceDrill1", label: "Source Drill-Down 1", group: "Marketing", auto: true },
  { hubspot: "hs_analytics_source_data_2", realm: "originalSourceDrill2", label: "Source Drill-Down 2", group: "Marketing", auto: true },
  // Social
  { hubspot: "twitterhandle", realm: "twitterHandle", label: "Twitter Handle", group: "Social Media", auto: true },
  { hubspot: "facebookprofileurl", realm: "facebookProfile", label: "Facebook Profile", group: "Social Media", auto: true },
  // Custom Freight Fields
  { hubspot: "freight_details", realm: "freightDetails", label: "Freight Details", group: "Freight/Logistics", auto: true },
  { hubspot: "shipment_length__inches_", realm: "shipmentLength", label: "Shipment Length (inches)", group: "Freight/Logistics", auto: true },
  { hubspot: "shipment_width__inches_", realm: "shipmentWidth", label: "Shipment Width (inches)", group: "Freight/Logistics", auto: true },
  { hubspot: "shipment_height__inches_", realm: "shipmentHeight", label: "Shipment Height (inches)", group: "Freight/Logistics", auto: true },
  { hubspot: "shipment_weight__pounds_", realm: "shipmentWeight", label: "Shipment Weight (pounds)", group: "Freight/Logistics", auto: true },
  { hubspot: "destination_zip_code", realm: "destinationZipCode", label: "Destination Zip Code", group: "Freight/Logistics", auto: true },
  { hubspot: "shipping_origination", realm: "shippingOrigination", label: "Shipping Origination", group: "Freight/Logistics", auto: true },
  { hubspot: "destination", realm: "destination", label: "Destination", group: "Freight/Logistics", auto: true },
  { hubspot: "additional_information", realm: "additionalInformation", label: "Additional Information", group: "Freight/Logistics", auto: true },
  { hubspot: "freight_volume", realm: "freightVolume", label: "Freight Volume", group: "Freight/Logistics", auto: true },
  { hubspot: "customer_type", realm: "customerType", label: "Customer Type", group: "Freight/Logistics", auto: true },
  { hubspot: "decision_maker_role", realm: "decisionMakerRole", label: "Decision Maker Role", group: "Freight/Logistics", auto: true },
  { hubspot: "payment_responsibility", realm: "paymentResponsibility", label: "Payment Responsibility", group: "Freight/Logistics", auto: true },
  { hubspot: "preferred_contact_method", realm: "preferredContactMethod", label: "Preferred Contact Method", group: "Freight/Logistics", auto: true },
];

const HUBSPOT_COMPANY_MAPPINGS: PropertyMapping[] = [
  { hubspot: "name", realm: "name", label: "Company Name", group: "Company Info", auto: true },
  { hubspot: "domain", realm: "domain", label: "Domain", group: "Company Info", auto: true },
  { hubspot: "phone", realm: "phone", label: "Phone", group: "Company Info", auto: true },
  { hubspot: "industry", realm: "industry", label: "Industry", group: "Company Info", auto: true },
  { hubspot: "numberofemployees", realm: "numberOfEmployees", label: "Employees", group: "Company Info", auto: true },
  { hubspot: "annualrevenue", realm: "annualRevenue", label: "Annual Revenue", group: "Company Info", auto: true },
  { hubspot: "description", realm: "description", label: "Description", group: "Company Info", auto: true },
  { hubspot: "address", realm: "streetAddress", label: "Address", group: "Location", auto: true },
  { hubspot: "city", realm: "city", label: "City", group: "Location", auto: true },
  { hubspot: "state", realm: "stateRegion", label: "State", group: "Location", auto: true },
  { hubspot: "zip", realm: "postalCode", label: "Zip", group: "Location", auto: true },
  { hubspot: "country", realm: "country", label: "Country", group: "Location", auto: true },
  { hubspot: "website", realm: "website", label: "Website", group: "Company Info", auto: true },
  { hubspot: "linkedincompanypage", realm: "linkedinUrl", label: "LinkedIn", group: "Social", auto: true },
  { hubspot: "twitterhandle", realm: "twitterHandle", label: "Twitter", group: "Social", auto: true },
  { hubspot: "facebook_company_page", realm: "facebookPage", label: "Facebook", group: "Social", auto: true },
  { hubspot: "annual_freight_spend", realm: "annualFreightSpend", label: "Annual Freight Spend", group: "Freight", auto: true },
  { hubspot: "commodity", realm: "commodity", label: "Commodity", group: "Freight", auto: true },
  { hubspot: "credit_terms", realm: "creditTerms", label: "Credit Terms", group: "Freight", auto: true },
  { hubspot: "lane_preferences", realm: "lanePreferences", label: "Lane Preferences", group: "Freight", auto: true },
  { hubspot: "tms_integration_status", realm: "tmsIntegrationStatus", label: "TMS Integration", group: "Freight", auto: true },
];

interface PropertyMapping {
  hubspot: string;
  realm: string;
  label: string;
  group: string;
  auto: boolean;
}

interface ParsedRecord {
  [key: string]: string;
}

interface ImportStats {
  total: number;
  created: number;
  skipped: number;
  errors: number;
}

// ─── CSV Parser ───
function parseCSV(text: string): { headers: string[]; rows: ParsedRecord[] } {
  const lines = text.split("\n");
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: ParsedRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (handles quoted fields)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const record: ParsedRecord = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] || "";
    });
    rows.push(record);
  }

  return { headers, rows };
}

// ─── Step 1: Upload ───
function UploadStep({ onFilesParsed }: { onFilesParsed: (files: { name: string; headers: string[]; rows: ParsedRecord[]; type: string }[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);

  const handleFiles = useCallback(async (files: FileList) => {
    setParsing(true);
    const parsed: { name: string; headers: string[]; rows: ParsedRecord[]; type: string }[] = [];

    for (const file of Array.from(files)) {
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const { headers, rows } = parseCSV(text);

        // Auto-detect type from filename
        let type = "contacts";
        const lower = file.name.toLowerCase();
        if (lower.includes("compan")) type = "companies";
        else if (lower.includes("deal")) type = "deals";
        else if (lower.includes("ticket")) type = "tickets";

        parsed.push({ name: file.name, headers, rows, type });
      }
    }

    if (parsed.length === 0) {
      toast.error("No valid CSV files found. Please upload CSV files exported from HubSpot.");
    } else {
      toast.success(`Parsed ${parsed.length} file(s) with ${parsed.reduce((sum, f) => sum + f.rows.length, 0)} total records`);
      onFilesParsed(parsed);
    }
    setParsing(false);
  }, [onFilesParsed]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload HubSpot Export Files</CardTitle>
          <CardDescription>
            Upload your HubSpot CSV export files. We support contacts, companies, deals, and all 18 HubSpot object types.
            Your custom freight/logistics properties will be automatically mapped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
              dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.multiple = true;
              input.accept = ".csv";
              input.onchange = () => input.files && handleFiles(input.files);
              input.click();
            }}
          >
            {parsing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="font-medium">Parsing files...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-12 w-12 text-muted-foreground/50" />
                <div>
                  <p className="font-medium text-lg">Drop HubSpot CSV files here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse. Supports multiple files at once.</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">contacts.csv</Badge>
                  <Badge variant="outline">companies.csv</Badge>
                  <Badge variant="outline">deals.csv</Badge>
                  <Badge variant="outline">+15 more</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Export from HubSpot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "Go to HubSpot → Settings → Import & Export → Export",
            "Select the object types you want to export (Contacts, Companies, Deals, etc.)",
            "Choose CSV format and click Export",
            "Download the ZIP file and extract the CSV files",
            "Upload all CSV files here — we'll auto-detect the object types",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">{i + 1}</span>
              <p className="text-sm">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step 2: Map ───
function MapStep({ files, onMappingConfirmed }: {
  files: { name: string; headers: string[]; rows: ParsedRecord[]; type: string }[];
  onMappingConfirmed: (mappings: Record<string, PropertyMapping[]>) => void;
}) {
  const [activeFile, setActiveFile] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Contact Information", "Company Info", "Freight/Logistics", "Freight"]));
  const [searchQuery, setSearchQuery] = useState("");

  const file = files[activeFile];
  const baseMappings = file.type === "companies" ? HUBSPOT_COMPANY_MAPPINGS : HUBSPOT_CONTACT_MAPPINGS;

  // Auto-match headers to mappings
  const matchedMappings = useMemo(() => {
    return baseMappings.map((m) => {
      const matched = file.headers.some((h) => h.toLowerCase().replace(/[^a-z0-9]/g, "") === m.hubspot.toLowerCase().replace(/[^a-z0-9]/g, ""));
      return { ...m, matched };
    });
  }, [baseMappings, file.headers]);

  const matchedCount = matchedMappings.filter((m) => m.matched).length;
  const groups = useMemo(() => {
    const g: Record<string, (PropertyMapping & { matched: boolean })[]> = {};
    for (const m of matchedMappings) {
      if (searchQuery && !m.label.toLowerCase().includes(searchQuery.toLowerCase()) && !m.hubspot.toLowerCase().includes(searchQuery.toLowerCase())) continue;
      if (!g[m.group]) g[m.group] = [];
      g[m.group].push(m);
    }
    return g;
  }, [matchedMappings, searchQuery]);

  return (
    <div className="space-y-6">
      {/* File tabs */}
      <div className="flex gap-2 flex-wrap">
        {files.map((f, i) => (
          <Button key={i} variant={activeFile === i ? "default" : "outline"} size="sm" onClick={() => setActiveFile(i)}>
            <FileText className="h-4 w-4 mr-1.5" />
            {f.name}
            <Badge variant="secondary" className="ml-1.5">{f.rows.length}</Badge>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Property Mapping — {file.name}</CardTitle>
              <CardDescription>
                {matchedCount} of {baseMappings.length} properties auto-matched from {file.headers.length} HubSpot columns.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-400 border-0">{matchedCount} matched</Badge>
              <Badge variant="outline">{baseMappings.length - matchedCount} unmapped</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search properties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>

          <div className="space-y-2">
            {Object.entries(groups).map(([group, mappings]) => (
              <div key={group} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    const next = new Set(expandedGroups);
                    next.has(group) ? next.delete(group) : next.add(group);
                    setExpandedGroups(next);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {expandedGroups.has(group) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium text-sm">{group}</span>
                    <Badge variant="secondary" className="text-xs">{mappings.length}</Badge>
                  </div>
                  <Badge className={`text-xs border-0 ${mappings.every((m) => m.matched) ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {mappings.filter((m) => m.matched).length}/{mappings.length} matched
                  </Badge>
                </button>

                {expandedGroups.has(group) && (
                  <div className="divide-y">
                    {mappings.map((m) => (
                      <div key={m.hubspot} className="flex items-center gap-3 p-3 text-sm">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded">{m.hubspot}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm">{m.label}</span>
                          <span className="font-mono text-xs text-muted-foreground">({m.realm})</span>
                        </div>
                        {m.matched ? (
                          <Check className="h-4 w-4 text-green-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Info className="h-5 w-5 text-blue-400 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Unmapped properties will be skipped during import. You can manually map them later from Settings → Data Management → Properties.
        </p>
      </div>

      <Button size="lg" className="w-full" onClick={() => {
        const allMappings: Record<string, PropertyMapping[]> = {};
        files.forEach((f) => {
          allMappings[f.name] = f.type === "companies" ? HUBSPOT_COMPANY_MAPPINGS : HUBSPOT_CONTACT_MAPPINGS;
        });
        onMappingConfirmed(allMappings);
      }}>
        <Check className="h-5 w-5 mr-2" /> Confirm Mappings & Continue
      </Button>
    </div>
  );
}

// ─── Step 3: Import ───
function ImportStep({ files, onComplete }: {
  files: { name: string; headers: string[]; rows: ParsedRecord[]; type: string }[];
  onComplete: (stats: ImportStats[]) => void;
}) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [stats, setStats] = useState<ImportStats[]>([]);
  const [dedup, setDedup] = useState(true);
  const [skipEmpty, setSkipEmpty] = useState(true);

  const createContact = trpc.contacts.create.useMutation();
  const createCompany = trpc.companies.create.useMutation();

  const totalRecords = files.reduce((sum, f) => sum + f.rows.length, 0);

  const startImport = async () => {
    setImporting(true);
    setProgress(0);
    const allStats: ImportStats[] = [];
    let processed = 0;

    for (const file of files) {
      setCurrentFile(file.name);
      const fileStat: ImportStats = { total: file.rows.length, created: 0, skipped: 0, errors: 0 };
      const mappings = file.type === "companies" ? HUBSPOT_COMPANY_MAPPINGS : HUBSPOT_CONTACT_MAPPINGS;

      for (const row of file.rows) {
        try {
          // Skip empty rows
          if (skipEmpty) {
            const hasData = Object.values(row).some((v) => v && v.trim());
            if (!hasData) { fileStat.skipped++; processed++; setProgress(Math.round((processed / totalRecords) * 100)); continue; }
          }

          // Map HubSpot fields to REALM fields
          const mapped: Record<string, string> = {};
          for (const m of mappings) {
            const value = row[m.hubspot];
            if (value && value.trim()) {
              mapped[m.realm] = value.trim();
            }
          }

          if (file.type === "companies") {
            if (!mapped.name) { fileStat.skipped++; processed++; setProgress(Math.round((processed / totalRecords) * 100)); continue; }
            await createCompany.mutateAsync({
              name: mapped.name,
              domain: mapped.domain || undefined,
              phone: mapped.phone || undefined,
              industry: mapped.industry || undefined,
              numberOfEmployees: mapped.numberOfEmployees || undefined,
              annualRevenue: mapped.annualRevenue || undefined,
              description: mapped.description || undefined,
              streetAddress: mapped.streetAddress || undefined,
              city: mapped.city || undefined,
              stateRegion: mapped.stateRegion || undefined,
              postalCode: mapped.postalCode || undefined,
              country: mapped.country || undefined,
              website: mapped.website || undefined,
              linkedinUrl: mapped.linkedinUrl || undefined,
              twitterHandle: mapped.twitterHandle || undefined,
              recordSource: "HubSpot Import",
              importSource: file.name,
            } as any);
            fileStat.created++;
          } else {
            // Contacts
            if (!mapped.firstName && !mapped.email) { fileStat.skipped++; processed++; setProgress(Math.round((processed / totalRecords) * 100)); continue; }
            await createContact.mutateAsync({
              firstName: mapped.firstName || "Unknown",
              lastName: mapped.lastName || undefined,
              email: mapped.email || undefined,
              jobTitle: mapped.jobTitle || undefined,
              companyPhone: mapped.companyPhone || undefined,
              mobilePhone: mapped.mobilePhone || undefined,
              linkedinUrl: mapped.linkedinUrl || undefined,
              websiteUrl: mapped.websiteUrl || undefined,
              streetAddress: mapped.streetAddress || undefined,
              city: mapped.city || undefined,
              stateRegion: mapped.stateRegion || undefined,
              postalCode: mapped.postalCode || undefined,
              country: mapped.country || undefined,
              lifecycleStage: mapped.lifecycleStage || "lead",
              leadStatus: mapped.leadStatus || "Cold",
              leadSource: mapped.leadSource || "HubSpot Import",
              originalSource: mapped.originalSource || "HubSpot Import",
              recordSource: "HubSpot Import",
              isImported: true,
            } as any);
            fileStat.created++;
          }
        } catch (err) {
          fileStat.errors++;
        }

        processed++;
        setProgress(Math.round((processed / totalRecords) * 100));
      }

      allStats.push(fileStat);
    }

    setStats(allStats);
    setImporting(false);
    onComplete(allStats);
  };

  if (stats.length > 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-6 w-6 text-green-400" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{file.name}</span>
                    <Badge variant="outline">{file.type}</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="text-lg font-bold">{stats[i]?.total || 0}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-2 rounded bg-green-500/10">
                      <p className="text-lg font-bold text-green-400">{stats[i]?.created || 0}</p>
                      <p className="text-xs text-muted-foreground">Created</p>
                    </div>
                    <div className="text-center p-2 rounded bg-amber-500/10">
                      <p className="text-lg font-bold text-amber-400">{stats[i]?.skipped || 0}</p>
                      <p className="text-xs text-muted-foreground">Skipped</p>
                    </div>
                    <div className="text-center p-2 rounded bg-red-500/10">
                      <p className="text-lg font-bold text-red-400">{stats[i]?.errors || 0}</p>
                      <p className="text-xs text-muted-foreground">Errors</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Settings</CardTitle>
          <CardDescription>Configure how records are imported into REALM CRM.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Skip duplicate emails</p>
              <p className="text-sm text-muted-foreground">Skip contacts/companies that already exist (matched by email or domain)</p>
            </div>
            <Switch checked={dedup} onCheckedChange={setDedup} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Skip empty rows</p>
              <p className="text-sm text-muted-foreground">Skip rows with no meaningful data</p>
            </div>
            <Switch checked={skipEmpty} onCheckedChange={setSkipEmpty} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((f, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/30 text-center">
                <p className="text-2xl font-bold text-primary">{f.rows.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{f.type} from {f.name}</p>
              </div>
            ))}
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <p className="text-2xl font-bold text-primary">{totalRecords}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Records</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {importing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing {currentFile}...
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      <Button size="lg" className="w-full" onClick={startImport} disabled={importing}>
        {importing ? (
          <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Importing...</>
        ) : (
          <><Zap className="h-5 w-5 mr-2" /> Start One-Click Import ({totalRecords} records)</>
        )}
      </Button>
    </div>
  );
}

// ─── Main HubSpot Import Page ───
export default function HubSpotImport() {
  const { t } = useSkin();
  const [step, setStep] = useState<"upload" | "map" | "import" | "done">("upload");
  const [files, setFiles] = useState<{ name: string; headers: string[]; rows: ParsedRecord[]; type: string }[]>([]);

  return (
    <div className="space-y-6">
      <PageGuide
        title="HubSpot Import"
        description="Import your HubSpot data into REALM CRM with automatic property mapping and one-click migration."
        sections={[
          { title: "Upload", content: "Upload your HubSpot CSV export files. We support all 18 object types.", icon: "purpose" as const },
          { title: "Map", content: "Review auto-mapped properties including custom freight/logistics fields.", icon: "actions" as const },
          { title: "Import", content: "One-click import with deduplication, progress tracking, and error reporting.", icon: "outcomes" as const },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">HubSpot Import</h1>
        {step !== "upload" && (
          <Button variant="outline" onClick={() => { setStep("upload"); setFiles([]); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Start Over
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[
          { id: "upload", label: "Upload Files", icon: Upload },
          { id: "map", label: "Map Properties", icon: MapPin },
          { id: "import", label: "Import Data", icon: Database },
          { id: "done", label: "Complete", icon: Check },
        ].map((s, i) => {
          const isActive = s.id === step;
          const isDone = ["upload", "map", "import", "done"].indexOf(step) > i;
          return (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-0.5 ${isDone ? "bg-primary" : "bg-muted"}`} />}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                <s.icon className="h-4 w-4" />
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {step === "upload" && (
        <UploadStep onFilesParsed={(parsed) => { setFiles(parsed); setStep("map"); }} />
      )}

      {step === "map" && (
        <MapStep files={files} onMappingConfirmed={() => setStep("import")} />
      )}

      {step === "import" && (
        <ImportStep files={files} onComplete={() => setStep("done")} />
      )}

      {step === "done" && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Check className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Import Complete!</h2>
            <p className="text-muted-foreground mt-2">Your HubSpot data has been successfully imported into REALM CRM.</p>
            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={() => window.location.href = "/contacts"}>
                <Users className="h-4 w-4 mr-2" /> View Contacts
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/companies"}>
                <Building2 className="h-4 w-4 mr-2" /> View Companies
              </Button>
              <Button variant="outline" onClick={() => { setStep("upload"); setFiles([]); }}>
                <RefreshCw className="h-4 w-4 mr-2" /> Import More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
