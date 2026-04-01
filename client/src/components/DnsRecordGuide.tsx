import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
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
    title: "SPF Record Setup - Plain English Guide",
    description: "SPF proves your domain is authorized to send emails",
    whatItDoes: "Think of SPF like a permission slip. It tells email providers: 'Yes, this server has permission to send emails from my domain'",
    why: "Without SPF, scammers can pretend to be you. SPF stops that.",
    recordType: "TXT",
    registrarSteps: {
      godaddy: [
        "1. Open godaddy.com in your browser and log in with your username and password",
        "2. Look for 'Domains' at the top of the page and click it",
        "3. Find your domain name in the list (example: yourdomain.com)",
        "4. Click the three dots (...) next to your domain name",
        "5. Click 'Manage DNS' from the menu that appears",
        "6. Scroll down until you see a section called 'DNS Records' (it shows a list of existing records)",
        "7. Look for a button that says '+ Add' or '+ Add Record' and click it",
        "8. A form will pop up. For 'Type', select 'TXT' from the dropdown menu",
        "9. For 'Name' or 'Host', type: @ (just the @ symbol, nothing else)",
        "10. For 'Value', paste the SPF record that we gave you above (the long string starting with 'v=spf1')",
        "11. Leave 'TTL' as is (usually 3600 or 1 hour)",
        "12. Click the 'Save' button",
        "13. You're done! The record is now added.",
      ],
      namecheap: [
        "1. Open namecheap.com and log in",
        "2. On the left side, click 'Domain List'",
        "3. Find your domain and click 'Manage' next to it",
        "4. Click the 'Advanced DNS' tab at the top",
        "5. Look for a button that says '+ Add New Record' and click it",
        "6. For 'Type', select 'TXT Record' from the dropdown",
        "7. For 'Host', type: @ (just the @ symbol)",
        "8. For 'Value', paste the SPF record we gave you (the long string starting with 'v=spf1')",
        "9. Leave 'TTL' as the default (usually 3600)",
        "10. Click the checkmark (✓) button to save",
      ],
      cloudflare: [
        "1. Open cloudflare.com and log in",
        "2. Click on your domain name",
        "3. Click the 'DNS' tab on the left side",
        "4. Click '+ Add record' button",
        "5. For 'Type', select 'TXT' from the dropdown",
        "6. For 'Name', type: @ (just the @ symbol)",
        "7. For 'Content', paste the SPF record we gave you (the long string starting with 'v=spf1')",
        "8. Leave 'TTL' set to 'Auto'",
        "9. Click 'Save'",
      ],
      google: [
        "1. Open domains.google.com and log in",
        "2. Click on your domain name",
        "3. On the left side, click 'DNS'",
        "4. Scroll down to 'Custom records' section",
        "5. Click 'Create new record'",
        "6. For 'Type', select 'TXT' from the dropdown",
        "7. For 'Name', leave it blank (or type @ )",
        "8. For 'TTL', set it to 3600",
        "9. For 'Data', paste the SPF record we gave you (the long string starting with 'v=spf1')",
        "10. Click 'Create'",
      ],
    },
    commonMistakes: [
      "❌ Typing the record value wrong - Copy and paste it exactly as shown",
      "❌ Using the wrong 'Name' field - Always use @ (at symbol)",
      "❌ Forgetting to save - Make sure you click Save/Create at the end",
      "❌ Checking too quickly - DNS changes take 5-30 minutes to show up",
    ],
  },
  dkim: {
    title: "DKIM Record Setup - Plain English Guide",
    description: "DKIM digitally signs your emails so providers know they're really from you",
    whatItDoes: "DKIM is like your digital signature on emails. It proves the email came from you and wasn't changed by anyone else.",
    why: "Email providers trust signed emails more. This helps your emails get to the inbox instead of spam.",
    recordType: "CNAME or TXT",
    registrarSteps: {
      godaddy: [
        "1. Open godaddy.com and log in",
        "2. Click 'Domains' at the top",
        "3. Find your domain and click the three dots (...)",
        "4. Click 'Manage DNS'",
        "5. Scroll to 'DNS Records' section",
        "6. Click '+ Add' button",
        "7. For 'Type', select 'CNAME' from the dropdown (CNAME is a special type of DNS record)",
        "8. For 'Name' or 'Host', type exactly: selector._domainkey",
        "   (This is the exact text - don't change it, don't add your domain)",
        "9. For 'Points to' or 'Value', paste the DKIM record we gave you",
        "10. Leave 'TTL' as default (3600)",
        "11. Click 'Save'",
        "",
        "⚠️ IMPORTANT: If you get an error saying CNAME doesn't work, try again with Type = 'TXT' instead",
      ],
      namecheap: [
        "1. Open namecheap.com and log in",
        "2. Click 'Domain List' on the left",
        "3. Click 'Manage' next to your domain",
        "4. Click 'Advanced DNS' tab",
        "5. Click '+ Add New Record'",
        "6. For 'Type', select 'CNAME Record'",
        "7. For 'Host', type exactly: selector._domainkey",
        "8. For 'Value', paste the DKIM record we gave you",
        "9. Leave 'TTL' as default",
        "10. Click the checkmark (✓) to save",
      ],
      cloudflare: [
        "1. Open cloudflare.com and log in",
        "2. Click your domain",
        "3. Click 'DNS' tab",
        "4. Click '+ Add record'",
        "5. For 'Type', select 'CNAME'",
        "6. For 'Name', type exactly: selector._domainkey",
        "7. For 'Target', paste the DKIM record we gave you",
        "8. Leave 'TTL' as 'Auto'",
        "9. Click 'Save'",
      ],
      google: [
        "1. Open domains.google.com and log in",
        "2. Click your domain",
        "3. Click 'DNS' on the left",
        "4. Scroll to 'Custom records'",
        "5. Click 'Create new record'",
        "6. For 'Type', select 'CNAME'",
        "7. For 'Name', type exactly: selector._domainkey",
        "8. For 'TTL', set to 3600",
        "9. For 'Data', paste the DKIM record we gave you",
        "10. Click 'Create'",
      ],
    },
    commonMistakes: [
      "❌ Changing 'selector._domainkey' - This MUST stay exactly as written",
      "❌ Adding your domain to the name field - Just use 'selector._domainkey', nothing else",
      "❌ Pasting the wrong value - Make sure you copy the DKIM value, not the SPF or DMARC value",
      "❌ Using TXT instead of CNAME - Try CNAME first, only use TXT if CNAME fails",
    ],
  },
  dmarc: {
    title: "DMARC Record Setup - Plain English Guide",
    description: "DMARC tells email providers what to do if someone tries to fake your domain",
    whatItDoes: "DMARC is like a security policy. It says: 'If an email fails SPF or DKIM checks, here's what you should do with it'",
    why: "This protects your domain from being impersonated and stops phishing attacks.",
    recordType: "TXT",
    registrarSteps: {
      godaddy: [
        "1. Open godaddy.com and log in",
        "2. Click 'Domains' at the top",
        "3. Find your domain and click the three dots (...)",
        "4. Click 'Manage DNS'",
        "5. Scroll to 'DNS Records' section",
        "6. Click '+ Add' button",
        "7. For 'Type', select 'TXT' from the dropdown",
        "8. For 'Name' or 'Host', type exactly: _dmarc",
        "   (This is the exact text - don't change it)",
        "9. For 'Value', paste the DMARC record we gave you",
        "10. Leave 'TTL' as default (3600)",
        "11. Click 'Save'",
      ],
      namecheap: [
        "1. Open namecheap.com and log in",
        "2. Click 'Domain List' on the left",
        "3. Click 'Manage' next to your domain",
        "4. Click 'Advanced DNS' tab",
        "5. Click '+ Add New Record'",
        "6. For 'Type', select 'TXT Record'",
        "7. For 'Host', type exactly: _dmarc",
        "8. For 'Value', paste the DMARC record we gave you",
        "9. Leave 'TTL' as default",
        "10. Click the checkmark (✓) to save",
      ],
      cloudflare: [
        "1. Open cloudflare.com and log in",
        "2. Click your domain",
        "3. Click 'DNS' tab",
        "4. Click '+ Add record'",
        "5. For 'Type', select 'TXT'",
        "6. For 'Name', type exactly: _dmarc",
        "7. For 'Content', paste the DMARC record we gave you",
        "8. Leave 'TTL' as 'Auto'",
        "9. Click 'Save'",
      ],
      google: [
        "1. Open domains.google.com and log in",
        "2. Click your domain",
        "3. Click 'DNS' on the left",
        "4. Scroll to 'Custom records'",
        "5. Click 'Create new record'",
        "6. For 'Type', select 'TXT'",
        "7. For 'Name', type exactly: _dmarc",
        "8. For 'TTL', set to 3600",
        "9. For 'Data', paste the DMARC record we gave you",
        "10. Click 'Create'",
      ],
    },
    commonMistakes: [
      "❌ Changing '_dmarc' - This MUST stay exactly as written",
      "❌ Pasting the wrong value - Make sure you copy the DMARC value, not SPF or DKIM",
      "❌ Forgetting the underscore - It's _dmarc (with underscore), not dmarc",
    ],
  },
  mx: {
    title: "MX Record Setup - Plain English Guide",
    description: "MX records tell email providers where to send emails to your domain",
    whatItDoes: "MX is like your mailing address. It tells the postal service where to deliver letters to your domain.",
    why: "Without MX records, people can't send you emails to your domain.",
    recordType: "MX",
    registrarSteps: {
      godaddy: [
        "1. Open godaddy.com and log in",
        "2. Click 'Domains' at the top",
        "3. Find your domain and click the three dots (...)",
        "4. Click 'Manage DNS'",
        "5. Scroll to 'DNS Records' section",
        "6. Look for existing MX records (they might already be there)",
        "7. If you need to add one, click '+ Add' button",
        "8. For 'Type', select 'MX' from the dropdown",
        "9. For 'Name' or 'Host', type: @ (just the @ symbol)",
        "10. For 'Points to' or 'Value', paste the MX record we gave you",
        "11. For 'Priority', enter: 10 (this is the priority number)",
        "12. Leave 'TTL' as default (3600)",
        "13. Click 'Save'",
      ],
      namecheap: [
        "1. Open namecheap.com and log in",
        "2. Click 'Domain List' on the left",
        "3. Click 'Manage' next to your domain",
        "4. Click 'Advanced DNS' tab",
        "5. Look for existing MX records (they might already be there)",
        "6. If you need to add one, click '+ Add New Record'",
        "7. For 'Type', select 'MX Record'",
        "8. For 'Host', type: @ (just the @ symbol)",
        "9. For 'Mail Server', paste the MX record we gave you",
        "10. For 'Priority', enter: 10",
        "11. Leave 'TTL' as default",
        "12. Click the checkmark (✓) to save",
      ],
      cloudflare: [
        "1. Open cloudflare.com and log in",
        "2. Click your domain",
        "3. Click 'DNS' tab",
        "4. Look for existing MX records (they might already be there)",
        "5. If you need to add one, click '+ Add record'",
        "6. For 'Type', select 'MX'",
        "7. For 'Name', type: @ (just the @ symbol)",
        "8. For 'Mail server', paste the MX record we gave you",
        "9. For 'Priority', enter: 10",
        "10. Leave 'TTL' as 'Auto'",
        "11. Click 'Save'",
      ],
      google: [
        "1. Open domains.google.com and log in",
        "2. Click your domain",
        "3. Click 'DNS' on the left",
        "4. Look for existing MX records (they might already be there)",
        "5. If you need to add one, scroll to 'Custom records'",
        "6. Click 'Create new record'",
        "7. For 'Type', select 'MX'",
        "8. For 'Name', leave blank or type: @",
        "9. For 'TTL', set to 3600",
        "10. For 'Data', paste the MX record we gave you",
        "11. Click 'Create'",
      ],
    },
    commonMistakes: [
      "❌ Changing the MX value - Copy and paste it exactly as shown",
      "❌ Using the wrong priority - Usually use 10, unless you have multiple MX records",
      "❌ Forgetting to save - Make sure you click Save/Create at the end",
    ],
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
  const [expandedMistakes, setExpandedMistakes] = useState(false);
  const guide = GUIDES[recordType];

  if (!guide) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{guide.title}</DialogTitle>
          <DialogDescription>{guide.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* What it does - Plain English */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">In Plain English:</p>
            <p className="text-sm text-blue-800">{guide.whatItDoes}</p>
            <p className="text-sm text-blue-700 mt-3">
              <span className="font-semibold">Why this matters:</span> {guide.why}
            </p>
          </div>

          {/* Record Value - Clear Instructions */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-stone-900 mb-3">
              📋 Copy This Exact Text:
            </p>
            <div className="flex items-start gap-2">
              <code className="flex-1 bg-white border border-stone-300 rounded p-3 text-xs font-mono text-stone-700 break-all leading-relaxed">
                {recordValue}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(recordValue)}
                className="flex-shrink-0 mt-0.5"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-xs text-stone-600 mt-2">
              👆 Click the Copy button above, then paste this into your registrar
            </p>
          </div>

          {/* Registrar Selection */}
          <div>
            <p className="text-sm font-semibold text-stone-900 mb-3">
              🌐 Which registrar do you use? (Click one):
            </p>
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
              👇 Follow These Steps (for {selectedRegistrar.charAt(0).toUpperCase() + selectedRegistrar.slice(1)}):
            </p>
            <ol className="space-y-3">
              {guide.registrarSteps[selectedRegistrar]?.map((step: string, idx: number) => (
                <li key={idx} className="text-sm text-stone-700 flex gap-3">
                  <span className="font-bold text-amber-600 flex-shrink-0 bg-amber-100 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Common Mistakes */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <button
              onClick={() => setExpandedMistakes(!expandedMistakes)}
              className="w-full flex items-center justify-between text-sm font-semibold text-red-900 hover:text-red-700"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Common Mistakes to Avoid
              </span>
              {expandedMistakes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedMistakes && (
              <ul className="text-sm text-red-800 space-y-2 mt-3 list-none">
                {guide.commonMistakes?.map((mistake: string, idx: number) => (
                  <li key={idx} className="flex gap-2">
                    <span className="flex-shrink-0">⚠️</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Verification */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-emerald-900 mb-3">✅ After You Add the Record:</p>
            <ul className="text-sm text-emerald-800 space-y-2">
              <li>⏳ Wait 5-30 minutes (DNS changes are slow - this is normal)</li>
              <li>🔄 Come back to AXIOM CRM and click "Re-check DNS"</li>
              <li>⏰ If it still shows as pending, wait longer (sometimes up to 24 hours) and try again</li>
              <li>💡 Tip: You can check your DNS records at mxtoolbox.com (just paste your domain)</li>
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
