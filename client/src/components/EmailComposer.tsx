import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { X, Send, Paperclip, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: EmailData) => Promise<void>;
  defaultFrom?: string;
  defaultTo?: string;
  isLoading?: boolean;
}

export interface EmailData {
  to: string;
  from: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  attachments?: File[];
}

export function EmailComposer({
  isOpen,
  onClose,
  onSend,
  defaultFrom = '',
  defaultTo = '',
  isLoading = false,
}: EmailComposerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [email, setEmail] = useState<EmailData>({
    to: defaultTo,
    from: defaultFrom,
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    attachments: [],
  });
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSend = async () => {
    if (!email.to.trim()) {
      toast.error('Please enter a recipient email');
      return;
    }
    if (!email.from.trim()) {
      toast.error('Please enter a sender email');
      return;
    }
    if (!email.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    try {
      await onSend({
        ...email,
        attachments,
      });
      // Reset form
      setEmail({
        to: defaultTo,
        from: defaultFrom,
        cc: '',
        bcc: '',
        subject: '',
        body: '',
        attachments: [],
      });
      setAttachments([]);
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-lg font-semibold">Compose Email</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {!isMinimized && (
          <>
            {/* Email Fields */}
            <div className="px-6 py-4 space-y-4 border-b">
              {/* From */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">From</label>
                <Input
                  type="email"
                  value={email.from}
                  onChange={(e) => setEmail({ ...email, from: e.target.value })}
                  placeholder="sender@example.com"
                  className="bg-gray-50"
                />
              </div>

              {/* To */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">To</label>
                <Input
                  type="email"
                  value={email.to}
                  onChange={(e) => setEmail({ ...email, to: e.target.value })}
                  placeholder="recipient@example.com"
                  className="bg-gray-50"
                />
              </div>

              {/* CC/BCC Toggle */}
              {!showCcBcc && (
                <button
                  onClick={() => setShowCcBcc(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + CC/BCC
                </button>
              )}

              {/* CC */}
              {showCcBcc && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">CC</label>
                  <Input
                    type="email"
                    value={email.cc}
                    onChange={(e) => setEmail({ ...email, cc: e.target.value })}
                    placeholder="cc@example.com"
                    className="bg-gray-50"
                  />
                </div>
              )}

              {/* BCC */}
              {showCcBcc && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">BCC</label>
                  <Input
                    type="email"
                    value={email.bcc}
                    onChange={(e) => setEmail({ ...email, bcc: e.target.value })}
                    placeholder="bcc@example.com"
                    className="bg-gray-50"
                  />
                </div>
              )}

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <Input
                  type="text"
                  value={email.subject}
                  onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                  placeholder="Email subject"
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Email Body */}
            <div className="px-6 py-4 border-b">
              <Textarea
                value={email.body}
                onChange={(e) => setEmail({ ...email, body: e.target.value })}
                placeholder="Write your message here..."
                className="min-h-[300px] bg-gray-50 resize-none"
              />
            </div>

            {/* Attachments */}
            <div className="px-6 py-4 border-b space-y-3">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600">
                  Attach Files
                  <input
                    type="file"
                    multiple
                    onChange={handleAttachmentChange}
                    className="hidden"
                  />
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                    >
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Actions */}
            <DialogFooter className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {attachments.length > 0 && `${attachments.length} file(s) attached`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Discard
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}

        {isMinimized && (
          <div className="px-6 py-4 text-center text-sm text-gray-600">
            Email composer minimized
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
