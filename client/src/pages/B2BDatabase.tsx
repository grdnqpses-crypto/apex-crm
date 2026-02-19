import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Database, Search, Download, UserPlus, Building2, Globe } from "lucide-react";

export default function B2BDatabase() {
  const [query, setQuery] = useState("");
  const searchMutation = trpc.b2bDatabase.search.useMutation();
  const [contacts, setContacts] = useState<any[]>([]);
  const handleSearch = () => { if (query.length > 2) searchMutation.mutate({ query }, { onSuccess: (data) => setContacts(data || []) }); };
  const importContact = trpc.b2bDatabase.importToContacts.useMutation({ onSuccess: () => { toast.success("Contact imported to CRM"); } });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">B2B Contact Database</h1><p className="text-muted-foreground">AI-powered contact and company search — find decision-makers, enrich data, import to CRM</p></div>

      <Card className="border-border/50"><CardContent className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-10" placeholder="Search companies, titles, industries..." value={query} onChange={e => setQuery(e.target.value)} /></div>
          <Button onClick={handleSearch} disabled={searchMutation.isPending}>{searchMutation.isPending ? "Searching..." : "Search"}</Button>
        </div>
      </CardContent></Card>

      {contacts.length > 0 && (
        <div className="space-y-3">
          {contacts.map((c: any) => (
            <Card key={c.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                  <div>
                    <div className="flex items-center gap-2"><span className="font-semibold">{c.firstName} {c.lastName}</span>{c.imported && <Badge className="bg-green-500/20 text-green-400">Imported</Badge>}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {c.jobTitle && <span>{c.jobTitle}</span>}
                      {c.companyName && <span>@ {c.companyName}</span>}
                      {c.email && <span>{c.email}</span>}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => importContact.mutate({ id: c.id })} disabled={c.imported || importContact.isPending}>
                  <UserPlus className="w-4 h-4 mr-1" />{c.imported ? "Imported" : "Import"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {query.length > 2 && contacts.length === 0 && !searchMutation.isPending && (
        <Card className="border-dashed"><CardContent className="p-12 text-center"><Database className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" /><h3 className="text-lg font-medium">No results found</h3><p className="text-sm text-muted-foreground mt-1">Try different search terms or use AI enrichment to find contacts</p></CardContent></Card>
      )}

      {query.length <= 2 && (
        <Card className="border-dashed"><CardContent className="p-12 text-center"><Database className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" /><h3 className="text-lg font-medium">Search the B2B Database</h3><p className="text-sm text-muted-foreground mt-1">Enter at least 3 characters to search for companies, contacts, and decision-makers</p></CardContent></Card>
      )}
    </div>
  );
}
