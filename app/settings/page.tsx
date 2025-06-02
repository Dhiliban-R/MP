'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Loader2,
  Check,
  Save,
  Bell,
  Moon,
  Sun,
  Monitor,
  Lock,
  Globe,
  Clock,
  Smartphone,
  Mail,
  BellRing,
  BellOff,
  ArrowLeft,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Languages,
  User,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'donor' | 'recipient' | 'admin';
  emailNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  privacySettings: {
    showProfile: boolean;
    showContactInfo: boolean;
    showDonationHistory: boolean;
  };
  accessibilitySettings: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
  };
}

const SettingsPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // In a real app, this would fetch from Firestore
        // For demo purposes, we'll use mock data
        const mockProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || 'User Name',
          email: user.email || 'user@example.com',
          phone: '+1 (555) 123-4567',
          role: 'donor', // Assuming role from user object in a real app
          emailNotifications: true,
          smsNotifications: false,
          inAppNotifications: true,
          theme: 'system',
          language: 'en',
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          privacySettings: {
            showProfile: true,
            showContactInfo: false,
            showDonationHistory: true
          },
          accessibilitySettings: {
            highContrast: false,
            largeText: false,
            reducedMotion: false
          }
        };
        
        setProfile(mockProfile);
      } catch (error) {
        console.error("Failed to fetch profile", error);
        toast.error("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveSettings = async (updatedSettings: Partial<UserProfile>) => {
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      // In a real app, this would update Firestore
      // For demo purposes, we'll just update the local state
      setProfile({ ...profile, ...updatedSettings });
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to update settings", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    toast.info("Password change functionality would be implemented here.");
  };

  const handleExportData = () => {
    toast.info("Data export functionality would be implemented here.");
  };

  const handleDeleteAccount = () => {
    toast.info("Account deletion functionality would be implemented here.");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Alert variant="destructive">
            <AlertTitle>Error Loading Settings</AlertTitle>
            <AlertDescription>
              We couldn't load your profile settings. Please try refreshing the page or contact support if the problem persists.
            </AlertDescription>
          </Alert>
          <Button className="mt-4" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and settings</p>
          </div>
          <Button variant="outline" asChild>
            <Link href={profile.role === 'admin' ? '/admin/dashboard' : profile.role === 'donor' ? '/donor/dashboard' : '/recipient/dashboard'}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64 flex-shrink-0">
            <Tabs defaultValue={activeTab} orientation="vertical" onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex flex-col h-auto items-stretch bg-transparent space-y-1">
                <TabsTrigger value="account" className="justify-start text-left px-3 py-2">
                  <User className="h-4 w-4 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="notifications" className="justify-start text-left px-3 py-2">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="appearance" className="justify-start text-left px-3 py-2">
                  <Monitor className="h-4 w-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="privacy" className="justify-start text-left px-3 py-2">
                  <Lock className="h-4 w-4 mr-2" />
                  Privacy & Security
                </TabsTrigger>
                <TabsTrigger value="accessibility" className="justify-start text-left px-3 py-2">
                  <Eye className="h-4 w-4 mr-2" />
                  Accessibility
                </TabsTrigger>
                <TabsTrigger value="advanced" className="justify-start text-left px-3 py-2">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 space-y-6">
            <TabsContent value="account" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information and contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue={profile.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue={profile.email} disabled />
                      <p className="text-xs text-muted-foreground">To change your email, please contact support</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" defaultValue={profile.phone} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={() => handleSaveSettings({ 
                    name: (document.getElementById("name") as HTMLInputElement).value,
                    phone: (document.getElementById("phone") as HTMLInputElement).value 
                  })} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Password Management</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" placeholder="••••••••" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" placeholder="••••••••" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleChangePassword}>
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions for your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <h3 className="font-medium">Export Your Data</h3>
                      <p className="text-sm text-muted-foreground">Download a copy of all your data</p>
                    </div>
                    <Button variant="outline" onClick={handleExportData}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-destructive rounded-md">
                    <div>
                      <h3 className="font-medium text-destructive">Delete Account</h3>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how and when you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Notification Channels</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive updates and alerts via email</p>
                          </div>
                        </div>
                        <Switch 
                          id="email-notifications" 
                          checked={profile.emailNotifications} 
                          onCheckedChange={(checked) => handleSaveSettings({ emailNotifications: checked })} 
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <Label htmlFor="sms-notifications" className="font-medium">SMS Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive text messages for important updates</p>
                          </div>
                        </div>
                        <Switch 
                          id="sms-notifications" 
                          checked={profile.smsNotifications} 
                          onCheckedChange={(checked) => handleSaveSettings({ smsNotifications: checked })} 
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <BellRing className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <Label htmlFor="in-app-notifications" className="font-medium">In-App Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications within the application</p>
                          </div>
                        </div>
                        <Switch 
                          id="in-app-notifications" 
                          checked={profile.inAppNotifications} 
                          onCheckedChange={(checked) => handleSaveSettings({ inAppNotifications: checked })} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Notification Types</h3>
                    <div className="space-y-4">
                      {profile.role === 'donor' && (
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium">Donation Requests</Label>
                              <p className="text-sm text-muted-foreground">When someone requests your donation</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium">Pickup Confirmations</Label>
                              <p className="text-sm text-muted-foreground">When a pickup is scheduled or changed</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </>
                      )}
                      
                      {profile.role === 'recipient' && (
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium">New Donations</Label>
                              <p className="text-sm text-muted-foreground">When new donations are available in your area</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="font-medium">Donation Confirmations</Label>
                              <p className="text-sm text-muted-foreground">When your request for a donation is confirmed</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </>
                      )}
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">System Announcements</Label>
                          <p className="text-sm text-muted-foreground">Important updates about the platform</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Marketing & Newsletters</Label>
                          <p className="text-sm text-muted-foreground">News, tips, and promotional content</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline" className="mr-2">
                    <BellOff className="mr-2 h-4 w-4" />
                    Pause All
                  </Button>
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Theme & Display</CardTitle>
                  <CardDescription>Customize the appearance of the application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div 
                        className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all ${profile.theme === 'light' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                        onClick={() => handleSaveSettings({ theme: 'light' })}
                      >
                        <Sun className="h-8 w-8 mb-2 text-amber-500" />
                        <span className="font-medium">Light</span>
                      </div>
                      <div 
                        className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all ${profile.theme === 'dark' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                        onClick={() => handleSaveSettings({ theme: 'dark' })}
                      >
                        <Moon className="h-8 w-8 mb-2 text-indigo-500" />
                        <span className="font-medium">Dark</span>
                      </div>
                      <div 
                        className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all ${profile.theme === 'system' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                        onClick={() => handleSaveSettings({ theme: 'system' })}
                      >
                        <Monitor className="h-8 w-8 mb-2 text-gray-500" />
                        <span className="font-medium">System</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Language & Region</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select 
                          value={profile.language} 
                          onValueChange={(value) => handleSaveSettings({ language: value })}
                        >
                          <SelectTrigger id="language">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                            <SelectItem value="zh">中文</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Time Zone</Label>
                        <Select 
                          value={profile.timezone} 
                          onValueChange={(value) => handleSaveSettings({ timezone: value })}
                        >
                          <SelectTrigger id="timezone">
                            <SelectValue placeholder="Select time zone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                            <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="date-format">Date Format</Label>
                        <Select 
                          value={profile.dateFormat} 
                          onValueChange={(value) => handleSaveSettings({ dateFormat: value })}
                        >
                          <SelectTrigger id="date-format">
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={() => handleSaveSettings({})}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control what information is visible to others</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-profile" className="font-medium">Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">Allow others to view your profile</p>
                    </div>
                    <Switch 
                      id="show-profile" 
                      checked={profile.privacySettings.showProfile} 
                      onCheckedChange={(checked) => handleSaveSettings({ 
                        privacySettings: { ...profile.privacySettings, showProfile: checked } 
                      })} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-contact" className="font-medium">Contact Information</Label>
                      <p className="text-sm text-muted-foreground">Show your contact details to verified users</p>
                    </div>
                    <Switch 
                      id="show-contact" 
                      checked={profile.privacySettings.showContactInfo} 
                      onCheckedChange={(checked) => handleSaveSettings({ 
                        privacySettings: { ...profile.privacySettings, showContactInfo: checked } 
                      })} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-history" className="font-medium">Donation History</Label>
                      <p className="text-sm text-muted-foreground">Make your donation history visible to others</p>
                    </div>
                    <Switch 
                      id="show-history" 
                      checked={profile.privacySettings.showDonationHistory} 
                      onCheckedChange={(checked) => handleSaveSettings({ 
                        privacySettings: { ...profile.privacySettings, showDonationHistory: checked } 
                      })} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Button variant="outline">
                      <Lock className="mr-2 h-4 w-4" />
                      Setup 2FA
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Active Sessions</Label>
                      <p className="text-sm text-muted-foreground">Manage devices where you're currently logged in</p>
                    </div>
                    <Button variant="outline">
                      <Monitor className="mr-2 h-4 w-4" />
                      Manage Sessions
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Login History</Label>
                      <p className="text-sm text-muted-foreground">View recent account access attempts</p>
                    </div>
                    <Button variant="outline">
                      <Clock className="mr-2 h-4 w-4" />
                      View History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accessibility" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Accessibility Settings</CardTitle>
                  <CardDescription>Customize your experience to improve accessibility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="high-contrast" className="font-medium">High Contrast Mode</Label>
                      <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                    </div>
                    <Switch 
                      id="high-contrast" 
                      checked={profile.accessibilitySettings.highContrast} 
                      onCheckedChange={(checked) => handleSaveSettings({ 
                        accessibilitySettings: { ...profile.accessibilitySettings, highContrast: checked } 
                      })} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="large-text" className="font-medium">Larger Text</Label>
                      <p className="text-sm text-muted-foreground">Increase text size throughout the application</p>
                    </div>
                    <Switch 
                      id="large-text" 
                      checked={profile.accessibilitySettings.largeText} 
                      onCheckedChange={(checked) => handleSaveSettings({ 
                        accessibilitySettings: { ...profile.accessibilitySettings, largeText: checked } 
                      })} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="reduced-motion" className="font-medium">Reduced Motion</Label>
                      <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                    </div>
                    <Switch 
                      id="reduced-motion" 
                      checked={profile.accessibilitySettings.reducedMotion} 
                      onCheckedChange={(checked) => handleSaveSettings({ 
                        accessibilitySettings: { ...profile.accessibilitySettings, reducedMotion: checked } 
                      })} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Screen Reader Compatibility</Label>
                      <p className="text-sm text-muted-foreground">Our platform is optimized for screen readers</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" /> Enabled
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={() => handleSaveSettings({})}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>Configure technical aspects of your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Data Management</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Export Your Data</Label>
                          <p className="text-sm text-muted-foreground">Download a copy of all your data</p>
                        </div>
                        <Button variant="outline" onClick={handleExportData}>
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Clear Cache</Label>
                          <p className="text-sm text-muted-foreground">Clear locally stored application data</p>
                        </div>
                        <Button variant="outline">
                          Clear Cache
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Developer Options</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">API Access</Label>
                          <p className="text-sm text-muted-foreground">Manage API keys and access tokens</p>
                        </div>
                        <Button variant="outline">
                          Manage API Keys
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Webhook Configuration</Label>
                          <p className="text-sm text-muted-foreground">Set up webhooks for real-time events</p>
                        </div>
                        <Button variant="outline">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </div>
    </div>
  );
};

function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default SettingsPage;