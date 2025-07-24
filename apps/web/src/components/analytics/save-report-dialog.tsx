'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Save, Share, Calendar } from 'lucide-react';

interface SaveReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: any;
  onConfigChange: (config: any) => void;
}

export function SaveReportDialog({ open, onOpenChange, config, onConfigChange }: SaveReportDialogProps) {
  const { toast } = useToast();
  const [saveOptions, setSaveOptions] = useState({
    name: config.name || '',
    description: config.description || '',
    category: 'custom',
    isPublic: false,
    scheduleEnabled: false,
    scheduleFrequency: 'weekly',
    scheduleDay: 'monday',
    scheduleTime: '09:00',
    emailRecipients: '',
  });

  const handleSave = async () => {
    if (!saveOptions.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a report name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // TODO: Implement actual save functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update config with save options
      onConfigChange({
        ...config,
        name: saveOptions.name,
        description: saveOptions.description,
        category: saveOptions.category,
        isPublic: saveOptions.isPublic,
        schedule: saveOptions.scheduleEnabled ? {
          frequency: saveOptions.scheduleFrequency,
          day: saveOptions.scheduleDay,
          time: saveOptions.scheduleTime,
          recipients: saveOptions.emailRecipients.split(',').map(email => email.trim()).filter(Boolean),
        } : null,
      });

      toast({
        title: 'Report saved',
        description: `"${saveOptions.name}" has been saved successfully.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Report
          </DialogTitle>
          <DialogDescription>
            Save your custom report for future use and optionally schedule automated delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name *</Label>
              <Input
                id="report-name"
                placeholder="My Custom Report"
                value={saveOptions.name}
                onChange={(e) => setSaveOptions(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-description">Description</Label>
              <Textarea
                id="report-description"
                placeholder="Brief description of what this report shows..."
                value={saveOptions.description}
                onChange={(e) => setSaveOptions(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={saveOptions.category} 
                onValueChange={(value) => setSaveOptions(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Reports</SelectItem>
                  <SelectItem value="marketing">Marketing Reports</SelectItem>
                  <SelectItem value="customer">Customer Reports</SelectItem>
                  <SelectItem value="financial">Financial Reports</SelectItem>
                  <SelectItem value="operational">Operational Reports</SelectItem>
                  <SelectItem value="custom">Custom Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sharing Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="public"
                checked={saveOptions.isPublic}
                onCheckedChange={(checked) => setSaveOptions(prev => ({ ...prev, isPublic: !!checked }))}
              />
              <Label htmlFor="public" className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                Make this report public (visible to all team members)
              </Label>
            </div>
          </div>

          {/* Scheduling Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="schedule"
                checked={saveOptions.scheduleEnabled}
                onCheckedChange={(checked) => setSaveOptions(prev => ({ ...prev, scheduleEnabled: !!checked }))}
              />
              <Label htmlFor="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule automated delivery
              </Label>
            </div>

            {saveOptions.scheduleEnabled && (
              <div className="ml-6 space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select 
                      value={saveOptions.scheduleFrequency} 
                      onValueChange={(value) => setSaveOptions(prev => ({ ...prev, scheduleFrequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {saveOptions.scheduleFrequency === 'weekly' && (
                    <div className="space-y-2">
                      <Label>Day of Week</Label>
                      <Select 
                        value={saveOptions.scheduleDay} 
                        onValueChange={(value) => setSaveOptions(prev => ({ ...prev, scheduleDay: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={saveOptions.scheduleTime}
                      onChange={(e) => setSaveOptions(prev => ({ ...prev, scheduleTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email Recipients</Label>
                  <Input
                    placeholder="email1@example.com, email2@example.com"
                    value={saveOptions.emailRecipients}
                    onChange={(e) => setSaveOptions(prev => ({ ...prev, emailRecipients: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple email addresses with commas
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}