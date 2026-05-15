'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bell, Shield, Database, Palette, Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'SDS Manager',
    siteUrl: 'https://sds.company.com',
    emailNotifications: true,
    pushNotifications: false,
    expiryAlerts: true,
    weeklyDigest: true,
    maxFileSize: '10',
    allowedFileTypes: '.pdf,.doc,.docx,.jpg,.png',
    retentionDays: '365',
    autoBackup: true,
    backupFrequency: 'daily',
    primaryColor: '#3b82f6',
    darkMode: false,
  });

  const handleChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('Settings saved:', settings);
    // TODO: Implement settings save
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage system settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic system configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteUrl">Site URL</Label>
                <Input
                  id="siteUrl"
                  value={settings.siteUrl}
                  onChange={(e) => handleChange('siteUrl', e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => handleChange('maxFileSize', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                <Input
                  id="allowedFileTypes"
                  value={settings.allowedFileTypes}
                  onChange={(e) => handleChange('allowedFileTypes', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retentionDays">Data Retention (days)</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  value={settings.retentionDays}
                  onChange={(e) => handleChange('retentionDays', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in browser
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleChange('pushNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Expiry Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when SDS records are expiring soon
                  </p>
                </div>
                <Switch
                  checked={settings.expiryAlerts}
                  onCheckedChange={(checked) => handleChange('expiryAlerts', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly summary of SDS activity
                  </p>
                </div>
                <Switch
                  checked={settings.weeklyDigest}
                  onCheckedChange={(checked) => handleChange('weeklyDigest', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for all users
                  </p>
                </div>
                <Badge>Recommended</Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Backup</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically backup database daily
                  </p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => handleChange('autoBackup', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <select
                  id="backupFrequency"
                  value={settings.backupFrequency}
                  onChange={(e) => handleChange('backupFrequency', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-4">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable dark mode theme
                  </p>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => handleChange('darkMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}