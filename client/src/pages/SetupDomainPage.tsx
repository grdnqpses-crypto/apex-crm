import { useAuth } from '@/_core/hooks/useAuth';
import { OneClickSetup } from '@/components/OneClickSetup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Zap, Mail, Send } from 'lucide-react';
import { Link } from 'wouter';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SetupDomainPage() {
  const { user } = useAuth();
  const [setupMode, setSetupMode] = useState<'choose' | 'domain' | 'emailonly'>('choose');
  const [domain, setDomain] = useState('gareversal.com');
  const [customDomain, setCustomDomain] = useState('');
  const [email, setEmail] = useState('crypto@gareversal.com');
  const [emailProvider, setEmailProvider] = useState<'office365' | 'gmail' | 'custom'>('office365');
  const [setupComplete, setSetupComplete] = useState(false);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) {
      toast.error('Please enter a recipient email');
      return;
    }
    setSendingTestEmail(true);
    try {
      // Call backend to send test email
      const response = await fetch('/api/trpc/email.sendTestEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: testEmailRecipient,
          senderEmail: email,
          domain: customDomain || domain,
        }),
      });
      
      if (response.ok) {
        toast.success(`Test email sent to ${testEmailRecipient}`);
        setTestEmailOpen(false);
        setTestEmailRecipient('');
      } else {
        toast.error('Failed to send test email');
      }
    } catch (error) {
      toast.error('Error sending test email');
    } finally {
      setSendingTestEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b border-border/40 bg-white/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                Email & Domain Setup
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your email provider and domain
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!setupComplete && setupMode === 'choose' ? (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Setup Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-6">How would you like to set up your email?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setSetupMode('domain')}
                  className="border-2 border-border rounded-lg p-6 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-emerald-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">One-Click Domain Setup</h3>
                      <p className="text-sm text-muted-foreground mt-1">Automatically configure your domain and email with DNS records</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setSetupMode('emailonly')}
                  className="border-2 border-border rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">Email Only</h3>
                      <p className="text-sm text-muted-foreground mt-1">Skip domain setup and just configure your email provider</p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        ) : !setupComplete && setupMode === 'domain' ? (
          <OneClickSetup
            domain={customDomain || domain}
            email={email}
            emailProvider={emailProvider}
            onComplete={() => setSetupComplete(true)}
          />
        ) : !setupComplete && setupMode === 'emailonly' ? (
          <Card>
            <CardHeader>
              <CardTitle>Configure Email Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="custom-domain">Your Domain (optional)</Label>
                <Input
                  id="custom-domain"
                  placeholder="example.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="rounded-xl bg-muted/30"
                />
                <p className="text-xs text-muted-foreground">Leave blank to use your email provider's default domain</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-address">Email Address</Label>
                <Input
                  id="email-address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-provider">Email Provider</Label>
                <select
                  id="email-provider"
                  value={emailProvider}
                  onChange={(e) => setEmailProvider(e.target.value as 'office365' | 'gmail' | 'custom')}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-muted/30"
                >
                  <option value="office365">Office 365</option>
                  <option value="gmail">Gmail</option>
                  <option value="custom">Custom SMTP</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSetupMode('choose')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setSetupComplete(true)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Complete Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardHeader>
              <CardTitle className="text-emerald-900 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Setup Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 space-y-3">
                {setupMode === 'domain' && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Domain Configured</p>
                        <p className="text-sm text-gray-600">{customDomain || domain} is now set up with all DNS records</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Email Provider Connected</p>
                    <p className="text-sm text-gray-600">{email} is ready to send emails</p>
                  </div>
                </div>
                {setupMode === 'domain' && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Authentication Verified</p>
                      <p className="text-sm text-gray-600">SPF, DKIM, and DMARC records are configured</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> Send a test email to verify everything is working correctly before launching campaigns.
                </p>
              </div>

              <div className="flex gap-3">
                <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700" variant="default">
                      <Send className="h-4 w-4 mr-2" />
                      Send Test Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Test Email</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="test-recipient">Recipient Email Address</Label>
                        <Input
                          id="test-recipient"
                          type="email"
                          placeholder="recipient@example.com"
                          value={testEmailRecipient}
                          onChange={(e) => setTestEmailRecipient(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <Button
                        onClick={handleSendTestEmail}
                        disabled={sendingTestEmail}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Link href="/campaigns" className="flex-1">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Go to Campaigns
                  </Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
