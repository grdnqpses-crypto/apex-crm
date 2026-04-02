import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Globe,
  Key,
  Loader2,
  Copy,
  ExternalLink,
  Shield,
  Zap,
} from 'lucide-react';

interface SetupDomainProps {
  onComplete?: (domain: string, provider: string) => void;
  onSkip?: () => void;
  showSkip?: boolean;
  migrationJobId?: string;
}

type Step = 'domain-entry' | 'provider-detection' | 'records-generated' | 'godaddy-auth' | 'configuring' | 'verifying' | 'complete';

export const SetupDomain: React.FC<SetupDomainProps> = ({
  onComplete,
  onSkip,
  showSkip = false,
  migrationJobId,
}) => {
  const [step, setStep] = useState<Step>('domain-entry');
  const [domain, setDomain] = useState('');
  const [dkimSelector, setDkimSelector] = useState('default');
  const [provider, setProvider] = useState<any>(null);
  const [records, setRecords] = useState<any>(null);
  const [propagationStatus, setPropagationStatus] = useState<any>(null);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);

  const detectProvider = trpc.dns.detectProvider.useMutation();
  const generateRecords = trpc.dns.generateRecords.useMutation();
  const configureDNS = trpc.dns.configureDNSRecords.useMutation();
  const checkPropagation = trpc.dns.checkPropagation.useQuery(
    {
      domain,
      recordType: 'TXT',
      recordName: '@',
      jobId: migrationJobId,
    },
    { enabled: step === 'verifying', refetchInterval: 5000 }
  );

  const handleDetectProvider = async () => {
    if (!domain) {
      toast.error('Please enter a domain');
      return;
    }

    setStep('provider-detection');
    try {
      const result = await detectProvider.mutateAsync({ domain });
      setProvider(result);

      // Generate DNS records
      const recordsResult = await generateRecords.mutateAsync({
        domain,
        dkimSelector,
      });
      setRecords(recordsResult);
      setStep('records-generated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to detect provider');
      setStep('domain-entry');
    }
  };

  const handleConfigureDNS = async () => {
    if (!records) return;

    setStep('configuring');
    try {
      // For GoDaddy, we would need API credentials
      // In a real implementation, this would trigger OAuth flow
      await configureDNS.mutateAsync({
        domain,
        apiKey: 'demo-key', // In production, get from OAuth
        apiSecret: 'demo-secret', // In production, get from OAuth
        records: records.records,
        jobId: migrationJobId,
      });

      setStep('verifying');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to configure DNS');
      setStep('records-generated');
    }
  };

  const handleComplete = () => {
    onComplete?.(domain, provider?.registrar || 'unknown');
  };

  const copyToClipboard = (text: string, recordType: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRecord(recordType);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  // Step 1: Domain Entry
  if (step === 'domain-entry') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Setup Email Domain</h2>
          <p className="text-gray-600">
            Configure your domain for email sending. We'll automatically detect your DNS provider and set up authentication records.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="domain" className="text-sm font-medium">
                Domain Name
              </Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your domain (e.g., company.com)
              </p>
            </div>

            <div>
              <Label htmlFor="dkim-selector" className="text-sm font-medium">
                DKIM Selector (Optional)
              </Label>
              <Input
                id="dkim-selector"
                placeholder="default"
                value={dkimSelector}
                onChange={(e) => setDkimSelector(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for DKIM record identification
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={handleDetectProvider}
            disabled={!domain || detectProvider.isPending}
            size="lg"
            className="flex-1"
          >
            {detectProvider.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Auto-Setup Domain
              </>
            )}
          </Button>
          {showSkip && (
            <Button
              onClick={onSkip}
              variant="outline"
              size="lg"
            >
              Skip for Now
            </Button>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex gap-2">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">What we'll do:</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                <li>Detect your DNS provider automatically</li>
                <li>Generate SPF, DKIM, and DMARC records</li>
                <li>Configure records on your DNS provider</li>
                <li>Verify global DNS propagation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Provider Detection
  if (step === 'provider-detection') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Detecting DNS Provider...</h2>
          <p className="text-gray-600">
            We're analyzing your domain to identify your DNS provider
          </p>
        </div>
      </div>
    );
  }

  // Step 3: Records Generated
  if (step === 'records-generated' && records && provider) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">DNS Records Ready</h2>
          <p className="text-gray-600">
            We detected your DNS provider: <Badge>{provider.registrar}</Badge>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email Authentication Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {records.records.map((record: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4 space-y-2 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm font-semibold">
                    {record.type} Record ({record.name === '@' ? 'Root' : record.name})
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(record.data, record.type)}
                  >
                    {copiedRecord === record.type ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                  {record.data}
                </div>
              </div>
            ))}

            {records.dkimPrivateKey && (
              <div className="border-t pt-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-900">
                      <p className="font-semibold">Save Your DKIM Private Key</p>
                      <p className="mt-1 text-xs">
                        You'll need this to configure email sending. Store it securely.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => copyToClipboard(records.dkimPrivateKey, 'DKIM_KEY')}
                      >
                        Copy Private Key
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={handleConfigureDNS}
            disabled={configureDNS.isPending}
            size="lg"
            className="flex-1"
          >
            {configureDNS.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Configuring...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Configure DNS Records
              </>
            )}
          </Button>
              <Button
                onClick={() => setStep('domain-entry')}
                variant="outline"
                size="lg"
              >
                Back
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold">Multi-Provider Support</p>
                  <p className="mt-1 text-xs">We support GoDaddy, Namecheap, Route53, Cloudflare, and Google Domains</p>
                </div>
              </div>
            </div>
      </div>
    );
  }

  // Step 4: Verifying
  if (step === 'verifying') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Verifying DNS Records</h2>
          <p className="text-gray-600">
            Checking DNS propagation across global resolvers...
          </p>
        </div>

        {checkPropagation.data && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Global Propagation</span>
                  <span className="text-lg font-bold">{checkPropagation.data.globalProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${checkPropagation.data.globalProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {checkPropagation.data.results.map((result: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{result.resolver}</span>
                    {result.status === 'found' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : result.status === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>

              {checkPropagation.data.allPropagated && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-900">DNS Fully Propagated!</p>
                </div>
              )}

              {!checkPropagation.data.allPropagated && (
                <div className="text-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Estimated time remaining: {Math.round(checkPropagation.data.estimatedTimeRemaining / 60)} minutes
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {checkPropagation.data?.allPropagated && (
          <Button
            onClick={() => {
              setStep('complete');
              onComplete?.(domain);
            }}
            size="lg"
            className="w-full"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Complete Setup
          </Button>
        )}
      </div>
    );
  }

  // Step 5: Complete
  if (step === 'complete') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Domain Setup Complete!</h2>
          <p className="text-gray-600">
            Your domain {domain} is now configured for email sending
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-2">
          <p className="font-semibold text-green-900">What's next:</p>
          <ul className="text-left space-y-1 text-sm text-green-800">
            <li>✓ Email authentication configured (SPF, DKIM, DMARC)</li>
            <li>✓ Domain reputation monitoring enabled</li>
            <li>✓ Ready to send campaigns</li>
          </ul>
        </div>

        <Button
          onClick={() => onComplete?.(domain)}
          size="lg"
          className="w-full"
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return null;
};
