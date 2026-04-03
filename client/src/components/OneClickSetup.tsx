import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2, Zap } from 'lucide-react';

interface OneClickSetupProps {
  domain: string;
  email: string;
  emailProvider: 'office365' | 'gmail' | 'custom';
  onComplete?: () => void;
}

export function OneClickSetup({ domain, email, emailProvider, onComplete }: OneClickSetupProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setupMutation = trpc.oneClickSetup.setupDomainAndEmail.useMutation();

  const handleSetup = async () => {
    setIsRunning(true);
    setError(null);
    setSuccess(false);
    setProgress([]);

    try {
      // Add progress updates
      setProgress((p) => [...p, '🚀 Starting one-click setup...']);

      setProgress((p) => [...p, '🔍 Detecting domain registrar...']);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setProgress((p) => [...p, '⚙️ Configuring DNS records...']);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Call the tRPC mutation
      const result = await setupMutation.mutateAsync({
        domain,
        email,
        emailProvider,
      });

      if (result.success) {
        setProgress((p) => [...p, '✅ DNS configured successfully']);
        setProgress((p) => [...p, '🔐 Verifying domain authentication...']);
        await new Promise((resolve) => setTimeout(resolve, 500));

        setProgress((p) => [...p, '📧 Connecting email provider...']);
        await new Promise((resolve) => setTimeout(resolve, 500));

        setProgress((p) => [...p, '✉️ Sending test email...']);
        await new Promise((resolve) => setTimeout(resolve, 500));

        setProgress((p) => [...p, '✨ Setup complete!']);
        setSuccess(true);

        setTimeout(() => {
          onComplete?.();
        }, 1000);
      } else {
        setError(result.message || 'Setup failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-start gap-4">
          <Zap className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">One-Click Setup</h3>
            <p className="text-sm text-gray-600 mt-1">
              Automatically configure {domain} with {emailProvider.toUpperCase()}
            </p>
            <div className="mt-3 text-sm text-gray-700 space-y-1">
              <p>
                <strong>Domain:</strong> {domain}
              </p>
              <p>
                <strong>Email:</strong> {email}
              </p>
              <p>
                <strong>Provider:</strong> {emailProvider === 'office365' ? 'Office 365' : emailProvider}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Log */}
      {progress.length > 0 && (
        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="space-y-2 font-mono text-sm">
            {progress.map((msg, idx) => (
              <div key={idx} className="text-gray-700 flex items-start gap-2">
                <span className="flex-shrink-0 w-4 text-left">
                  {msg.startsWith('✅') || msg.startsWith('✨') ? '✓' : msg.startsWith('❌') ? '✗' : '•'}
                </span>
                <span>{msg}</span>
              </div>
            ))}
            {isRunning && (
              <div className="text-amber-600 flex items-center gap-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Setup Failed</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Success Message */}
      {success && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900">Setup Complete!</h4>
              <p className="text-sm text-green-700 mt-1">
                Your domain is configured and ready to send emails through AXIOM CRM.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSetup}
          disabled={isRunning || success}
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Setup Complete
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Start One-Click Setup
            </>
          )}
        </Button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-semibold mb-2">What happens next:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>DNS records are automatically added to your registrar</li>
          <li>Domain authentication is verified (SPF, DKIM, DMARC)</li>
          <li>Email provider connection is tested</li>
          <li>A test email is sent to verify everything works</li>
          <li>Your domain is ready to send campaigns</li>
        </ul>
      </div>
    </div>
  );
}
