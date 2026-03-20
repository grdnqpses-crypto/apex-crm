import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import {
  FileSearch, Upload, FileText, FileCheck, AlertCircle, Clock,
  CheckCircle2, XCircle, Eye, Sparkles, Download, Filter
} from "lucide-react";

const docTypeLabels: Record<string, string> = {
  w9: "W-9 Form",
  insurance_certificate: "Insurance Certificate",
  mc_authority: "MC Authority",
  carrier_agreement: "Carrier Agreement",
  rate_confirmation: "Rate Confirmation",
  bol: "Bill of Lading",
  pod: "Proof of Delivery",
  lumper_receipt: "Lumper Receipt",
  invoice: "Invoice",
  other: "Other",
};

const extractionStatusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  processing: "bg-blue-500/20 text-blue-400",
  completed: "bg-emerald-500/20 text-emerald-400",
  failed: "bg-red-500/20 text-red-400",
};

export default function DocScan() {
  const { t } = useSkin();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState("other");

  const documents = trpc.documents.list.useQuery({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });
  const docDetail = trpc.documents.get.useQuery({ id: selectedDoc! }, { enabled: !!selectedDoc });
  const createDoc = trpc.documents.create.useMutation({ onSuccess: () => { documents.refetch(); toast.success("Document uploaded"); } });
  const extractData = trpc.documents.extractData.useMutation({
    onSuccess: (data) => {
      documents.refetch();
      if (selectedDoc) docDetail.refetch();
      if (data.success) toast.success("Data extracted successfully");
      else toast.error("Extraction failed");
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For demo, create document record with placeholder URL
    const fakeUrl = `https://storage.example.com/docs/${Date.now()}-${file.name}`;
    const fakeKey = `docs/${Date.now()}-${file.name}`;
    await createDoc.mutateAsync({
      fileName: file.name,
      fileUrl: fakeUrl,
      fileKey: fakeKey,
      mimeType: file.type,
      fileSizeBytes: file.size,
      documentType: uploadType,
      category: "general",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSearch className="h-7 w-7 text-primary" />
            DocScan — Document Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">AI-powered document classification, data extraction, and compliance verification</p>
        </div>
        <div className="flex gap-2">
          <Select value={uploadType} onValueChange={setUploadType}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Document Type" /></SelectTrigger>
            <SelectContent>
              {Object.entries(docTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Upload Document
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={handleFileUpload} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Documents", value: documents.data?.total || 0, icon: FileText, color: "text-blue-400" },
          { label: "Extracted", value: documents.data?.items?.filter((d: any) => d.extractionStatus === 'completed').length || 0, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Processing", value: documents.data?.items?.filter((d: any) => d.extractionStatus === 'processing').length || 0, icon: Clock, color: "text-amber-400" },
          { label: "Failed", value: documents.data?.items?.filter((d: any) => d.extractionStatus === 'failed').length || 0, icon: AlertCircle, color: "text-red-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="carrier_packet">Carrier Packet</SelectItem>
            <SelectItem value="shipping">Shipping</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(docTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {(documents.data?.items?.length || 0) === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-semibold mb-1">No Documents Yet</h3>
              <p className="text-sm">Upload your first document to start extracting data with AI</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Extraction</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.data?.items?.map((doc: any) => (
                  <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedDoc(doc.id)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium truncate max-w-[200px]">{doc.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{docTypeLabels[doc.documentType] || doc.documentType}</Badge></TableCell>
                    <TableCell className="text-muted-foreground capitalize">{doc.category?.replace(/_/g, ' ')}</TableCell>
                    <TableCell><Badge className={extractionStatusColors[doc.extractionStatus] || ""}>{doc.extractionStatus}</Badge></TableCell>
                    <TableCell>
                      {doc.extractionConfidence > 0 && (
                        <span className={`text-sm font-medium ${doc.extractionConfidence >= 80 ? 'text-emerald-400' : doc.extractionConfidence >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {doc.extractionConfidence}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {doc.extractionStatus === 'pending' && (
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); extractData.mutate({ documentId: doc.id, fileUrl: doc.fileUrl, documentType: doc.documentType }); }}>
                            <Sparkles className="h-3 w-3 mr-1" /> Extract
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc.id); }}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {docDetail.data?.fileName || "Document Details"}
            </DialogTitle>
          </DialogHeader>
          {docDetail.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground">Type</span>
                  <p className="font-medium">{docTypeLabels[docDetail.data.documentType] || docDetail.data.documentType}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge className={extractionStatusColors[docDetail.data.extractionStatus] || ""}>{docDetail.data.extractionStatus}</Badge>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <p className="font-medium">{docDetail.data.extractionConfidence || 0}%</p>
                </div>
              </div>

              {docDetail.data.extractedData && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Extracted Data
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(docDetail.data.extractedData as Record<string, unknown>).map(([key, value]) => (
                      <div key={key} className="bg-muted/20 rounded-lg p-2">
                        <span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
                        <p className="text-sm font-medium truncate">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {docDetail.data.extractionStatus === 'pending' && (
                <Button className="w-full" onClick={() => extractData.mutate({ documentId: docDetail.data!.id, fileUrl: docDetail.data!.fileUrl, documentType: docDetail.data!.documentType })} disabled={extractData.isPending}>
                  <Sparkles className="h-4 w-4 mr-2" /> {extractData.isPending ? "Extracting..." : "Extract Data with AI"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
