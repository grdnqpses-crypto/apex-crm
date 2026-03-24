import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Download, Plus, Trash2, Truck, DollarSign, MapPin, Calendar, Building2 } from "lucide-react";
import jsPDF from "jspdf";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
}

interface RateConfirmation {
  confirmationNumber: string;
  date: string;
  brokerName: string;
  brokerAddress: string;
  brokerPhone: string;
  brokerEmail: string;
  brokerMC: string;
  carrierName: string;
  carrierAddress: string;
  carrierPhone: string;
  carrierEmail: string;
  carrierMC: string;
  carrierDOT: string;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  pickupDate: string;
  deliveryDate: string;
  commodity: string;
  weight: string;
  equipment: string;
  specialInstructions: string;
  lineItems: LineItem[];
  currency: string;
}

const defaultForm: RateConfirmation = {
  confirmationNumber: `RC-${Date.now().toString().slice(-6)}`,
  date: new Date().toISOString().split("T")[0],
  brokerName: "",
  brokerAddress: "",
  brokerPhone: "",
  brokerEmail: "",
  brokerMC: "",
  carrierName: "",
  carrierAddress: "",
  carrierPhone: "",
  carrierEmail: "",
  carrierMC: "",
  carrierDOT: "",
  originCity: "",
  originState: "",
  destinationCity: "",
  destinationState: "",
  pickupDate: "",
  deliveryDate: "",
  commodity: "",
  weight: "",
  equipment: "Dry Van 53'",
  specialInstructions: "",
  lineItems: [{ id: "1", description: "Line Haul", quantity: 1, unit: "load", rate: 0 }],
  currency: "USD",
};

function generatePDF(form: RateConfirmation) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 40;

  // Header bar
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("RATE CONFIRMATION", margin, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`#${form.confirmationNumber}`, margin, 48);
  doc.text(`Date: ${form.date}`, pageW - margin - 120, 48);
  y = 90;

  // Two-column: Broker | Carrier
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BROKER / SHIPPER", margin, y);
  doc.text("CARRIER", pageW / 2 + 10, y);
  y += 14;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  const brokerLines = [form.brokerName, form.brokerAddress, form.brokerPhone, form.brokerEmail, form.brokerMC ? `MC# ${form.brokerMC}` : ""].filter(Boolean);
  const carrierLines = [form.carrierName, form.carrierAddress, form.carrierPhone, form.carrierEmail, form.carrierMC ? `MC# ${form.carrierMC}` : "", form.carrierDOT ? `DOT# ${form.carrierDOT}` : ""].filter(Boolean);
  const maxLines = Math.max(brokerLines.length, carrierLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (brokerLines[i]) doc.text(brokerLines[i], margin, y);
    if (carrierLines[i]) doc.text(carrierLines[i], pageW / 2 + 10, y);
    y += 14;
  }
  y += 10;

  // Shipment details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SHIPMENT DETAILS", margin, y);
  y += 14;
  doc.line(margin, y, pageW - margin, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  const details = [
    [`Origin:`, `${form.originCity}, ${form.originState}`, `Pickup Date:`, form.pickupDate],
    [`Destination:`, `${form.destinationCity}, ${form.destinationState}`, `Delivery Date:`, form.deliveryDate],
    [`Equipment:`, form.equipment, `Weight:`, form.weight ? `${form.weight} lbs` : ""],
    [`Commodity:`, form.commodity, "", ""],
  ];
  for (const row of details) {
    doc.setFont("helvetica", "bold");
    doc.text(row[0], margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(row[1], margin + 80, y);
    if (row[2]) {
      doc.setFont("helvetica", "bold");
      doc.text(row[2], pageW / 2 + 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(row[3], pageW / 2 + 100, y);
    }
    y += 14;
  }
  y += 10;

  // Line items table
  doc.setFont("helvetica", "bold");
  doc.text("CHARGES", margin, y);
  y += 14;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y - 10, pageW - margin * 2, 18, "F");
  doc.text("Description", margin + 4, y + 4);
  doc.text("Qty", pageW - 220, y + 4);
  doc.text("Unit", pageW - 180, y + 4);
  doc.text("Rate", pageW - 130, y + 4);
  doc.text("Amount", pageW - 70, y + 4);
  y += 18;
  doc.line(margin, y - 10, pageW - margin, y - 10);
  doc.setFont("helvetica", "normal");
  let total = 0;
  for (const item of form.lineItems) {
    const amount = item.quantity * item.rate;
    total += amount;
    doc.text(item.description, margin + 4, y + 4);
    doc.text(String(item.quantity), pageW - 220, y + 4);
    doc.text(item.unit, pageW - 180, y + 4);
    doc.text(`${form.currency} ${item.rate.toFixed(2)}`, pageW - 130, y + 4);
    doc.text(`${form.currency} ${amount.toFixed(2)}`, pageW - 70, y + 4);
    y += 18;
  }
  doc.line(margin, y, pageW - margin, y);
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", pageW - 130, y);
  doc.setFontSize(12);
  doc.text(`${form.currency} ${total.toFixed(2)}`, pageW - 70, y);
  y += 20;

  // Special instructions
  if (form.specialInstructions) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SPECIAL INSTRUCTIONS / NOTES:", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(form.specialInstructions, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 14 + 10;
  }

  // Signature block
  y += 10;
  doc.line(margin, y, margin + 180, y);
  doc.line(pageW - margin - 180, y, pageW - margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Broker Signature / Date", margin, y);
  doc.text("Carrier Signature / Date", pageW - margin - 180, y);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("This rate confirmation is subject to the terms and conditions of the broker-carrier agreement.", margin, doc.internal.pageSize.getHeight() - 20);

  doc.save(`rate-confirmation-${form.confirmationNumber}.pdf`);
}

export default function FreightRateConfirmation() {
  const [form, setForm] = useState<RateConfirmation>(defaultForm);

  const update = (field: keyof RateConfirmation, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const addLineItem = () => setForm(prev => ({
    ...prev,
    lineItems: [...prev.lineItems, { id: Date.now().toString(), description: "", quantity: 1, unit: "load", rate: 0 }],
  }));

  const removeLineItem = (id: string) => setForm(prev => ({
    ...prev,
    lineItems: prev.lineItems.filter(i => i.id !== id),
  }));

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) =>
    setForm(prev => ({ ...prev, lineItems: prev.lineItems.map(i => i.id === id ? { ...i, [field]: value } : i) }));

  const total = form.lineItems.reduce((s, i) => s + i.quantity * i.rate, 0);

  const handleDownload = () => {
    try {
      generatePDF(form);
      toast.success("PDF downloaded successfully");
    } catch (e) {
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Freight Rate Confirmation</h1>
              <p className="text-sm text-muted-foreground">Generate professional rate confirmation PDFs</p>
            </div>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Header info */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Confirmation Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><Label>Confirmation #</Label><Input className="mt-1" value={form.confirmationNumber} onChange={e => update("confirmationNumber", e.target.value)} /></div>
            <div><Label>Date</Label><Input type="date" className="mt-1" value={form.date} onChange={e => update("date", e.target.value)} /></div>
            <div><Label>Equipment</Label>
              <Select value={form.equipment} onValueChange={v => update("equipment", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Dry Van 53'", "Reefer 53'", "Flatbed 48'", "Flatbed 53'", "Step Deck", "Lowboy", "Box Truck", "Sprinter Van", "Power Only"].map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Currency</Label>
              <Select value={form.currency} onValueChange={v => update("currency", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["USD", "CAD", "MXN", "EUR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Broker & Carrier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Broker / Shipper</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(["brokerName", "brokerAddress", "brokerPhone", "brokerEmail", "brokerMC"] as const).map(f => (
                <div key={f}><Label className="capitalize">{f.replace("broker", "").replace(/([A-Z])/g, " $1").trim()}</Label><Input className="mt-1" value={form[f]} onChange={e => update(f, e.target.value)} placeholder={f === "brokerMC" ? "MC#" : ""} /></div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" />Carrier</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(["carrierName", "carrierAddress", "carrierPhone", "carrierEmail", "carrierMC", "carrierDOT"] as const).map(f => (
                <div key={f}><Label className="capitalize">{f.replace("carrier", "").replace(/([A-Z])/g, " $1").trim()}</Label><Input className="mt-1" value={form[f]} onChange={e => update(f, e.target.value)} placeholder={f === "carrierMC" ? "MC#" : f === "carrierDOT" ? "DOT#" : ""} /></div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Route */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Shipment Route</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><Label>Origin City</Label><Input className="mt-1" value={form.originCity} onChange={e => update("originCity", e.target.value)} /></div>
            <div><Label>Origin State</Label><Input className="mt-1" maxLength={2} value={form.originState} onChange={e => update("originState", e.target.value.toUpperCase())} /></div>
            <div><Label>Dest. City</Label><Input className="mt-1" value={form.destinationCity} onChange={e => update("destinationCity", e.target.value)} /></div>
            <div><Label>Dest. State</Label><Input className="mt-1" maxLength={2} value={form.destinationState} onChange={e => update("destinationState", e.target.value.toUpperCase())} /></div>
            <div><Label>Pickup Date</Label><Input type="date" className="mt-1" value={form.pickupDate} onChange={e => update("pickupDate", e.target.value)} /></div>
            <div><Label>Delivery Date</Label><Input type="date" className="mt-1" value={form.deliveryDate} onChange={e => update("deliveryDate", e.target.value)} /></div>
            <div><Label>Commodity</Label><Input className="mt-1" value={form.commodity} onChange={e => update("commodity", e.target.value)} /></div>
            <div><Label>Weight (lbs)</Label><Input type="number" className="mt-1" value={form.weight} onChange={e => update("weight", e.target.value)} /></div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Charges</CardTitle>
              <Button variant="outline" size="sm" onClick={addLineItem}><Plus className="h-4 w-4 mr-1" />Add Line</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
              <span className="col-span-5">Description</span>
              <span className="col-span-2">Qty</span>
              <span className="col-span-2">Unit</span>
              <span className="col-span-2">Rate ({form.currency})</span>
              <span className="col-span-1"></span>
            </div>
            {form.lineItems.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <Input className="col-span-5" value={item.description} onChange={e => updateLineItem(item.id, "description", e.target.value)} placeholder="Line Haul" />
                <Input className="col-span-2" type="number" min="1" value={item.quantity} onChange={e => updateLineItem(item.id, "quantity", Number(e.target.value))} />
                <Input className="col-span-2" value={item.unit} onChange={e => updateLineItem(item.id, "unit", e.target.value)} placeholder="load" />
                <Input className="col-span-2" type="number" min="0" step="0.01" value={item.rate} onChange={e => updateLineItem(item.id, "rate", Number(e.target.value))} />
                <Button variant="ghost" size="icon" className="col-span-1 h-8 w-8 text-destructive" onClick={() => removeLineItem(item.id)} disabled={form.lineItems.length === 1}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-end items-center gap-3">
              <span className="text-sm text-muted-foreground">Total:</span>
              <Badge variant="secondary" className="text-base font-bold px-3 py-1">
                {form.currency} {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Special Instructions */}
        <Card>
          <CardHeader><CardTitle className="text-base">Special Instructions / Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={4} value={form.specialInstructions} onChange={e => update("specialInstructions", e.target.value)} placeholder="TONU, detention policy, lumper fees, hazmat requirements, etc." />
          </CardContent>
        </Card>

        <div className="flex justify-end pb-6">
          <Button size="lg" onClick={handleDownload} className="gap-2">
            <Download className="h-5 w-5" />
            Download Rate Confirmation PDF
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
