import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { OneClickSetup } from '@/components/OneClickSetup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap } from 'lucide-react';
import { Link } from 'wouter';

export default function SetupDomainPage() {
  const { user } = useAuth();
  const [domain] = useState('gareversal.com');
  const [email] = useState('crypto@gareversal.com');
  const [emailProvider] = useState<'office365' | 'gmail' | 'custom'>('office365');
  const [setupComplete, setSetupComplete] = useState(false);

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
                One-Click Domain & Email Setup
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically configure your domain and email provider
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!setupComplete ? (
          <OneClickSetup
            domain={domain}
            email={email}
            emailProvider={emailProvider}
            onComplete={() => setSetupComplete(true)}
          />
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
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Domain Configured</p>
                    <p className="text-sm text-gray-600">{domain} is now set up with all DNS records</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Email Provider Connected</p>
                    <p className="text-sm text-gray-600">{email} is ready to send emails</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Authentication Verified</p>
                    <p className="text-sm text-gray-600">SPF, DKIM, and DMARC records are configured</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Next Steps:</strong> You can now start sending campaigns through AXIOM CRM. Your domain is fully authenticated and ready for email delivery.
                </p>
              </div>

              <div className="flex gap-3">
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
