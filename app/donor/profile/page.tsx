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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageUploader } from '@/components/ui/image-uploader';
import {
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Shield,
  Clock,
  Calendar,
  Upload,
  AlertCircle,
  CheckCircle,
  Save,
  Loader2,
  Edit,
  X
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface DonorProfileData {
  displayName: string;
  email: string;
  phone: string;
  organizationName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  bio: string;
  website: string;
  donationTypes: string[];
  availableTimes: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  verificationStatus: 'verified' | 'pending' | 'unverified';
  joinedDate: Date;
  profileImage: string;
}

export default function DonorProfile() {
  const { user, loading, isAuthorized } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<DonorProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (!loading && (!user || !isAuthorized('donor'))) {
      router.push('/auth/login');
    }
    
    // Mock profile data - in a real app, this would come from your database
    if (user) {
      setProfileData({
        displayName: user.displayName || 'Donor Name',
        email: user.email || 'donor@example.com',
        phone: '+1 (555) 123-4567',
        organizationName: 'Green Valley Farms',
        address: {
          street: '123 Main Street',
          city: 'Cityville',
          state: 'State',
          zipCode: '12345'
        },
        bio: 'We are a local farm committed to sustainable agriculture and reducing food waste. We regularly donate fresh produce to help feed our community.',
        website: 'www.greenvalleyfarms.com',
        donationTypes: ['Fresh Produce', 'Dairy', 'Eggs'],
        availableTimes: {
          monday: '9:00 AM - 5:00 PM',
          tuesday: '9:00 AM - 5:00 PM',
          wednesday: '9:00 AM - 5:00 PM',
          thursday: '9:00 AM - 5:00 PM',
          friday: '9:00 AM - 5:00 PM',
          saturday: '10:00 AM - 2:00 PM',
          sunday: 'Closed'
        },
        verificationStatus: 'verified',
        joinedDate: new Date('2023-01-15'),
        profileImage: '' // Will use fallback avatar
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

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      // In a real app, you would upload to Firebase Storage or another service
      // For now, we'll create a local URL and show success
      const imageUrl = URL.createObjectURL(file);

      // Update profile data with new image
      setProfileData(prev => prev ? { ...prev, profileImage: imageUrl } : null);

      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  if (loading || !user || !isAuthorized('donor') || !profileData) {
    return (
      <div className="flex flex-col space-y-4 items-center justify-center min-h-[60vh]">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="w-48 h-6" />
        <Skeleton className="w-64 h-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
          Donor Profile
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          Manage your profile information and settings
        </p>
      </div>
        {/* Profile Header with Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSaveChanges} disabled={isSaving} className="gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 shadow-lg">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2 shadow-md">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Profile Summary Card */}
          <Card className="lg:col-span-1 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {isEditing ? (
                  <ImageUploader
                    variant="avatar"
                    currentImage={profileData.profileImage}
                    onImageUpload={handleImageUpload}
                    placeholder={profileData.displayName}
                    onImagesChange={() => {}} // Not used for avatar variant
                  />
                ) : (
                  <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                    <AvatarImage src={profileData.profileImage} alt={profileData.displayName} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/80 text-white">
                      {profileData.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              <CardTitle className="text-xl">{profileData.displayName}</CardTitle>
              <CardDescription>{profileData.organizationName}</CardDescription>
              {profileData.verificationStatus === 'verified' && (
                <div className="flex justify-center mt-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> Verified Donor
                  </Badge>
                </div>
              )}
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
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{profileData.address.city}, {profileData.address.state}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Joined {profileData.joinedDate.toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Donation Types</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.donationTypes.map(type => (
                    <Badge key={type} variant="secondary">{type}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">Donation Impact</h3>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
                    <div className="text-2xl font-bold text-primary">24</div>
                    <div className="text-xs text-muted-foreground">Total Donations</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">18</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">450</div>
                    <div className="text-xs text-muted-foreground">Meals Provided</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">4.8</div>
                    <div className="text-xs text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 bg-white shadow-sm">
                <TabsTrigger value="personal" className="text-sm gap-2">
                  <User className="h-4 w-4" />
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value="organization" className="text-sm gap-2">
                  <Building className="h-4 w-4" />
                  Organization
                </TabsTrigger>
                <TabsTrigger value="availability" className="text-sm gap-2">
                  <Clock className="h-4 w-4" />
                  Availability
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Personal Information
                    </CardTitle>
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
                        <Label htmlFor="website">Website (Optional)</Label>
                        <Input 
                          id="website" 
                          defaultValue={profileData.website} 
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

                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Password & Security
                    </CardTitle>
                    <CardDescription>
                      Manage your password and account security settings
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
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Switch disabled={!isEditing} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="organization" className="space-y-6">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      Organization Details
                    </CardTitle>
                    <CardDescription>
                      Information about your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="organizationName">Organization Name</Label>
                      <Input 
                        id="organizationName" 
                        defaultValue={profileData.organizationName} 
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input 
                          id="street" 
                          defaultValue={profileData.address.street} 
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input 
                          id="city" 
                          defaultValue={profileData.address.city} 
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input 
                          id="state" 
                          defaultValue={profileData.address.state} 
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input 
                          id="zipCode" 
                          defaultValue={profileData.address.zipCode} 
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-4">
                      <Label>Donation Types</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['Fresh Produce', 'Bakery Items', 'Dairy', 'Canned Goods', 'Prepared Meals', 'Eggs', 'Meat', 'Seafood', 'Grains'].map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id={`type-${type}`} 
                              defaultChecked={profileData.donationTypes.includes(type)}
                              disabled={!isEditing}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor={`type-${type}`} className="text-sm font-normal">{type}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Verification Status
                    </CardTitle>
                    <CardDescription>
                      Your account verification status and documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {profileData.verificationStatus === 'verified' ? (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          Your account is verified. You can create donations and use all platform features.
                        </AlertDescription>
                      </Alert>
                    ) : profileData.verificationStatus === 'pending' ? (
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-700">
                          Your verification is pending review. This usually takes 1-2 business days.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">
                          Your account is not verified. Please submit verification documents.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="mt-4">
                      <Button variant="outline" className="w-full">
                        <Shield className="mr-2 h-4 w-4" />
                        {profileData.verificationStatus === 'verified' 
                          ? 'View Verification Details' 
                          : 'Submit Verification Documents'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="availability" className="space-y-6">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Pickup Availability
                    </CardTitle>
                    <CardDescription>
                      Set your regular hours for donation pickups
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(profileData.availableTimes).map(([day, time]) => (
                        <div key={day} className="flex items-center justify-between border-b pb-2">
                          <div className="font-medium capitalize">{day}</div>
                          {isEditing ? (
                            <Input 
                              defaultValue={time} 
                              className="w-48"
                            />
                          ) : (
                            <div>{time}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Manage when and how you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Email Notifications</h3>
                          <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                        <Switch defaultChecked disabled={!isEditing} />
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <h3 className="font-medium">SMS Notifications</h3>
                          <p className="text-sm text-muted-foreground">Receive updates via text message</p>
                        </div>
                        <Switch disabled={!isEditing} />
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <h3 className="font-medium">Pickup Reminders</h3>
                          <p className="text-sm text-muted-foreground">Get reminded about scheduled pickups</p>
                        </div>
                        <Switch defaultChecked disabled={!isEditing} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {isEditing && (
              <div className="flex justify-center gap-2 sticky bottom-4 bg-white/95 backdrop-blur-md p-4 border rounded-lg shadow-xl">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2 shadow-md">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={isSaving} className="gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 shadow-lg">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
