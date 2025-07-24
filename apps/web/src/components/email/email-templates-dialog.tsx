'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Search,
  Save,
  X
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EmailTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

const mockTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Welcome Email',
    subject: 'Welcome to {{company_name}}!',
    body: `Dear {{customer_name}},

Welcome to {{company_name}}! We're thrilled to have you as our new customer.

Your account has been successfully created and you can now access all our services. If you have any questions or need assistance, please don't hesitate to reach out to our support team.

Best regards,
{{sender_name}}
{{company_name}} Team`,
    category: 'onboarding',
    variables: ['customer_name', 'company_name', 'sender_name'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Follow-up After Meeting',
    subject: 'Thank you for meeting with us - {{meeting_topic}}',
    body: `Hi {{customer_name}},

Thank you for taking the time to meet with us {{meeting_date}} to discuss {{meeting_topic}}.

As discussed, I'm attaching the information we talked about. Please review it and let me know if you have any questions or need clarification on any points.

Next steps:
- {{next_step_1}}
- {{next_step_2}}

I'll follow up with you in {{follow_up_days}} days to see how things are progressing.

Best regards,
{{sender_name}}`,
    category: 'follow-up',
    variables: ['customer_name', 'meeting_date', 'meeting_topic', 'next_step_1', 'next_step_2', 'follow_up_days', 'sender_name'],
    createdAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-16T14:30:00Z',
  },
  {
    id: '3',
    name: 'Proposal Submission',
    subject: 'Proposal for {{project_name}} - {{company_name}}',
    body: `Dear {{customer_name}},

I hope this email finds you well. As discussed, I'm pleased to submit our proposal for {{project_name}}.

The proposal includes:
- Detailed project scope and timeline
- Pricing breakdown
- Terms and conditions
- Next steps

Please review the attached proposal and let me know if you have any questions or would like to schedule a call to discuss any aspects in detail.

We're excited about the opportunity to work with {{customer_company}} and look forward to your feedback.

Best regards,
{{sender_name}}
{{job_title}}
{{company_name}}`,
    category: 'sales',
    variables: ['customer_name', 'project_name', 'company_name', 'customer_company', 'sender_name', 'job_title'],
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-17T09:15:00Z',
  },
  {
    id: '4',
    name: 'Support Ticket Resolution',
    subject: 'Your support ticket #{{ticket_number}} has been resolved',
    body: `Hello {{customer_name}},

Your support ticket #{{ticket_number}} has been resolved.

Issue: {{issue_description}}
Solution: {{solution_description}}

If you have any further questions or if the issue persists, please don't hesitate to reach out to us by replying to this email or creating a new support ticket.

We appreciate your patience and thank you for choosing {{company_name}}.

Best regards,
{{sender_name}}
Support Team
{{company_name}}`,
    category: 'support',
    variables: ['customer_name', 'ticket_number', 'issue_description', 'solution_description', 'company_name', 'sender_name'],
    createdAt: '2024-01-18T16:45:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
  },
];

export function EmailTemplatesDialog({ open, onOpenChange }: EmailTemplatesDialogProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const { toast } = useToast();

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'onboarding', name: 'Onboarding' },
    { id: 'follow-up', name: 'Follow-up' },
    { id: 'sales', name: 'Sales' },
    { id: 'support', name: 'Support' },
    { id: 'marketing', name: 'Marketing' },
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      subject: '',
      body: '',
      category: 'onboarding',
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingTemplate(newTemplate);
    setIsCreating(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setIsCreating(false);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    if (!editingTemplate.name.trim() || !editingTemplate.subject.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in the template name and subject.',
        variant: 'destructive',
      });
      return;
    }

    // Extract variables from subject and body
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    
    const subjectMatches = editingTemplate.subject.matchAll(variableRegex);
    for (const match of subjectMatches) {
      variables.add(match[1]);
    }
    
    const bodyMatches = editingTemplate.body.matchAll(variableRegex);
    for (const match of bodyMatches) {
      variables.add(match[1]);
    }

    const updatedTemplate = {
      ...editingTemplate,
      variables: Array.from(variables),
      updatedAt: new Date().toISOString(),
    };

    if (isCreating) {
      setTemplates(prev => [...prev, updatedTemplate]);
      toast({
        title: 'Template created',
        description: 'Your email template has been created successfully.',
      });
    } else {
      setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
      toast({
        title: 'Template updated',
        description: 'Your email template has been updated successfully.',
      });
    }

    setEditingTemplate(null);
    setIsCreating(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    setDeleteTemplateId(null);
    toast({
      title: 'Template deleted',
      description: 'The email template has been deleted successfully.',
    });
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    const duplicatedTemplate: EmailTemplate = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTemplates(prev => [...prev, duplicatedTemplate]);
    toast({
      title: 'Template duplicated',
      description: 'The email template has been duplicated successfully.',
    });
  };

  const handleUseTemplate = (template: EmailTemplate) => {
    // In a real app, this would populate the compose dialog with the template
    toast({
      title: 'Template selected',
      description: 'The template has been loaded into the compose window.',
    });
    onOpenChange(false);
  };

  if (editingTemplate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isCreating ? 'Create Email Template' : 'Edit Email Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Enter template name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateCategory">Category</Label>
                <select
                  id="templateCategory"
                  value={editingTemplate.category}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, category: e.target.value } : null)}
                  className="w-full p-2 border rounded-md"
                >
                  {categories.slice(1).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateSubject">Subject</Label>
              <Input
                id="templateSubject"
                value={editingTemplate.subject}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                placeholder="Enter email subject (use {{variable}} for dynamic content)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateBody">Email Body</Label>
              <Textarea
                id="templateBody"
                value={editingTemplate.body}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, body: e.target.value } : null)}
                placeholder="Enter email body (use {{variable}} for dynamic content)"
                className="min-h-[300px] resize-none"
              />
            </div>

            {editingTemplate.variables.length > 0 && (
              <div className="space-y-2">
                <Label>Variables Found</Label>
                <div className="flex flex-wrap gap-2">
                  {editingTemplate.variables.map(variable => (
                    <Badge key={variable} variant="secondary">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setEditingTemplate(null);
              setIsCreating(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="mr-2 h-4 w-4" />
              {isCreating ? 'Create Template' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Email Templates
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border rounded-md"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Button onClick={handleCreateTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="overflow-y-auto max-h-[60vh]">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'No templates found matching your criteria' 
                    : 'No email templates yet'}
                </p>
                <Button onClick={handleCreateTemplate} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {template.subject}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {categories.find(c => c.id === template.category)?.name}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {template.body.substring(0, 150)}...
                      </div>
                      
                      {template.variables.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-muted-foreground mb-1">Variables:</div>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map(variable => (
                              <Badge key={variable} variant="secondary" className="text-xs">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
                            {template.variables.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.variables.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Updated {new Date(template.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUseTemplate(template)}
                          >
                            Use
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicateTemplate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTemplateId(template.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this email template? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTemplateId && handleDeleteTemplate(deleteTemplateId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}