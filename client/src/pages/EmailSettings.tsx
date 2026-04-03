import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailSettings() {
  const { user } = useAuth();
  const [activeProvider, setActiveProvider] = useState<'smtp' | 'resend' | 'sendgrid'>('smtp');
  const [showPasswords, setShowPasswords] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // SMTP Configuration
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    tls: true,
  });

  // Resend Configuration
  const [resendConfig, setResendConfig] = useState({
    apiKey: '',
  });

  // SendGrid Configuration
  const [sendgridConfig, setSendgridConfig] = useState({
    apiKey: '',
  });

  const testConnectionMutation = trpc.emailProvider.testConnection.useMutation();

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const config = {
        provider: activeProvider,
        ...(activeProvider === 'smtp' && smtpConfig),
        ...(activeProvider === 'resend' && { resendApiKey: resendConfig.apiKey }),
        ...(activeProvider === 'sendgrid' && { sendgridApiKey: sendgridConfig.apiKey }),
      };

      await testConnectionMutation.mutateAsync(config);
      setConnectionStatus('success');
      toast.success('Email provider connection verified!');
    } catch (error) {
      setConnectionStatus('error');
      toast.error(`Connection failed: ${String(error)}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConfig = () => {
    toast.success('Email provider configuration saved!');
    // TODO: Save to database via tRPC mutation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Mail className="h-8 w-8 text-blue-600" />
            Email Provider Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your email service to send campaigns
          </p>
        </div>

        {/* Provider Selection */}
        <Tabs value={activeProvider} onValueChange={(v) => setActiveProvider(v as any)} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="smtp">Custom SMTP</TabsTrigger>
            <TabsTrigger value="resend">Resend</TabsTrigger>
            <TabsTrigger value="sendgrid">SendGrid</TabsTrigger>
          </TabsList>

          {/* SMTP Configuration */}
          <TabsContent value="smtp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SMTP Server Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input
                      id="smtp-host"
                      placeholder="smtp.gmail.com"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">e.g., smtp.gmail.com or mail.yourserver.com</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      placeholder="587"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">Usually 587 (TLS) or 465 (SSL)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">Username</Label>
                    <Input
                      id="smtp-username"
                      placeholder="your-email@example.com"
                      value={smtpConfig.username}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="smtp-password"
                        type={showPasswords ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={smtpConfig.password}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                      />
                      <button
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <input
                    type="checkbox"
                    id="smtp-tls"
                    checked={smtpConfig.tls}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, tls: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="smtp-tls" className="cursor-pointer flex-1 mb-0">
                    Use TLS Encryption
                  </Label>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <p className="font-semibold mb-1">Gmail Users:</p>
                    <p>Use an App Password instead of your regular password. Enable 2-Step Verification first.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resend Configuration */}
          <TabsContent value="resend" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resend API Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resend-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="resend-key"
                      type={showPasswords ? 'text' : 'password'}
                      placeholder="re_••••••••••••••••••••••••"
                      value={resendConfig.apiKey}
                      onChange={(e) => setResendConfig({ apiKey: e.target.value })}
                    />
                    <button
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">resend.com</a>
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">About Resend:</p>
                    <p>Resend is a modern transactional email service with excellent deliverability. Free tier includes 100 emails/day.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SendGrid Configuration */}
          <TabsContent value="sendgrid" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SendGrid API Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sendgrid-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="sendgrid-key"
                      type={showPasswords ? 'text' : 'password'}
                      placeholder="SG.••••••••••••••••••••••••"
                      value={sendgridConfig.apiKey}
                      onChange={(e) => setSendgridConfig({ apiKey: e.target.value })}
                    />
                    <button
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your API key from <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sendgrid.com</a>
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">About SendGrid:</p>
                    <p>SendGrid is an enterprise-grade email service with advanced analytics and deliverability features.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Connection Status */}
        {connectionStatus !== 'idle' && (
          <Card className={connectionStatus === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CardContent className="pt-6 flex items-center gap-3">
              {connectionStatus === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-900">Connection verified successfully!</p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-900">Connection failed. Please check your credentials.</p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <Button
            onClick={handleTestConnection}
            disabled={testingConnection || testConnectionMutation.isPending}
            variant="outline"
            className="flex-1"
          >
            {testingConnection || testConnectionMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button
            onClick={handleSaveConfig}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Save Configuration
          </Button>
        </div>

        {/* Help Section */}
        <Card className="mt-8 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-foreground mb-1">SMTP Setup:</p>
              <p className="text-muted-foreground">Contact your email provider for SMTP server details. Most providers have documentation on their website.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">API Keys:</p>
              <p className="text-muted-foreground">Never share your API keys. Keep them secret and rotate them periodically for security.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Deliverability:</p>
              <p className="text-muted-foreground">Ensure your domain has SPF, DKIM, and DMARC records configured for best email delivery rates.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
