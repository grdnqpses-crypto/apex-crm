import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface DnsRecordGuideProps {
  recordType: "spf" | "dkim" | "dmarc" | "mx";
  domain: string;
  recordValue: string;
  isOpen: boolean;
  onClose: () => void;
}

const REGISTRARS = ["godaddy", "namecheap", "cloudflare", "google"];

const GUIDES: Record<string, Record<string, any>> = {
  spf: {
    title: "SPF Record Setup",
    description: "SPF (Sender Policy Framework) proves your domain is authorized to send emails",
    whatItDoes: "Tells email providers which servers are allowed to send emails from your domain",
    why: "Prevents email spoofing and improves deliverability",
    recordType: "TXT",
    registrarSteps: {
      godaddy: [
        "1. Go to godaddy.com and log in",
        "2. Click 'Domains' in the top menu",
        "3. Find your domain and click the 3 dots → 'Manage DNS'",
        "4. Scroll to 'DNS Records' section",
        "5. Click '+ Add' button",
        "6. Select Type: TXT",
        "7. Name/Host: @ (or leave blank)",
        "8. Value: Paste the SPF record below",
        "9. TTL: 3600 (default)",
        "10. Click 'Save'",
      ],
      namecheap: [
        "1. Log in to namecheap.com",
        "2. Click 'Domain List' on the left",
        "3. Click 'Manage' next to your domain",
        "4. Go to 'Advanced DNS' tab",
        "5. Click '+ Add New Record'",
        "6. Type: TXT Record",
        "7. Host: @ (root domain)",
        "8. Value: Paste the SPF record below",
        "9. TTL: 3600",
        "10. Click the checkmark to save",
      ],
      cloudflare: [
        "1. Log in to cloudflare.com",
        "2. Select your domain",
        "3. Go to 'DNS' tab",
        "4. Click '+ Add record'",
        "5. Type: TXT",
        "6. Name: @ (your domain)",
        "7. Content: Paste the SPF record below",
        "8. TTL: Auto",
        "9. Click 'Save'",
      ],
      google: [
        "1. Go to domains.google.com",
        "2. Select your domain",
        "3. Click 'DNS' on the left",
        "4. Scroll to 'Custom records'",
        "5. Click 'Create new record'",
        "6. Type: TXT",
        "7. Name: @ (leave blank for root)",
        "8. TTL: 3600",
        "9. Data: Paste the SPF record below",
        "10. Click 'Create'",
      ],
    },
  },
  dkim: {
    title: "DKIM Record Setup",
    description: "DKIM (DomainKeys Identified Mail) cryptographically signs your emails",
    whatItDoes: "Adds a digital signature to prove emails came from your domain",
    why: "Prevents email spoofing and improves trust with email providers",
    recordType: "CNAME or TXT",
    registrarSteps: {
      godaddy: [
        "1. Go to godaddy.com and log in",
        "2. Click 'Domains' → find your domain",
        "3. Click the 3 dots → 'Manage DNS'",
        "4. Scroll to 'DNS Records'",
        "5. Click '+ Add'",
        "6. Type: CNAME (or TXT if CNAME doesn't work)",
        "7. Name/Host: selector._domainkey (or what your provider specifies)",
        "8. Points to: Paste the DKIM value below",
        "9. TTL: 3600",
        "10. Click 'Save'",
      ],
      namecheap: [
        "1. Log in to namecheap.com",
        "2. Click 'Domain List' → 'Manage' next to your domain",
        "3. Go to 'Advanced DNS' tab",
        "4. Click '+ Add New Record'",
        "5. Type: CNAME Record",
        "6. Host: selector._domainkey",
        "7. Value: Paste the DKIM record below",
        "8. TTL: 3600",
        "9. Click the checkmark",
      ],
      cloudflare: [
        "1. Log in to cloudflare.com",
        "2. Select your domain",
        "3. Go to 'DNS' tab",
        "4. Click '+ Add record'",
        "5. Type: CNAME",
        "6. Name: selector._domainkey",
        "7. Target: Paste the DKIM record below",
        "8. TTL: Auto",
        "9. Click 'Save'",
      ],
      google: [
        "1. Go to domains.google.com",
        "2. Select your domain",
        "3. Click 'DNS' on the left",
        "4. Scroll to 'Custom records'",
        "5. Click 'Create new record'",
        "6. Type: CNAME",
        "7. Name: selector._domainkey",
        "8. TTL: 3600",
        "9. Data: Paste the DKIM record below",
        "10. Click 'Create'",
      ],
    },
  },
  dmarc: {
    title: "DMARC Record Setup",
    description: "DMARC (Domain-based Message Authentication) tells providers what to do with unauth emails",
    whatItDoes: "Protects your domain from being impersonated by specifying what to do with failed emails",
    why: "Prevents phishing attacks and improves email security",
    recordType: "TXT",
    registrarSteps: {
      godaddy: [
        "1. Go to godaddy.com and log in",
        "2. Click 'Domains' → find your domain",
        "3. Click the 3 dots → 'Manage DNS'",
        "4. Scroll to 'DNS Records'",
        "5. Click '+ Add'",
        "6. Type: TXT",
        "7. Name/Host: _dmarc",
        "8. Value: Paste the DMARC record below",
        "9. TTL: 3600",
        "10. Click 'Save'",
      ],
      namecheap: [
        "1. Log in to namecheap.com",
        "2. Click 'Domain List' → 'Manage'",
        "3. Go to 'Advanced DNS'",
        "4. Click '+ Add New Record'",
        "5. Type: TXT Record",
        "6. Host: _dmarc",
        "7. Value: Paste the DMARC record below",
        "8. TTL: 3600",
        "9. Click the checkmark",
      ],
      cloudflare: [
        "1. Log in to cloudflare.com",
        "2. Select your domain",
        "3. Go to 'DNS' tab",
        "4. Click '+ Add record'",
        "5. Type: TXT",
        "6. Name: _dmarc",
        "7. Content: Paste the DMARC record below",
        "8. TTL: Auto",
        "9. Click 'Save'",
      ],
      google: [
        "1. Go to domains.google.com",
        "2. Select your domain",
        "3. Click 'DNS'",
        "4. Scroll to 'Custom records'",
        "5. Click 'Create new record'",
        "6. Type: TXT",
        "7. Name: _dmarc",
        "8. TTL: 3600",
        "9. Data: Paste the DMARC record below",
        "10. Click 'Create'",
      ],
    },
  },
  mx: {
    title: "MX Record Setup",
    description: "MX (Mail Exchange) records route incoming emails to your mail server",
    whatItDoes: "Tells email providers where to send emails addressed to your domain",
    why: "Ensures people can send emails to your domain and you receive them",
    recordType: "MX",
    registrarSteps: {
      godaddy: [
        "1. Go to godaddy.com and log in",
        "2. Click 'Domains' → find your domain",
        "3. Click the 3 dots → 'Manage DNS'",
        "4. Scroll to 'DNS Records'",
        "5. Click '+ Add'",
        "6. Type: MX",
        "7. Name/Host: @ (root domain)",
        "8. Points to: Paste the MX value below",
        "9. Priority: 10 (or as specified)",
        "10. TTL: 3600",
        "11. Click 'Save'",
      ],
      namecheap: [
        "1. Log in to namecheap.com",
        "2. Click 'Domain List' → 'Manage'",
        "3. Go to 'Advanced DNS'",
        "4. Look for existing MX records or click '+ Add New Record'",
        "5. Type: MX Record",
        "6. Host: @",
        "7. Mail Server: Paste the MX value below",
        "8. Priority: 10",
        "9. TTL: 3600",
        "10. Click the checkmark",
      ],
      cloudflare: [
        "1. Log in to cloudflare.com",
        "2. Select your domain",
        "3. Go to 'DNS' tab",
        "4. Click '+ Add record'",
        "5. Type: MX",
        "6. Name: @ (your domain)",
        "7. Mail server: Paste the MX value below",
        "8. Priority: 10",
        "9. TTL: Auto",
        "10. Click 'Save'",
      ],
      google: [
        "1. Go to domains.google.com",
        "2. Select your domain",
        "3. Click 'DNS'",
        "4. Scroll to 'Custom records'",
        "5. Click 'Create new record'",
        "6. Type: MX",
        "7. Name: @ (leave blank)",
        "8. TTL: 3600",
        "9. Data: Paste the MX value below",
        "10. Click 'Create'",
      ],
    },
  },
};

export default function DnsRecordGuide({
  recordType,
  domain,
  recordValue,
  isOpen,
  onClose,
}: DnsRecordGuideProps) {
  const [selectedRegistrar, setSelectedRegistrar] = useState<string>("godaddy");
  const guide = GUIDES[recordType];

  if (!guide) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{guide.title}</DialogTitle>
          <DialogDescription>{guide.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* What it does */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-1">What this record does:</p>
            <p className="text-sm text-blue-800">{guide.whatItDoes}</p>
            <p className="text-sm text-blue-700 mt-2">
              <span className="font-semibold">Why it matters:</span> {guide.why}
            </p>
          </div>

          {/* Record Value */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-stone-900 mb-2">Record Value (copy this):</p>
            <div className="flex items-start gap-2">
              <code className="flex-1 bg-white border border-stone-300 rounded p-3 text-xs font-mono text-stone-700 break-all">
                {recordValue}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(recordValue)}
                className="flex-shrink-0 mt-0.5"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Registrar Selection */}
          <div>
            <p className="text-sm font-semibold text-stone-900 mb-3">Select your domain registrar:</p>
            <div className="grid grid-cols-2 gap-2">
              {REGISTRARS.map((registrar) => (
                <button
                  key={registrar}
                  onClick={() => setSelectedRegistrar(registrar)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedRegistrar === registrar
                      ? "border-amber-500 bg-amber-50 text-amber-900"
                      : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                  }`}
                >
                  {registrar.charAt(0).toUpperCase() + registrar.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="bg-white border border-stone-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-stone-900 mb-4">
              Step-by-Step Instructions for {selectedRegistrar.charAt(0).toUpperCase() + selectedRegistrar.slice(1)}:
            </p>
            <ol className="space-y-2">
              {guide.registrarSteps[selectedRegistrar]?.map((step: string, idx: number) => (
                <li key={idx} className="text-sm text-stone-700 flex gap-3">
                  <span className="font-semibold text-amber-600 flex-shrink-0">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Verification */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-emerald-900 mb-2">After adding the record:</p>
            <ul className="text-sm text-emerald-800 space-y-1 list-disc list-inside">
              <li>Wait 5-30 minutes for DNS to propagate (sometimes up to 24 hours)</li>
              <li>Come back to AXIOM and click "Re-check DNS"</li>
              <li>If still showing as pending, wait longer and try again</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
