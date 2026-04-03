import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailTemplateBuilder, EmailTemplate } from '@/components/EmailTemplateBuilder';
import { Mail, Settings, BarChart3, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailMarketing() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  // Fetch email provider config
  const emailConfigQuery = trpc.emailProvider.getConfig.useQuery();

  // Save template mutation
  const saveTemplateMutation = trpc.emailProvider.saveTemplate.useMutation({
    onSuccess: () => {
      toast.success('Template saved successfully!');
      // Refresh templates list
      emailConfigQuery.refetch();
    },
  });

  // Send campaign mutation
  const sendCampaignMutation = trpc.campaignEmail.sendCampaignToAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Campaign sent to ${data.sentCount} recipients!`);
    },
  });

  const handleSaveTemplate = (template: EmailTemplate) => {
    saveTemplateMutation.mutate(template);
    setSelectedTemplate(null);
  };

  const isEmailConfigured = emailConfigQuery.data?.configured;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Mail className="h-10 w-10 text-blue-600" />
            Email Marketing Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Create, manage, and send email campaigns with ease
          </p>
        </div>

        {/* Email Configuration Alert */}
        {!isEmailConfigured && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold text-amber-900 mb-1">Email Provider Not Configured</p>
                <p className="text-sm text-amber-800">
                  Set up your email provider to start sending campaigns
                </p>
              </div>
              <Button
                onClick={() => setActiveTab('settings')}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Configure Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Email Templates</h2>
              <Button
                onClick={() => setSelectedTemplate(null)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                Create New Template
              </Button>
            </div>

            {selectedTemplate ? (
              <EmailTemplateBuilder
                initialTemplate={selectedTemplate}
                onSave={handleSaveTemplate}
              />
            ) : (
              <>
                {templates.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground mb-2">No templates yet</p>
                      <p className="text-muted-foreground mb-4">
                        Create your first email template to get started
                      </p>
                      <Button
                        onClick={() => setSelectedTemplate({} as EmailTemplate)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Create Template
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(template => (
                      <Card key={template.id} className="hover:border-blue-400 cursor-pointer">
                        <CardHeader>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Subject: {template.subject}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Blocks: {template.blocks?.length || 0}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setSelectedTemplate(template)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Use
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Campaigns</h2>
              <Button
                disabled={!isEmailConfigured}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>

            {!isEmailConfigured ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">Email not configured</p>
                  <p className="text-muted-foreground mb-4">
                    Configure your email provider in Settings to send campaigns
                  </p>
                  <Button
                    onClick={() => setActiveTab('settings')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Settings
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Campaigns coming soon...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Campaign Analytics</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">Email Settings</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Email provider settings will be configured here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
