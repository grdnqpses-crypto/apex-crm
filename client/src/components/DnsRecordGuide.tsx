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
        "11. For 'TTL', select '1 hour' (or 'Auto' if available) - this is how long the record is cached",
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
        "9. For 'TTL', leave as default (usually '1 hour' or 'Auto')",
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
        "8. For 'TTL', set it to 3600 (or select '1 hour' if available)",
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
    recordType: "TXT (NOT CNAME - CNAME does not work for DKIM)",
    registrarSteps: {
      godaddy: [
        "1. Open godaddy.com and log in",
        "2. Click 'Domains' at the top",
        "3. Find your domain and click the three dots (...)",
        "4. Click 'Manage DNS'",
        "5. Scroll to 'DNS Records' section",
        "6. Click '+ Add' button",
        "7. For 'Type', select 'TXT' from the dropdown (IMPORTANT: Must be TXT, not CNAME)",
        "8. For 'Name' or 'Host', type exactly what your email provider gave you",
        "   Example: google._domainkey (or selector._domainkey if using a different selector)",
        "   ⚠️ Do NOT change this - use exactly what your email provider specified",
        "9. For 'Value', paste the DKIM public key that your email provider gave you",
        "   This is a long string that looks like: v=DKIM1; k=rsa; p=MIGfMA0BgQD...",
        "10. For 'TTL', select '1 hour' (or 'Auto' if available)",
        "11. Click 'Save'",
      ],
      namecheap: [
        "1. Open namecheap.com and log in",
        "2. Click 'Domain List' on the left",
        "3. Click 'Manage' next to your domain",
        "4. Click 'Advanced DNS' tab",
        "5. Click '+ Add New Record'",
        "6. For 'Type', select 'TXT Record' (IMPORTANT: Must be TXT, not CNAME)",
        "7. For 'Host', type exactly what your email provider gave you",
        "   Example: google._domainkey (or selector._domainkey if using a different selector)",
        "   ⚠️ Do NOT change this - use exactly what your email provider specified",
        "8. For 'Value', paste the DKIM public key that your email provider gave you",
        "   This is a long string that looks like: v=DKIM1; k=rsa; p=MIGfMA0BgQD...",
        "9. Leave 'TTL' as default",
        "10. Click the checkmark (✓) to save",
      ],
      cloudflare: [
        "1. Open cloudflare.com and log in",
        "2. Click your domain",
        "3. Click 'DNS' tab",
        "4. Click '+ Add record'",
        "5. For 'Type', select 'TXT' (IMPORTANT: Must be TXT, not CNAME)",
        "6. For 'Name', type exactly what your email provider gave you",
        "   Example: google._domainkey (or selector._domainkey if using a different selector)",
        "   ⚠️ Do NOT change this - use exactly what your email provider specified",
        "7. For 'Content', paste the DKIM public key that your email provider gave you",
        "   This is a long string that looks like: v=DKIM1; k=rsa; p=MIGfMA0BgQD...",
        "8. Leave 'TTL' as 'Auto'",
        "9. Click 'Save'",
      ],
      google: [
        "1. Open domains.google.com and log in",
        "2. Click your domain",
        "3. Click 'DNS' on the left",
        "4. Scroll to 'Custom records'",
        "5. Click 'Create new record'",
        "6. For 'Type', select 'TXT' (IMPORTANT: Must be TXT, not CNAME)",
        "7. For 'Name', type exactly what your email provider gave you",
        "   Example: google._domainkey (or selector._domainkey if using a different selector)",
        "   ⚠️ Do NOT change this - use exactly what your email provider specified",
        "8. For 'TTL', select '1 hour' (or '30 minutes' if available)",
        "9. For 'Data', paste the DKIM public key that your email provider gave you",
        "   This is a long string that looks like: v=DKIM1; k=rsa; p=MIGfMA0BgQD...",
        "10. Click 'Create'",
      ],
    },
    commonMistakes: [
      "❌ Using CNAME instead of TXT - CNAME does NOT work for DKIM. Always use TXT.",
      "❌ Changing the selector/host name - Use EXACTLY what your email provider gave you (e.g., google._domainkey)",
      "❌ Adding your domain to the name field - Just use what your provider specified, nothing else",
      "❌ Pasting the wrong value - Make sure you copy the DKIM public key, not the SPF or DMARC value",
      "❌ Forgetting to include the full key - The DKIM value is usually very long (200+ characters). Make sure you paste the entire thing.",
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
        "   Example: v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com",
        "10. For 'TTL', select '1 hour' (or 'Auto' if available)",
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
        "   Example: v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com",
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
        "   Example: v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com",
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
        "8. For 'TTL', select '1 hour' (or '30 minutes' if available)",
        "9. For 'Data', paste the DMARC record we gave you",
        "   Example: v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com",
        "10. Click 'Create'",
      ],
    },
    commonMistakes: [
      "❌ Changing '_dmarc' - This MUST stay exactly as written",
      "❌ Adding your domain to the name field - Just use '_dmarc', nothing else",
      "❌ Pasting the wrong value - Make sure you copy the DMARC value, not the SPF or DKIM value",
      "❌ Forgetting the email address - Make sure the DMARC record includes an email (rua=mailto:...)",
    ],
  },
  mx: {
    title: "MX Record Setup - Plain English Guide",
    description: "MX records route incoming emails to your mail server",
    whatItDoes: "MX is like a mailbox address. It tells email providers where to deliver emails sent to your domain.",
    why: "Without MX records, people can't send you emails at your domain.",
    recordType: "MX",
    registrarSteps: {
      godaddy: [
        "1. Open godaddy.com and log in",
        "2. Click 'Domains' at the top",
        "3. Find your domain and click the three dots (...)",
        "4. Click 'Manage DNS'",
        "5. Scroll to 'DNS Records' section",
        "6. Look for existing MX records (they should already be there)",
        "7. If you need to add one, click '+ Add' button",
        "8. For 'Type', select 'MX' from the dropdown",
        "9. For 'Name' or 'Host', type: @ (just the @ symbol)",
        "10. For 'Points to' or 'Value', enter your mail server address (your email provider will give you this)",
        "    Example: mail.yourdomain.com or mail.google.com",
        "11. For 'Priority', enter a number (usually 10 or 20 - lower numbers are tried first)",
        "12. For 'TTL', select '1 hour' (or 'Auto' if available)",
        "13. Click 'Save'",
      ],
      namecheap: [
        "1. Open namecheap.com and log in",
        "2. Click 'Domain List' on the left",
        "3. Click 'Manage' next to your domain",
        "4. Click 'Advanced DNS' tab",
        "5. Look for existing MX records (they should already be there)",
        "6. If you need to add one, click '+ Add New Record'",
        "7. For 'Type', select 'MX Record'",
        "8. For 'Host', type: @ (just the @ symbol)",
        "9. For 'Value', enter your mail server address (your email provider will give you this)",
        "    Example: mail.yourdomain.com or mail.google.com",
        "10. For 'Priority', enter a number (usually 10 or 20 - lower numbers are tried first)",
        "11. Leave 'TTL' as default",
        "12. Click the checkmark (✓) to save",
      ],
      cloudflare: [
        "1. Open cloudflare.com and log in",
        "2. Click your domain",
        "3. Click 'DNS' tab",
        "4. Look for existing MX records (they should already be there)",
        "5. If you need to add one, click '+ Add record'",
        "6. For 'Type', select 'MX'",
        "7. For 'Name', type: @ (just the @ symbol)",
        "8. For 'Mail Server', enter your mail server address (your email provider will give you this)",
        "    Example: mail.yourdomain.com or mail.google.com",
        "9. For 'Priority', enter a number (usually 10 or 20 - lower numbers are tried first)",
        "10. Leave 'TTL' as 'Auto'",
        "11. Click 'Save'",
      ],
      google: [
        "1. Open domains.google.com and log in",
        "2. Click your domain",
        "3. Click 'DNS' on the left",
        "4. Look for existing MX records (they should already be there)",
        "5. If you need to add one, scroll to 'Custom records' and click 'Create new record'",
        "6. For 'Type', select 'MX'",
        "7. For 'Name', leave blank (or type @ )",
        "8. For 'TTL', select '1 hour' (or '30 minutes' if available)",
        "9. For 'Data', enter your mail server address (your email provider will give you this)",
        "    Example: mail.yourdomain.com or mail.google.com",
        "10. Click 'Create'",
      ],
    },
    commonMistakes: [
      "❌ Forgetting the priority number - MX records need a priority (usually 10 or 20)",
      "❌ Using the wrong mail server address - Ask your email provider for the exact address",
      "❌ Deleting existing MX records - Keep the ones that are already there unless your provider says to remove them",
      "❌ Using the wrong 'Name' field - Always use @ (at symbol)",
    ],
  },
};

export function DnsRecordGuide({
  recordType,
  domain,
  recordValue,
  isOpen,
  onClose,
}: DnsRecordGuideProps) {
  const guide = GUIDES[recordType];
  const [selectedRegistrar, setSelectedRegistrar] = useState<string>("godaddy");
  const [expandedMistakes, setExpandedMistakes] = useState(false);

  if (!guide) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recordValue);
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
          {/* In Plain English */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">In Plain English:</h3>
            <p className="text-blue-800">{guide.whatItDoes}</p>
          </div>

          {/* Why This Matters */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Why this matters:</h3>
            <p className="text-green-800">{guide.why}</p>
          </div>

          {/* Record Type */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Record Type:</h3>
            <p className="text-yellow-800 font-mono">{guide.recordType}</p>
          </div>

          {/* Copy This Exact Text */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-3">Copy This Exact Text:</h3>
            <div className="bg-white border border-purple-300 rounded p-3 font-mono text-sm break-all mb-3">
              {recordValue}
            </div>
            <Button onClick={copyToClipboard} className="w-full" variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
            <p className="text-sm text-purple-700 mt-3">
              ⚠️ Click the Copy button above, then paste this exact value into your registrar. Do not change anything.
            </p>
          </div>

          {/* Which Registrar */}
          <div>
            <h3 className="font-semibold mb-3">Which registrar do you use? (Click one):</h3>
            <div className="grid grid-cols-2 gap-2">
              {REGISTRARS.map((registrar) => (
                <Button
                  key={registrar}
                  onClick={() => setSelectedRegistrar(registrar)}
                  variant={selectedRegistrar === registrar ? "default" : "outline"}
                  className="capitalize"
                >
                  {registrar}
                </Button>
              ))}
            </div>
          </div>

          {/* Steps for Selected Registrar */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 capitalize">
              Follow These Steps (for {selectedRegistrar}):
            </h3>
            <ol className="space-y-2">
              {guide.registrarSteps[selectedRegistrar]?.map((step: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Common Mistakes */}
          <div className="border border-red-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedMistakes(!expandedMistakes)}
              className="w-full bg-red-50 p-4 flex items-center justify-between hover:bg-red-100 transition"
            >
              <h3 className="font-semibold text-red-900">Common Mistakes to Avoid</h3>
              {expandedMistakes ? (
                <ChevronUp className="w-5 h-5 text-red-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-red-600" />
              )}
            </button>
            {expandedMistakes && (
              <div className="bg-red-50 p-4 space-y-2 border-t border-red-200">
                {guide.commonMistakes?.map((mistake: string, idx: number) => (
                  <p key={idx} className="text-sm text-red-800">
                    {mistake}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Quick Timeline */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-900 mb-3">Quick Timeline:</h3>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li>✓ Add records to your registrar: 5-10 minutes</li>
              <li>✓ DNS propagates globally: 5 minutes to 24 hours</li>
              <li>✓ Click "Re-check DNS" to verify: After 5-10 minutes</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
