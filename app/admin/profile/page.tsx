'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Settings, 
  Shield, 
  Key, 
  Bell, 
  Mail, 
  Phone,
  Upload,
  Lock,
  CheckCircle,
  Save,
  Loader2,
  UserCog,
  History,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface AdminProfileData {
  displayName: string;
  email: string;
  phone: string;
  role: string;
  permissions: string[];
  bio: string;
  lastLogin: Date;
  accountCreated: Date;
  twoFactorEnabled: boolean;
  profileImage: string;
  activityLog: {
    action: string;
    timestamp: Date;
    details: string;
  }[];
}

export default function AdminProfile() {
  const { user, loading, isAuthorized, signOut } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<AdminProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!loading && (!user || !isAuthorized('admin'))) {
      router.push('/auth/login');
    }
    
    // Mock profile data - in a real app, this would come from your database
    if (user) {
      setProfileData({
        displayName: user.displayName || 'Admin User',
        email: user.email || 'admin@fdms.com',
        phone: '+1 (555) 123-4567',
        role: 'System Administrator',
        permissions: [
          'user_management',
          'donation_management',
          'system_settings',
          'reports_access',
          'verification_approval'
        ],
        bio: 'System administrator responsible for platform management and oversight.',
        lastLogin: new Date('2023-06-15T08:30:00'),
        accountCreated: new Date('2023-01-01'),
        twoFactorEnabled: true,
        profileImage: '', // Will use fallback avatar
        activityLog: [
          {
            action: 'User Verification',
            timestamp: new Date('2023-06-14T14:25:00'),
            details: 'Approved verification for Community Food Bank'
          },
          {
            action: 'System Settings',
            timestamp: new Date('2023-06-13T11:10:00'),
            details: 'Updated notification settings'
          },
          {
            action: 'User Management',
            timestamp: new Date('2023-06-12T09:45:00'),
            details: 'Created new admin account for Regional Manager'
          }
        ]
      });
    }
  }, [user, loading, isAuthorized, router]);

  const handleSaveChanges = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    }, 1500);
  };

  const handlePasswordChange = () => {
    toast.info('Password change functionality would be implemented here.');
  };

  const handleImageUpload = () => {
    toast.info('Image upload functionality would be implemented here.');
  };

  const handleLogout = () => {
    signOut?.();
    router.push('/auth/login');
  };

  if (loading || !user || !isAuthorized('admin') || !profileData) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col space-y-4 items-center justify-center min-h-[60vh]">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-64 h-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Admin Profile</h1>
            <p className="text-muted-foreground">Manage your account and system access</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/dashboard">
                Back to Dashboard
              </Link>
            </Button>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel Editing
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-background">
                    <AvatarImage src={profileData.profileImage} alt={profileData.displayName} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {profileData.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background"
                      onClick={handleImageUpload}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <CardTitle className="text-xl">{profileData.displayName}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-1">
                {profileData.role}
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                  <Shield className="h-3 w-3 mr-1" /> Admin
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{profileData.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{profileData.phone}</span>
                </div>
                <div className="flex items-center text-sm">
                  <History className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Last login: {profileData.lastLogin.toLocaleString()}</span>
                </div>
                <div className="flex items-center text-sm">
                  <UserCog className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Account created: {profileData.accountCreated.toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">System Permissions</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.permissions.map(permission => (
                    <Badge key={permission} variant="secondary" className="capitalize">
                      {permission.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="profile" className="text-sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="text-sm">
                  <Lock className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-sm">
                  <History className="h-4 w-4 mr-2" />
                  Activity Log
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Full Name</Label>
                        <Input 
                          id="displayName" 
                          defaultValue={profileData.displayName} 
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          defaultValue={profileData.email} 
                          disabled={true}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          defaultValue={profileData.phone} 
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input 
                          id="role" 
                          defaultValue={profileData.role} 
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        rows={4} 
                        defaultValue={profileData.bio} 
                        disabled={!isEditing}
                        className="resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Notification Preferences</CardTitle>
                    <CardDescription>
                      Manage how you receive system notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive system alerts via email</p>
                      </div>
                      <Switch defaultChecked disabled={!isEditing} />
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <h3 className="font-medium">User Verification Alerts</h3>
                        <p className="text-sm text-muted-foreground">Get notified when new users need verification</p>
                      </div>
                      <Switch defaultChecked disabled={!isEditing} />
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <h3 className="font-medium">System Reports</h3>
                        <p className="text-sm text-muted-foreground">Receive weekly system performance reports</p>
                      </div>
                      <Switch defaultChecked disabled={!isEditing} />
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <h3 className="font-medium">Security Alerts</h3>
                        <p className="text-sm text-muted-foreground">Get notified about security-related events</p>
                      </div>
                      <Switch defaultChecked disabled={!isEditing} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Account Security</CardTitle>
                    <CardDescription>
                      Manage your password and security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Change Password</h3>
                        <p className="text-sm text-muted-foreground">Update your account password</p>
                      </div>
                      <Button variant="outline" onClick={handlePasswordChange}>
                        Change Password
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <h3 className="font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground">
                          {profileData.twoFactorEnabled 
                            ? "Two-factor authentication is enabled" 
                            : "Add an extra layer of security"}
                        </p>
                      </div>
                      <Switch 
                        checked={profileData.twoFactorEnabled} 
                        onCheckedChange={(checked) => {
                          if (!isEditing) return;
                          setProfileData({
                            ...profileData,
                            twoFactorEnabled: checked
                          });
                        }}
                        disabled={!isEditing} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <h3 className="font-medium">Session Management</h3>
                        <p className="text-sm text-muted-foreground">Manage your active sessions</p>
                      </div>
                      <Button variant="outline">
                        View Sessions
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">API Access</CardTitle>
                    <CardDescription>
                      Manage API keys and access tokens
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">API Keys</h3>
                        <p className="text-sm text-muted-foreground">Manage your API keys for system integration</p>
                      </div>
                      <Button variant="outline">
                        <Key className="mr-2 h-4 w-4" />
                        Manage Keys
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <h3 className="font-medium">Webhook Configuration</h3>
                        <p className="text-sm text-muted-foreground">Set up webhooks for real-time events</p>
                      </div>
                      <Button variant="outline">
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Recent Activity</CardTitle>
                    <CardDescription>
                      Your recent actions and system activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profileData.activityLog.length > 0 ? (
                        <div className="border rounded-md divide-y">
                          {profileData.activityLog.map((activity, index) => (
                            <div key={index} className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium">{activity.action}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {activity.timestamp.toLocaleString()}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{activity.details}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground">No recent activity</p>
                      )}
                      
                      <div className="flex justify-center mt-4">
                        <Button variant="outline">
                          View Full Activity Log
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">System Access Log</CardTitle>
                    <CardDescription>
                      Recent logins and system access events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md divide-y">
                      {[
                        { event: "Login", timestamp: new Date('2023-06-15T08:30:00'), ip: "192.168.1.1", device: "Chrome / Windows" },
                        { event: "Login", timestamp: new Date('2023-06-14T09:15:00'), ip: "192.168.1.1", device: "Chrome / Windows" },
                        { event: "Login", timestamp: new Date('2023-06-13T08:45:00'), ip: "192.168.1.1", device: "Chrome / Windows" }
                      ].map((log, index) => (
                        <div key={index} className="p-4">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              <Shield className="h-4 w-4 mr-2 text-green-600" />
                              <span className="font-medium">{log.event}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {log.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            IP: {log.ip} • {log.device}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {isEditing && (
              <div className="flex justify-end gap-2 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
