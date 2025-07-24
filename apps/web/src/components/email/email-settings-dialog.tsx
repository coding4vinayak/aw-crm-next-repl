'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Server, 
  Shield, 
  Bell, 
  Palette,
  Save,
  TestTube
} from 'lucide-react';

interface EmailSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailSettingsDialog({ open, onOpenChange }: EmailSettingsDialogProps) {
  const [settings, setSettings] = useState({
    // Account Settings
    displayName: 'John Doe',
    emailAddress: 'john@company.com',
    signature: 'Best regards,\nJohn Doe\nSales Manager',
    
    // Server Settings
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
    smtpSecurity: 'tls',
    imapServer: 'imap.gmail.com',
    imapPort: '993',
    imapSecurity: 'ssl',
    username: 'john@company.com',
    password: '',
    
    // Notifications
    emailNotifications: true,
    desktopNotifications: true,
    soundNotifications: false,
    newEmailSound: 'default',
    
    // Appearance
    theme: 'system',
    density: 'comfortable',
    previewPane: 'right',
    
    // Behavior
    autoSave: true,
    autoSaveInterval: '30',
    markAsReadDelay: '3',
    confirmDelete: true,
    confirmSend: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Settings saved',
        description: 'Your email settings have been updated successfully.',
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to save settings',
        description: 'There was an error saving your settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure
      if (Math.random() > 0.3) {
        toast({
          title: 'Connection successful',
          description: 'Successfully connected to the email server.',
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: 'Could not connect to the email server. Please check your settings.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="account" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="server">Server</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[60vh]">
            {/* Account Settings */}
            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Configure your email account details and signature
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={settings.displayName}
                        onChange={(e) => updateSetting('displayName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailAddress">Email Address</Label>
                      <Input
                        id="emailAddress"
                        type="email"
                        value={settings.emailAddress}
                        onChange={(e) => updateSetting('emailAddress', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signature">Email Signature</Label>
                    <textarea
                      id="signature"
                      className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                      value={settings.signature}
                      onChange={(e) => updateSetting('signature', e.target.value)}
                      placeholder="Enter your email signature..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Server Settings */}
            <TabsContent value="server" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    SMTP Settings (Outgoing Mail)
                  </CardTitle>
                  <CardDescription>
                    Configure your outgoing mail server settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="smtpServer">SMTP Server</Label>
                      <Input
                        id="smtpServer"
                        value={settings.smtpServer}
                        onChange={(e) => updateSetting('smtpServer', e.target.value)}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">Port</Label>
                      <Input
                        id="smtpPort"
                        value={settings.smtpPort}
                        onChange={(e) => updateSetting('smtpPort', e.target.value)}
                        placeholder="587"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpSecurity">Security</Label>
                    <Select value={settings.smtpSecurity} onValueChange={(value) => updateSetting('smtpSecurity', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    IMAP Settings (Incoming Mail)
                  </CardTitle>
                  <CardDescription>
                    Configure your incoming mail server settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="imapServer">IMAP Server</Label>
                      <Input
                        id="imapServer"
                        value={settings.imapServer}
                        onChange={(e) => updateSetting('imapServer', e.target.value)}
                        placeholder="imap.gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imapPort">Port</Label>
                      <Input
                        id="imapPort"
                        value={settings.imapPort}
                        onChange={(e) => updateSetting('imapPort', e.target.value)}
                        placeholder="993"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imapSecurity">Security</Label>
                    <Select value={settings.imapSecurity} onValueChange={(value) => updateSetting('imapSecurity', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Authentication
                  </CardTitle>
                  <CardDescription>
                    Enter your email account credentials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={settings.username}
                        onChange={(e) => updateSetting('username', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={settings.password}
                        onChange={(e) => updateSetting('password', e.target.value)}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleTestConnection} 
                    disabled={isTesting}
                    className="w-full"
                  >
                    {isTesting ? (
                      <>Testing Connection...</>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-4 w-4" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure how you want to be notified about new emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for new emails
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Desktop Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show desktop notifications for new emails
                      </p>
                    </div>
                    <Switch
                      checked={settings.desktopNotifications}
                      onCheckedChange={(checked) => updateSetting('desktopNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sound Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Play sound when new emails arrive
                      </p>
                    </div>
                    <Switch
                      checked={settings.soundNotifications}
                      onCheckedChange={(checked) => updateSetting('soundNotifications', checked)}
                    />
                  </div>

                  {settings.soundNotifications && (
                    <div className="space-y-2">
                      <Label htmlFor="newEmailSound">Notification Sound</Label>
                      <Select value={settings.newEmailSound} onValueChange={(value) => updateSetting('newEmailSound', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="chime">Chime</SelectItem>
                          <SelectItem value="bell">Bell</SelectItem>
                          <SelectItem value="ding">Ding</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Appearance Settings
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of your email interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="density">Display Density</Label>
                    <Select value={settings.density} onValueChange={(value) => updateSetting('density', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="previewPane">Preview Pane</Label>
                    <Select value={settings.previewPane} onValueChange={(value) => updateSetting('previewPane', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Behavior */}
            <TabsContent value="behavior" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Behavior Settings</CardTitle>
                  <CardDescription>
                    Configure how the email client behaves
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-save Drafts</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically save email drafts while composing
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoSave}
                      onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                    />
                  </div>

                  {settings.autoSave && (
                    <div className="space-y-2">
                      <Label htmlFor="autoSaveInterval">Auto-save Interval (seconds)</Label>
                      <Select value={settings.autoSaveInterval} onValueChange={(value) => updateSetting('autoSaveInterval', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 seconds</SelectItem>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">1 minute</SelectItem>
                          <SelectItem value="120">2 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="markAsReadDelay">Mark as Read Delay (seconds)</Label>
                    <Select value={settings.markAsReadDelay} onValueChange={(value) => updateSetting('markAsReadDelay', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Immediately</SelectItem>
                        <SelectItem value="1">1 second</SelectItem>
                        <SelectItem value="3">3 seconds</SelectItem>
                        <SelectItem value="5">5 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Confirm Delete</Label>
                      <p className="text-sm text-muted-foreground">
                        Ask for confirmation before deleting emails
                      </p>
                    </div>
                    <Switch
                      checked={settings.confirmDelete}
                      onCheckedChange={(checked) => updateSetting('confirmDelete', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Confirm Send</Label>
                      <p className="text-sm text-muted-foreground">
                        Ask for confirmation before sending emails
                      </p>
                    </div>
                    <Switch
                      checked={settings.confirmSend}
                      onCheckedChange={(checked) => updateSetting('confirmSend', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}