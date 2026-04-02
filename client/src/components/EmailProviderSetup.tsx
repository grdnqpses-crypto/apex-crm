import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2, AlertCircle, RefreshCw, Lock, Mail, ExternalLink, Eye, EyeOff
} from "lucide-react";

interface EmailProviderSetupProps {
  onComplete?: (provider: string, email: string) => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

export function EmailProviderSetup({ onComplete, onSkip, showSkip = true }: EmailProviderSetupProps) {
  const [step, setStep] = useState<"select" | "oauth_gmail" | "oauth_office365" | "smtp" | "complete">("select");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [smtpForm, setSmtpForm] = useState({
    email: "",
    displayName: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    smtpTls: true,
    showPassword: false,
  });
  const [testing, setTesting] = useState(false);
  const [oauthPending, setOauthPending] = useState(false);
  const oauthPopupRef = useRef<Window | null>(null);

  const { data: providers = [] } = trpc.emailProvider.getProviders.useQuery();
  const { data: currentConfig } = trpc.emailProvider.getEmailConfig.useQuery();
  const startGmailOAuth = trpc.emailProvider.startGmailOAuth.useMutation();
  const completeGmailOAuth = trpc.emailProvider.completeGmailOAuth.useMutation();
  const startOffice365OAuth = trpc.emailProvider.startOffice365OAuth.useMutation();
  const completeOffice365OAuth = trpc.emailProvider.completeOffice365OAuth.useMutation();
  const configureSmtp = trpc.emailProvider.configureCustomSMTP.useMutation();
  const testConnection = trpc.emailProvider.testConnection.useMutation();

  // Listen for OAuth callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "email_oauth_callback") {
        oauthPopupRef.current?.close();

        if (event.data.error) {
          toast.error(`OAuth failed: ${event.data.error}`);
          setOauthPending(false);
          return;
        }

        if (selectedProvider === "gmail" && event.data.code) {
          completeGmailOAuth.mutate(
            {
              code: event.data.code,
              redirectUri: `${window.location.origin}/email-oauth-callback`,
            },
            {
              onSuccess: (result) => {
                toast.success(result.message);
                setStep("complete");
                onComplete?.(result.provider, result.email);
              },
              onError: (err) => {
                toast.error(`Failed: ${err.message}`);
                setOauthPending(false);
              },
            }
          );
        } else if (selectedProvider === "office365" && event.data.code) {
          completeOffice365OAuth.mutate(
            {
              code: event.data.code,
              redirectUri: `${window.location.origin}/email-oauth-callback`,
            },
            {
              onSuccess: (result) => {
                toast.success(result.message);
                setStep("complete");
                onComplete?.(result.provider, result.email);
              },
              onError: (err) => {
                toast.error(`Failed: ${err.message}`);
                setOauthPending(false);
              },
            }
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [selectedProvider]);

  const handleGmailConnect = async () => {
    try {
      setOauthPending(true);
      const result = await startGmailOAuth.mutateAsync({
        redirectUri: `${window.location.origin}/email-oauth-callback`,
      });

      const popup = window.open(result.authUrl, "email_oauth", "width=600,height=700,scrollbars=yes");
      oauthPopupRef.current = popup;

      // Poll for popup closure
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          setOauthPending(false);
        }
      }, 500);
    } catch (error) {
      toast.error(`Failed to start Gmail OAuth: ${String(error)}`);
      setOauthPending(false);
    }
  };

  const handleOffice365Connect = async () => {
    try {
      setOauthPending(true);
      const result = await startOffice365OAuth.mutateAsync({
        redirectUri: `${window.location.origin}/email-oauth-callback`,
      });

      const popup = window.open(result.authUrl, "email_oauth", "width=600,height=700,scrollbars=yes");
      oauthPopupRef.current = popup;

      // Poll for popup closure
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          setOauthPending(false);
        }
      }, 500);
    } catch (error) {
      toast.error(`Failed to start Office 365 OAuth: ${String(error)}`);
      setOauthPending(false);
    }
  };

  const handleSmtpSubmit = async () => {
    try {
      setTesting(true);
      await configureSmtp.mutateAsync({
        email: smtpForm.email,
        displayName: smtpForm.displayName,
        smtpHost: smtpForm.smtpHost,
        smtpPort: smtpForm.smtpPort,
        smtpUsername: smtpForm.smtpUsername,
        smtpPassword: smtpForm.smtpPassword,
        smtpTls: smtpForm.smtpTls,
      });

      toast.success("SMTP configured successfully!");
      setStep("complete");
      onComplete?.("custom_smtp", smtpForm.email);
    } catch (error) {
      toast.error(`SMTP configuration failed: ${String(error)}`);
    } finally {
      setTesting(false);
    }
  };

  // Already configured
  if (currentConfig?.isVerified) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Email Configured</p>
            <p className="text-sm text-green-700 mt-1">
              {currentConfig.provider === "gmail" && "Gmail"}
              {currentConfig.provider === "office365" && "Office 365"}
              {currentConfig.provider === "custom_smtp" && "Custom SMTP"}
              {" "}: {currentConfig.email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step: Select Provider
  if (step === "select") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Choose Your Email Provider</h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect your email account to send campaigns and automated emails from AXIOM
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {providers.map((provider) => (
            <Card
              key={provider.provider}
              className={`cursor-pointer transition-all border-2 ${
                selectedProvider === provider.provider
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-orange-300"
              }`}
              onClick={() => {
                setSelectedProvider(provider.provider);
                if (provider.provider === "gmail") setStep("oauth_gmail");
                else if (provider.provider === "office365") setStep("oauth_office365");
                else setStep("smtp");
              }}
            >
              <CardContent className="p-4 space-y-3">
                <div className="text-3xl">{provider.icon}</div>
                <div>
                  <p className="font-semibold text-gray-900">{provider.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{provider.description}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {provider.authMethod === "oauth" ? "1-Click" : "Manual"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {showSkip && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={onSkip}>
              Skip for Now
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Step: Gmail OAuth
  if (step === "oauth_gmail") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setStep("select")}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="text-center space-y-4">
          <div className="text-5xl">📧</div>
          <div>
            <h3 className="font-semibold text-gray-900">Connect Gmail</h3>
            <p className="text-sm text-gray-500 mt-1">Send emails from your Gmail account</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-blue-900">What happens next:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ You'll be redirected to Google to authorize AXIOM</li>
            <li>✓ We'll securely store your Gmail access token</li>
            <li>✓ Your emails will be sent from your Gmail account</li>
          </ul>
        </div>

        <Button
          onClick={handleGmailConnect}
          disabled={oauthPending}
          className="w-full"
          size="lg"
        >
          {oauthPending ? "Opening..." : "Connect Gmail"}
        </Button>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">
            Your password is never stored. AXIOM uses OAuth tokens for secure access.
          </p>
        </div>
      </div>
    );
  }

  // Step: Office 365 OAuth
  if (step === "oauth_office365") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setStep("select")}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="text-center space-y-4">
          <div className="text-5xl">📨</div>
          <div>
            <h3 className="font-semibold text-gray-900">Connect Office 365</h3>
            <p className="text-sm text-gray-500 mt-1">Send emails from your Office 365 account</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-blue-900">What happens next:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ You'll be redirected to Microsoft to authorize AXIOM</li>
            <li>✓ We'll securely store your Office 365 access token</li>
            <li>✓ Your emails will be sent from your Office 365 account</li>
          </ul>
        </div>

        <Button
          onClick={handleOffice365Connect}
          disabled={oauthPending}
          className="w-full"
          size="lg"
        >
          {oauthPending ? "Opening..." : "Connect Office 365"}
        </Button>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">
            Your password is never stored. AXIOM uses OAuth tokens for secure access.
          </p>
        </div>
      </div>
    );
  }

  // Step: Custom SMTP
  if (step === "smtp") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setStep("select")}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Configure Custom SMTP</h3>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              placeholder="your-email@example.com"
              value={smtpForm.email}
              onChange={(e) => setSmtpForm({ ...smtpForm, email: e.target.value })}
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label>Display Name (optional)</Label>
            <Input
              placeholder="Your Name"
              value={smtpForm.displayName}
              onChange={(e) => setSmtpForm({ ...smtpForm, displayName: e.target.value })}
            />
          </div>

          {/* SMTP Host */}
          <div className="space-y-2">
            <Label>SMTP Host</Label>
            <Input
              placeholder="smtp.gmail.com"
              value={smtpForm.smtpHost}
              onChange={(e) => setSmtpForm({ ...smtpForm, smtpHost: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              Examples: smtp.gmail.com, smtp.sendgrid.net, smtp.postmarkapp.com
            </p>
          </div>

          {/* SMTP Port */}
          <div className="space-y-2">
            <Label>SMTP Port</Label>
            <Input
              type="number"
              placeholder="587"
              value={smtpForm.smtpPort}
              onChange={(e) => setSmtpForm({ ...smtpForm, smtpPort: parseInt(e.target.value) })}
            />
            <p className="text-xs text-gray-500">
              Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)
            </p>
          </div>

          {/* SMTP Username */}
          <div className="space-y-2">
            <Label>SMTP Username</Label>
            <Input
              placeholder="your-email@example.com"
              value={smtpForm.smtpUsername}
              onChange={(e) => setSmtpForm({ ...smtpForm, smtpUsername: e.target.value })}
            />
          </div>

          {/* SMTP Password */}
          <div className="space-y-2">
            <Label>SMTP Password</Label>
            <div className="relative">
              <Input
                type={smtpForm.showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={smtpForm.smtpPassword}
                onChange={(e) => setSmtpForm({ ...smtpForm, smtpPassword: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setSmtpForm({ ...smtpForm, showPassword: !smtpForm.showPassword })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {smtpForm.showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* TLS Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="smtpTls"
              checked={smtpForm.smtpTls}
              onChange={(e) => setSmtpForm({ ...smtpForm, smtpTls: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="smtpTls" className="cursor-pointer">
              Use TLS encryption
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSmtpSubmit}
            disabled={testing || !smtpForm.email || !smtpForm.smtpHost || !smtpForm.smtpUsername || !smtpForm.smtpPassword}
            className="w-full"
            size="lg"
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Configure SMTP
              </>
            )}
          </Button>
        </div>

        {/* Common Providers */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium text-gray-600">Common Providers:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p>• <strong>SendGrid:</strong> smtp.sendgrid.net:587</p>
            <p>• <strong>Postmark:</strong> smtp.postmarkapp.com:587</p>
            <p>• <strong>Mailgun:</strong> smtp.mailgun.org:587</p>
            <p>• <strong>AWS SES:</strong> email-smtp.{region}.amazonaws.com:587</p>
          </div>
        </div>
      </div>
    );
  }

  // Step: Complete
  if (step === "complete") {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Email Provider Connected</p>
            <p className="text-sm text-green-700 mt-1">
              Your email account is ready to use. You can now send campaigns and automated emails.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
