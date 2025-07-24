'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Paperclip, 
  X, 
  Bold, 
  Italic, 
  Underline, 
  Link,
  Image,
  Smile,
  Save,
  Trash2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyToId?: string | null;
  onEmailSent: () => void;
}

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

export function ComposeEmailDialog({ 
  open, 
  onOpenChange, 
  replyToId, 
  onEmailSent 
}: ComposeEmailDialogProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!to.trim() || !subject.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in the recipient and subject fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Email sent',
        description: 'Your email has been sent successfully.',
      });
      
      // Reset form
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setAttachments([]);
      setShowCc(false);
      setShowBcc(false);
      
      onEmailSent();
    } catch (error) {
      toast({
        title: 'Failed to send email',
        description: 'There was an error sending your email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsDraft(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Draft saved',
        description: 'Your email has been saved as a draft.',
      });
    } catch (error) {
      toast({
        title: 'Failed to save draft',
        description: 'There was an error saving your draft.',
        variant: 'destructive',
      });
    } finally {
      setIsDraft(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const attachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'unknown',
      };
      
      setAttachments(prev => [...prev, attachment]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const insertFormatting = (format: string) => {
    // In a real implementation, this would apply formatting to the selected text
    console.log(`Apply formatting: ${format}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {replyToId ? 'Reply to Email' : 'Compose New Email'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Recipients */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="to" className="w-12 text-right">To:</Label>
              <Input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Enter recipient email addresses"
                className="flex-1"
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCc(!showCc)}
                  className={showCc ? 'text-primary' : ''}
                >
                  Cc
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBcc(!showBcc)}
                  className={showBcc ? 'text-primary' : ''}
                >
                  Bcc
                </Button>
              </div>
            </div>

            {showCc && (
              <div className="flex items-center gap-2">
                <Label htmlFor="cc" className="w-12 text-right">Cc:</Label>
                <Input
                  id="cc"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Enter CC recipients"
                  className="flex-1"
                />
              </div>
            )}

            {showBcc && (
              <div className="flex items-center gap-2">
                <Label htmlFor="bcc" className="w-12 text-right">Bcc:</Label>
                <Input
                  id="bcc"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="Enter BCC recipients"
                  className="flex-1"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Label htmlFor="subject" className="w-12 text-right">Subject:</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="flex-1"
              />
            </div>
          </div>

          <Separator />

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 p-2 border rounded-md">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('bold')}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bold</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('italic')}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Italic</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('underline')}
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Underline</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="mx-1 h-6" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('link')}
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Insert Link</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('image')}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Insert Image</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('emoji')}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Insert Emoji</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Email Body */}
          <div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email message here..."
              className="min-h-[300px] resize-none"
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Attachments:</Label>
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <Badge key={attachment.id} variant="secondary" className="flex items-center gap-2">
                    <span>{attachment.name} ({attachment.size})</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Attach
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSending || isDraft}
            >
              {isDraft ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isSending || isDraft}
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}