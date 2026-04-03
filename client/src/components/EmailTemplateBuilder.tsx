import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Eye, Code, Save } from 'lucide-react';
import { toast } from 'sonner';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  blocks: EmailBlock[];
  htmlContent: string;
}

export interface EmailBlock {
  id: string;
  type: 'header' | 'text' | 'button' | 'image' | 'divider' | 'footer';
  content: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: 'left' | 'center' | 'right';
  url?: string;
  buttonText?: string;
}

interface EmailTemplateBuilderProps {
  onSave?: (template: EmailTemplate) => void;
  initialTemplate?: EmailTemplate;
}

const BLOCK_TEMPLATES: Record<string, Partial<EmailBlock>> = {
  header: {
    type: 'header',
    content: 'Welcome to Our Newsletter',
    backgroundColor: '#667eea',
    textColor: '#ffffff',
    alignment: 'center',
  },
  text: {
    type: 'text',
    content: 'Add your message here...',
    textColor: '#333333',
    alignment: 'left',
  },
  button: {
    type: 'button',
    buttonText: 'Click Here',
    url: 'https://example.com',
    backgroundColor: '#667eea',
    textColor: '#ffffff',
    alignment: 'center',
  },
  image: {
    type: 'image',
    content: 'https://via.placeholder.com/600x300',
    alignment: 'center',
  },
  divider: {
    type: 'divider',
    content: '',
  },
  footer: {
    type: 'footer',
    content: '© 2026 Your Company. All rights reserved.',
    textColor: '#999999',
    alignment: 'center',
  },
};

export function EmailTemplateBuilder({ onSave, initialTemplate }: EmailTemplateBuilderProps) {
  const [template, setTemplate] = useState<EmailTemplate>(
    initialTemplate || {
      id: Date.now().toString(),
      name: 'New Template',
      subject: 'Welcome to Our Newsletter',
      blocks: [],
      htmlContent: '',
    }
  );

  const [previewMode, setPreviewMode] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const addBlock = (blockType: keyof typeof BLOCK_TEMPLATES) => {
    const newBlock: EmailBlock = {
      id: Date.now().toString(),
      ...(BLOCK_TEMPLATES[blockType] as EmailBlock),
    };

    setTemplate({
      ...template,
      blocks: [...template.blocks, newBlock],
    });
  };

  const updateBlock = (blockId: string, updates: Partial<EmailBlock>) => {
    setTemplate({
      ...template,
      blocks: template.blocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      ),
    });
  };

  const deleteBlock = (blockId: string) => {
    setTemplate({
      ...template,
      blocks: template.blocks.filter(block => block.id !== blockId),
    });
  };

  const generateHTML = (): string => {
    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; }
            .email-container { max-width: 600px; margin: 0 auto; background-color: #f9fafb; }
            .email-block { padding: 20px; }
            .header { padding: 40px 20px; text-align: center; }
            .text { padding: 20px; line-height: 1.6; }
            .button { padding: 20px; text-align: center; }
            .button a { display: inline-block; padding: 12px 30px; text-decoration: none; border-radius: 4px; }
            .image { padding: 20px; text-align: center; }
            .image img { max-width: 100%; height: auto; }
            .divider { padding: 10px 20px; }
            .divider hr { border: none; border-top: 1px solid #ddd; }
            .footer { padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="email-container">
    `;

    template.blocks.forEach(block => {
      switch (block.type) {
        case 'header':
          html += `
            <div class="header" style="background-color: ${block.backgroundColor}; color: ${block.textColor}; text-align: ${block.alignment};">
              <h1 style="margin: 0; font-size: 28px;">${block.content}</h1>
            </div>
          `;
          break;
        case 'text':
          html += `
            <div class="text" style="color: ${block.textColor}; text-align: ${block.alignment};">
              ${block.content.replace(/\n/g, '<br>')}
            </div>
          `;
          break;
        case 'button':
          html += `
            <div class="button" style="text-align: ${block.alignment};">
              <a href="${block.url}" style="background-color: ${block.backgroundColor}; color: ${block.textColor};">
                ${block.buttonText}
              </a>
            </div>
          `;
          break;
        case 'image':
          html += `
            <div class="image" style="text-align: ${block.alignment};">
              <img src="${block.content}" alt="Email image" style="max-width: 100%;">
            </div>
          `;
          break;
        case 'divider':
          html += `<div class="divider"><hr></div>`;
          break;
        case 'footer':
          html += `
            <div class="footer" style="color: ${block.textColor}; text-align: ${block.alignment};">
              ${block.content}
            </div>
          `;
          break;
      }
    });

    html += `
          </div>
        </body>
      </html>
    `;

    return html;
  };

  const handleSave = () => {
    const htmlContent = generateHTML();
    const updatedTemplate = {
      ...template,
      htmlContent,
    };

    setTemplate(updatedTemplate);
    onSave?.(updatedTemplate);
    toast.success('Template saved successfully!');
  };

  const renderBlockPreview = (block: EmailBlock) => {
    switch (block.type) {
      case 'header':
        return (
          <div
            style={{
              backgroundColor: block.backgroundColor,
              color: block.textColor,
              padding: '30px',
              textAlign: block.alignment as any,
            }}
          >
            <h2 style={{ margin: 0, fontSize: '24px' }}>{block.content}</h2>
          </div>
        );
      case 'text':
        return (
          <div
            style={{
              padding: '20px',
              color: block.textColor,
              textAlign: block.alignment as any,
              whiteSpace: 'pre-wrap',
            }}
          >
            {block.content}
          </div>
        );
      case 'button':
        return (
          <div style={{ padding: '20px', textAlign: block.alignment as any }}>
            <button
              style={{
                backgroundColor: block.backgroundColor,
                color: block.textColor,
                padding: '12px 30px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              {block.buttonText}
            </button>
          </div>
        );
      case 'image':
        return (
          <div style={{ padding: '20px', textAlign: block.alignment as any }}>
            <img src={block.content} alt="Email" style={{ maxWidth: '100%', height: 'auto' }} />
          </div>
        );
      case 'divider':
        return <div style={{ padding: '10px 20px' }}><hr /></div>;
      case 'footer':
        return (
          <div
            style={{
              padding: '20px',
              color: block.textColor,
              textAlign: block.alignment as any,
              fontSize: '12px',
            }}
          >
            {block.content}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Name & Subject */}
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Template Name</label>
            <Input
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              placeholder="My Email Template"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Subject</label>
            <Input
              value={template.subject}
              onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
              placeholder="Email subject line"
            />
          </div>
        </CardContent>
      </Card>

      {/* Builder Tabs */}
      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="html">HTML</TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-4">
          {/* Add Block Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Blocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.keys(BLOCK_TEMPLATES).map(blockType => (
                  <Button
                    key={blockType}
                    onClick={() => addBlock(blockType as keyof typeof BLOCK_TEMPLATES)}
                    variant="outline"
                    size="sm"
                    className="capitalize"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {blockType}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blocks List */}
          <div className="space-y-3">
            {template.blocks.map((block, index) => (
              <Card key={block.id} className="cursor-pointer hover:border-blue-400">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1" onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}>
                      <div className="text-sm font-medium capitalize mb-2">{block.type} Block #{index + 1}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {block.content?.substring(0, 60) || block.buttonText || 'Empty block'}
                      </div>
                    </div>
                    <Button
                      onClick={() => deleteBlock(block.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Edit Block Form */}
                  {editingBlockId === block.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {block.type === 'text' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Content</label>
                          <Textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            rows={4}
                          />
                        </div>
                      )}

                      {block.type === 'header' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Header Text</label>
                            <Input
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Background Color</label>
                              <input
                                type="color"
                                value={block.backgroundColor || '#667eea'}
                                onChange={(e) => updateBlock(block.id, { backgroundColor: e.target.value })}
                                className="w-full h-10 rounded border"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Text Color</label>
                              <input
                                type="color"
                                value={block.textColor || '#ffffff'}
                                onChange={(e) => updateBlock(block.id, { textColor: e.target.value })}
                                className="w-full h-10 rounded border"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {block.type === 'button' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Button Text</label>
                            <Input
                              value={block.buttonText || ''}
                              onChange={(e) => updateBlock(block.id, { buttonText: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Button URL</label>
                            <Input
                              value={block.url || ''}
                              onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                              placeholder="https://example.com"
                            />
                          </div>
                        </>
                      )}

                      {block.type === 'image' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Image URL</label>
                          <Input
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      )}

                      {block.type === 'footer' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Footer Text</label>
                          <Textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {template.blocks.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Add blocks to see preview
                    </div>
                  ) : (
                    <div>
                      {template.blocks.map(block => (
                        <div key={block.id}>{renderBlockPreview(block)}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HTML Tab */}
        <TabsContent value="html">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">HTML Code</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                <code>{generateHTML()}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
      </div>
    </div>
  );
}
