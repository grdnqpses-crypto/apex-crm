import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, X } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailCompose() {
  const { user } = useAuth();
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendEmailMutation = trpc.emailProvider.sendEmail.useMutation({
    onSuccess: () => {
      toast.success('Email sent successfully!');
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setIsSending(false);
    },
    onError: (error) => {
      toast.error(`Failed to send email: ${error.message}`);
      setIsSending(false);
    },
  });

  const handleSend = async () => {
    if (!to.trim()) {
      toast.error('Please enter a recipient email address');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    setIsSending(true);
    sendEmailMutation.mutate({
      to: to.trim(),
      cc: cc.trim() ? cc.split(',').map(e => e.trim()) : [],
      bcc: bcc.trim() ? bcc.split(',').map(e => e.trim()) : [],
      subject: subject.trim(),
      body: body.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Mail className="h-10 w-10 text-blue-600" />
            Compose Email
          </h1>
          <p className="text-muted-foreground mt-2">
            Send a new email directly from your CRM
          </p>
        </div>

        {/* Compose Card */}
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle>New Email</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* To Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                To <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the recipient's email address
              </p>
            </div>

            {/* CC Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                CC
              </label>
              <Input
                placeholder="cc@example.com (separate multiple with commas)"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="w-full"
              />
            </div>

            {/* BCC Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                BCC
              </label>
              <Input
                placeholder="bcc@example.com (separate multiple with commas)"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Subject Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Body Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Write your message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full min-h-64 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setTo('');
                  setCc('');
                  setBcc('');
                  setSubject('');
                  setBody('');
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
                {isSending ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> Make sure your email provider is configured in Email Marketing → Settings before sending emails.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
