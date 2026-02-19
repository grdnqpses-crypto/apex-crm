import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, Building2, Globe, UserPlus, Clock, MapPin } from "lucide-react";

export default function VisitorTracking() {
  const sessions = trpc.visitorTracking.list.useQuery();
  const convert = trpc.visitorTracking.convertToProspect.useMutation({ onSuccess: () => { sessions.refetch(); toast.success("Converted to prospect"); } });

  const identified = sessions.data?.filter((s: any) => s.identifiedCompany) || [];
  const anonymous = sessions.data?.filter((s: any) => !s.identifiedCompany) || [];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Visitor Tracking</h1><p className="text-muted-foreground">Identify anonymous website visitors — reveal companies, track behavior, convert to prospects</p></div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Visitors", value: sessions.data?.length || 0, icon: Eye, color: "text-blue-400" },
          { label: "Identified", value: identified.length, icon: Building2, color: "text-green-400" },
          { label: "Anonymous", value: anonymous.length, icon: Globe, color: "text-gray-400" },
          { label: "Converted", value: sessions.data?.filter((s: any) => s.convertedToProspect).length || 0, icon: UserPlus, color: "text-purple-400" },
        ].map(s => (
          <Card key={s.label} className="border-border/50"><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
            <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
          </CardContent></Card>
        ))}
      </div>

      {identified.length > 0 && <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Building2 className="w-5 h-5" />Identified Companies</h3>
        <div className="space-y-3">
          {identified.map((s: any) => (
            <Card key={s.id} className="border-border/50 border-l-4 border-l-green-500 hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-green-400" /></div>
                  <div>
                    <div className="flex items-center gap-2"><span className="font-semibold">{s.identifiedCompany}</span>{s.identifiedIndustry && <Badge variant="outline">{s.identifiedIndustry}</Badge>}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {s.identifiedDomain && <span><Globe className="w-3 h-3 inline mr-1" />{s.identifiedDomain}</span>}
                      <span><Clock className="w-3 h-3 inline mr-1" />{s.pageViews || 0} pages · {Math.round((s.duration || 0) / 60)}min</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => convert.mutate({ id: s.id })} disabled={s.convertedToProspect || convert.isPending}>
                  <UserPlus className="w-4 h-4 mr-1" />{s.convertedToProspect ? "Converted" : "Convert"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>}

      {anonymous.length > 0 && <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Eye className="w-5 h-5" />Anonymous Visitors</h3>
        <div className="space-y-2">
          {anonymous.slice(0, 20).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <div className="flex items-center gap-3 text-sm">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span>{s.ipAddress || "Unknown IP"}</span>
                <span className="text-muted-foreground">{s.pageViews || 0} pages</span>
                {s.referrer && <span className="text-muted-foreground">from {s.referrer}</span>}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(Number(s.firstSeen)).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>}

      {(!sessions.data || sessions.data.length === 0) && (
        <Card className="border-dashed"><CardContent className="p-12 text-center"><Eye className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" /><h3 className="text-lg font-medium">No visitors tracked yet</h3><p className="text-sm text-muted-foreground mt-1">Install the tracking pixel to start identifying website visitors</p></CardContent></Card>
      )}
    </div>
  );
}
