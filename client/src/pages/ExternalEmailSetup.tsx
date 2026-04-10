import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

const customEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type CustomEmailFormData = z.infer<typeof customEmailSchema>;

export function ExternalEmailSetup() {
  const [activeTab, setActiveTab] = useState('oauth');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);

  const form = useForm<CustomEmailFormData>({
    resolver: zodResolver(customEmailSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // tRPC mutations
  const connectGoogleMutation = trpc.email.connectGoogleOAuth.useMutation();
  const connectMicrosoftMutation = trpc.email.connectMicrosoftOAuth.useMutation();
  const autoDiscoverMutation = trpc.email.autoDiscoverAndConnect.useMutation();

  const handleGoogleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await connectGoogleMutation.mutateAsync({});
      if (result.authUrl) {
        window.open(result.authUrl, '_blank', 'width=500,height=600');
        toast.success('Opening Google OAuth login...');
      }
    } catch (error) {
      toast.error('Failed to initiate Google OAuth');
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleMicrosoftConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await connectMicrosoftMutation.mutateAsync({});
      if (result.authUrl) {
        window.open(result.authUrl, '_blank', 'width=500,height=600');
        toast.success('Opening Microsoft OAuth login...');
      }
    } catch (error) {
      toast.error('Failed to initiate Microsoft OAuth');
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const onCustomEmailSubmit = async (data: CustomEmailFormData) => {
    setIsConnecting(true);
    try {
      const result = await autoDiscoverMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        toast.success(`Connected ${data.email} successfully!`);
        setConnectedAccounts([...connectedAccounts, data.email]);
        form.reset();
        setActiveTab('oauth'); // Switch back to OAuth tab
      } else {
        toast.error(result.error || 'Failed to connect email account');
      }
    } catch (error) {
      toast.error('AutoDiscover failed. Please check your credentials.');
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connect Your Email</h1>
        <p className="text-muted-foreground mt-2">
          Connect your existing email accounts to sync messages directly into Axiom CRM
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="oauth">OAuth (Recommended)</TabsTrigger>
          <TabsTrigger value="custom">Custom Domain</TabsTrigger>
        </TabsList>

        <TabsContent value="oauth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>One-Click OAuth Connection</CardTitle>
              <CardDescription>
                Connect your Gmail or Outlook account securely with one click
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connected Accounts */}
              {connectedAccounts.length > 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>{connectedAccounts.length}</strong> account(s) connected
                  </AlertDescription>
                </Alert>
              )}

              {/* Google OAuth Button */}
              <Button
                onClick={handleGoogleConnect}
                disabled={isConnecting || connectGoogleMutation.isPending}
                className="w-full h-12 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {isConnecting || connectGoogleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-5 w-5" />
                    Connect Google Workspace / Gmail
                  </>
                )}
              </Button>

              {/* Microsoft OAuth Button */}
              <Button
                onClick={handleMicrosoftConnect}
                disabled={isConnecting || connectMicrosoftMutation.isPending}
                className="w-full h-12 bg-[#0078D4] hover:bg-[#106EBE] text-white"
              >
                {isConnecting || connectMicrosoftMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-5 w-5" />
                    Connect Microsoft 365 / Outlook
                  </>
                )}
              </Button>

              {/* Info Box */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Secure:</strong> Your credentials are encrypted and never stored in plain text. We use industry-standard OAuth 2.0 for authentication.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain Email</CardTitle>
              <CardDescription>
                Connect your custom domain email (IMAP/SMTP). We'll auto-discover your server settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCustomEmailSubmit)} className="space-y-4">
                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="user@company.com"
                            type="email"
                            {...field}
                            disabled={isConnecting}
                          />
                        </FormControl>
                        <FormDescription>
                          Your full email address (e.g., john@company.com)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password Field */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type="password"
                            {...field}
                            disabled={isConnecting}
                          />
                        </FormControl>
                        <FormDescription>
                          Your email password (encrypted and never stored)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Info Box */}
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>AutoDiscover:</strong> We'll automatically detect your IMAP/SMTP server settings based on your email domain.
                    </AlertDescription>
                  </Alert>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isConnecting || autoDiscoverMutation.isPending}
                  >
                    {isConnecting || autoDiscoverMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Connect Email Account
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connected Accounts List */}
      {connectedAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {connectedAccounts.map((email) => (
                <div key={email} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{email}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Syncing...</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
