import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight, ChevronDown, Users, Link2 } from "lucide-react";

function CompanyNode({ company, depth = 0 }: { company: { id: number; name: string | null; industry?: string | null; [key: string]: unknown }; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const { data: children } = trpc.accountHierarchy.getChildren.useQuery(
    { parentId: company.id },
    { enabled: expanded }
  );

  return (
    <div className={`${depth > 0 ? "ml-6 border-l pl-4" : ""}`}>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <Building2 className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{company.name}</span>
        {company.industry && (
          <Badge variant="outline" className="text-xs ml-1">{company.industry as string}</Badge>
        )}
      </div>
      {expanded && children && children.length > 0 && (
        <div className="mt-1">
          {children.map(child => (
            <CompanyNode key={child.id} company={child} depth={depth + 1} />
          ))}
        </div>
      )}
      {expanded && children && children.length === 0 && (
        <div className="ml-10 py-1 text-xs text-muted-foreground">No subsidiaries</div>
      )}
    </div>
  );
}

export default function AccountHierarchy() {
  const { data: rootCompanies, isLoading } = trpc.accountHierarchy.getRoots.useQuery();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link2 className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Account Hierarchy</h1>
            <p className="text-muted-foreground text-sm">View parent-subsidiary relationships between companies.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Company Tree
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading hierarchy…</div>
            ) : !rootCompanies?.length ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No companies found. Add companies to see their hierarchy.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {rootCompanies.map(company => (
                  <CompanyNode key={company.id} company={company} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
