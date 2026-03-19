import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Database, Search, UserPlus, Building2, Mail, Phone, Globe,
  MapPin, ChevronLeft, ChevronRight, SlidersHorizontal,
  CheckCircle2, Loader2, Users, TrendingUp, Filter
} from "lucide-react";

const US_STATES = [
  "All States","Alabama","Alaska","Arizona","Arkansas","California","Colorado",
  "Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois",
  "Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana",
  "Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York",
  "North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah",
  "Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

const INDUSTRIES = [
  "All Industries","Logistics / Freight","Manufacturing","Technology","Healthcare",
  "Construction","Retail / E-commerce","Financial Services","Real Estate",
  "Food & Beverage","Automotive","Energy / Oil & Gas","Agriculture",
  "Professional Services","Government / Public Sector",
];

const COMPANY_SIZES = [
  "Any Size","1-10 (Startup)","11-50 (Small)","51-200 (Mid-Market)",
  "201-500 (Growth)","501-1000 (Enterprise)","1000+ (Large Enterprise)",
];

const RESULT_COUNTS = [5, 10, 15, 20, 25, 50];
const PAGE_SIZES = [5, 10, 20, 25];

export default function B2BDatabase() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("All States");
  const [industry, setIndustry] = useState("All Industries");
  const [companySize, setCompanySize] = useState("Any Size");
  const [resultCount, setResultCount] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [importingIds, setImportingIds] = useState<Set<number>>(new Set());

  const searchMutation = trpc.b2bDatabase.search.useMutation({
    onSuccess: (data) => {
      setContacts(data || []);
      setPage(1);
      if (!data || data.length === 0) {
        toast.info("No results found. Try different search terms.");
      } else {
        toast.success(`Found ${data.length} contacts`);
      }
    },
    onError: (err) => toast.error(err.message || "Search failed"),
  });

  const importMutation = trpc.b2bDatabase.importToContacts.useMutation({
    onSuccess: (_, variables) => {
      setContacts(prev => prev.map(c => c.id === variables.id ? { ...c, imported: true } : c));
      toast.success("Contact imported to CRM");
      setImportingIds(prev => { const s = new Set(prev); s.delete(variables.id); return s; });
    },
    onError: (err, variables) => {
      toast.error(err.message || "Import failed");
      setImportingIds(prev => { const s = new Set(prev); s.delete(variables.id); return s; });
    },
  });

  const handleSearch = () => {
    if (query.trim().length < 2) { toast.error("Enter at least 2 characters to search"); return; }
    searchMutation.mutate({
      query: query.trim(),
      state: state !== "All States" ? state : undefined,
      industry: industry !== "All Industries" ? industry : undefined,
      companySize: companySize !== "Any Size" ? companySize : undefined,
      limit: resultCount,
    });
  };

  const handleImport = (id: number) => {
    setImportingIds(prev => new Set(prev).add(id));
    importMutation.mutate({ id });
  };

  const totalPages = Math.ceil(contacts.length / pageSize);
  const paginatedContacts = contacts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" /> B2B Contact Database
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered search — find decision-makers, enrich data, and import directly to your CRM
          </p>
        </div>
        {contacts.length > 0 && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {contacts.length} results · {contacts.filter(c => c.imported).length} imported
          </Badge>
        )}
      </div>

      {/* Search Bar */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search by company name, job title, industry, keyword..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(f => !f)}
              className={showFilters ? "border-primary text-primary" : ""}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters {showFilters ? "▲" : "▼"}
            </Button>
            <Button onClick={handleSearch} disabled={searchMutation.isPending} className="min-w-[110px]">
              {searchMutation.isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Searching...</>
                : <><Search className="h-4 w-4 mr-2" /> Search</>}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border/40">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">State / Region</label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Industry</label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company Size</label>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Results to Fetch</label>
                <Select value={String(resultCount)} onValueChange={v => setResultCount(Number(v))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESULT_COUNTS.map(n => <SelectItem key={n} value={String(n)}>{n} results</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {contacts.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, contacts.length)} of {contacts.length}
              </span>
              <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map(n => <SelectItem key={n} value={String(n)}>{n} per page</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {paginatedContacts.map((c: any) => (
              <Card key={c.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{c.firstName} {c.lastName}</span>
                          {c.imported && (
                            <Badge className="bg-green-500/15 text-green-600 border-green-500/20 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Imported
                            </Badge>
                          )}
                          {c.confidence >= 80 && (
                            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-500">
                              {c.confidence}% match
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                          {c.jobTitle && <span className="font-medium text-foreground/70">{c.jobTitle}</span>}
                          {c.companyName && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {c.companyName}</span>}
                          {c.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location}</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                          {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>}
                          {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>}
                          {c.companyDomain && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {c.companyDomain}</span>}
                          {c.industry && <Badge variant="secondary" className="text-xs">{c.industry}</Badge>}
                          {c.companySize && <Badge variant="outline" className="text-xs">{c.companySize}</Badge>}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={c.imported ? "secondary" : "outline"}
                      size="sm"
                      className="shrink-0"
                      onClick={() => !c.imported && handleImport(c.id)}
                      disabled={c.imported || importingIds.has(c.id)}
                    >
                      {importingIds.has(c.id)
                        ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Importing...</>
                        : c.imported
                          ? <><CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" /> Imported</>
                          : <><UserPlus className="w-4 h-4 mr-1.5" /> Import to CRM</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                return (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="w-9" onClick={() => setPage(p)}>
                    {p}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {contacts.length === 0 && !searchMutation.isPending && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Database className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">Search the B2B Database</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Enter a company name, job title, industry, or keyword to find decision-makers.
              Use the <strong>Filters</strong> button to narrow by state, industry, and company size.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs text-muted-foreground">
              <div className="rounded-lg bg-muted/50 p-3">
                <Search className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="font-medium">Smart Search</div>
                <div>AI-powered results</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <Filter className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="font-medium">Filter by Area</div>
                <div>State &amp; industry</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <UserPlus className="h-4 w-4 mx-auto mb-1 text-primary" />
                <div className="font-medium">One-Click Import</div>
                <div>Straight to CRM</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {searchMutation.isPending && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold">Searching database...</h3>
            <p className="text-sm text-muted-foreground mt-1">AI is finding the best matches for your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
