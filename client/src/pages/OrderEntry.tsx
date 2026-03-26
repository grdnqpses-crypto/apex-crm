import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Truck, Brain, CheckCircle, Clock } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

export default function OrderEntry() {
  const { t } = useSkin();
  const emails = trpc.orderEntry.list.useQuery();
  const convertToLoad = trpc.orderEntry.convertToLoad.useMutation({ onSuccess: () => { emails.refetch(); toast.success("Load created from email"); } });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">AI Order Entry</h1><p className="text-muted-foreground">Automatically parse inbound emails into load orders — AI extracts origin, destination, commodity, rate</p></div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Inbound Emails", value: emails.data?.length || 0, icon: Mail, color: "text-blue-400" },
          { label: "Parsed", value: emails.data?.filter((e: any) => e.status === "parsed").length || 0, icon: Brain, color: "text-purple-400" },
          { label: "Converted", value: emails.data?.filter((e: any) => e.convertedToLoad).length || 0, icon: Truck, color: "text-green-400" },
          { label: "Pending", value: emails.data?.filter((e: any) => e.status === "new").length || 0, icon: Clock, color: "text-yellow-400" },
        ].map(s => (
          <Card key={s.label} className="border-border/50"><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
            <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
          </CardContent></Card>
        ))}
      </div>

      <div className="space-y-3">
        {emails.data?.map((email: any) => {
          const parsed = typeof email.parsedData === "object" && email.parsedData !== null
            ? email.parsedData
            : (() => { try { return JSON.parse(String(email.parsedData || "{}")); } catch { return {}; } })();
          return (
            <Card key={email.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${email.status === "parsed" ? "bg-purple-500/10" : "bg-gray-500/10"}`}><Mail className={`w-5 h-5 ${email.status === "parsed" ? "text-purple-400" : "text-gray-400"}`} /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{email.subject || "No Subject"}</span>
                        <Badge className={email.status === "parsed" ? "bg-purple-500/20 text-purple-400" : "bg-yellow-500/20 text-yellow-400"}>{email.status}</Badge>
                        {email.convertedToLoad && <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Converted</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">From: {email.fromEmail || email.fromName || "Unknown"} · {new Date(Number(email.receivedAt)).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {email.status === "parsed" && !email.convertedToLoad && (
                    <Button size="sm" onClick={() => convertToLoad.mutate({ id: email.id })} disabled={convertToLoad.isPending}>
                      <Truck className="w-4 h-4 mr-1" />Create Load
                    </Button>
                  )}
                </div>
                {parsed?.origin && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/20 grid grid-cols-4 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Origin</p><p className="font-medium">{typeof parsed.origin === "object" ? `${parsed.origin.city}, ${parsed.origin.state}` : parsed.origin}</p></div>
                    <div><p className="text-muted-foreground">Destination</p><p className="font-medium">{typeof parsed.destination === "object" ? `${parsed.destination.city}, ${parsed.destination.state}` : parsed.destination}</p></div>
                    <div><p className="text-muted-foreground">Commodity</p><p className="font-medium">{parsed.commodity || "N/A"}</p></div>
                    <div><p className="text-muted-foreground">Rate</p><p className="font-medium">{parsed.rate ? `$${parsed.rate}` : "N/A"}</p></div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {(!emails.data || emails.data.length === 0) && (
          <Card className="border-dashed"><CardContent className="p-12 text-center"><Mail className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" /><h3 className="text-lg font-medium">No inbound emails</h3><p className="text-sm text-muted-foreground mt-1">Forward load request emails to your AXIOM inbox for AI parsing</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}
