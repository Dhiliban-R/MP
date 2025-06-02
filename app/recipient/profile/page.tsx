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
  Users,
  FileText,
  Truck,
  Edit,
  X
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface RecipientProfileData {
  displayName: string;
  email: string;
  phone: string;
  organizationName: string;
  organizationType: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  bio: string;
  website: string;
  foodNeeds: string[];
  servingCapacity: number;
  pickupAvailability: {
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
  documents: {
    name: string;
    status: 'verified' | 'pending' | 'rejected';
    uploadDate: Date;
  }[];
}

export default function RecipientProfile() {
  const { user, loading, isAuthorized } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<RecipientProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('organization');

  useEffect(() => {
    if (!loading && (!user || !isAuthorized('recipient'))) {
      router.push('/auth/login');
    }
    
    // Mock profile data - in a real app, this would come from your database
    if (user) {
      setProfileData({
        displayName: user.displayName || 'Recipient Name',
        email: user.email || 'recipient@example.com',
        phone: '+1 (555) 987-6543',
        organizationName: 'Community Food Bank',
        organizationType: 'Non-profit Food Bank',
        address: {
          street: '456 Charity Lane',
          city: 'Helpville',
          state: 'State',
          zipCode: '54321'
        },
        bio: 'We are a community food bank serving over 200 families weekly. Our mission is to ensure no one in our community goes hungry.',
        website: 'www.communityfoodbank.org',
        foodNeeds: ['Fresh Produce', 'Canned Goods', 'Bakery Items', 'Dairy'],
        servingCapacity: 250,
        pickupAvailability: {
          monday: '9:00 AM - 5:00 PM',
          tuesday: '9:00 AM - 5:00 PM',
          wednesday: '9:00 AM - 5:00 PM',
          thursday: '9:00 AM - 5:00 PM',
          friday: '9:00 AM - 5:00 PM',
          saturday: '10:00 AM - 2:00 PM',
          sunday: 'Closed'
        },
        verificationStatus: 'verified',
        joinedDate: new Date('2023-02-10'),
        profileImage: '', // Will use fallback avatar
        documents: [
          {
            name: '501c3_certification.pdf',
            status: 'verified',
            uploadDate: new Date('2023-02-11')
          },
          {
            name: 'food_handler_permit.pdf',
            status: 'verified',
            uploadDate: new Date('2023-02-11')
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

  const handleDocumentUpload = () => {
    toast.info('Document upload functionality would be implemented here.');
  };

  if (loading || !user || !isAuthorized('recipient') || !profileData) {
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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
          Recipient Profile
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          Manage your organization information and settings
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
          {/* Profile Summary Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-background">
                    <AvatarImage src={profileData.profileImage} alt={profileData.organizationName} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {profileData.organizationName.charAt(0)}
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
              <CardTitle className="text-xl">{profileData.organizationName}</CardTitle>
              <CardDescription>{profileData.organizationType}</CardDescription>
              {profileData.verificationStatus === 'verified' && (
                <div className="flex justify-center mt-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> Verified
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
                <h3 className="font-medium mb-2">Food Needs</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.foodNeeds.map(type => (
                    <Badge key={type} variant="secondary">{type}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Capacity & Impact</h3>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-muted rounded-md p-2">
                    <div className="text-2xl font-bold text-primary">{profileData.servingCapacity}</div>
                    <div className="text-xs text-muted-foreground">Weekly Capacity</div>
                  </div>
                  <div className="bg-muted rounded-md p-2">
                    <div className="text-2xl font-bold text-green-600">32</div>
                    <div className="text-xs text-muted-foreground">Pickups Completed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="organization" className="text-sm">
                  <Building className="h-4 w-4 mr-2" />
                  Organization
                </TabsTrigger>
                <TabsTrigger value="contact" className="text-sm">
                  <User className="h-4 w-4 mr-2" />
                  Contact Info
                </TabsTrigger>
                <TabsTrigger value="operations" className="text-sm">
                  <Truck className="h-4 w-4 mr-2" />
                  Operations
                </TabsTrigger>
              </TabsList>

              <TabsContent value="organization" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Organization Information</CardTitle>
                    <CardDescription>
                      Details about your organization and its mission
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="organizationName">Organization Name</Label>
                        <Input 
                          id="organizationName" 
                          defaultValue={profileData.organizationName} 
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organizationType">Organization Type</Label>
                        <Input 
                          id="organizationType" 
                          defaultValue={profileData.organizationType} 
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
                      <div className="space-y-2">
                        <Label htmlFor="servingCapacity">Weekly Serving Capacity</Label>
                        <Input 
                          id="servingCapacity" 
                          type="number"
                          defaultValue={profileData.servingCapacity.toString()} 
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Organization Mission & Description</Label>
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
                    <CardTitle className="text-xl">Verification & Documents</CardTitle>
                    <CardDescription>
                      Manage your organization's verification documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {profileData.verificationStatus === 'verified' ? (
                      <Alert className="bg-green-50 border-green-200 mb-4">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          Your organization is verified. You can receive donations and use all platform features.
                        </AlertDescription>
                      </Alert>
                    ) : profileData.verificationStatus === 'pending' ? (
                      <Alert className="bg-yellow-50 border-yellow-200 mb-4">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-700">
                          Your verification is pending review. This usually takes 1-2 business days.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="bg-red-50 border-red-200 mb-4">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">
                          Your organization is not verified. Please submit verification documents.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Uploaded Documents</h3>
                      {profileData.documents.length > 0 ? (
                        <div className="border rounded-md divide-y">
                          {profileData.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-3">
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Uploaded on {doc.uploadDate.toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge 
                                variant={doc.status === 'verified' ? 'outline' : doc.status === 'pending' ? 'secondary' : 'destructive'}
                                className={doc.status === 'verified' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                              >
                                {doc.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {doc.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                {doc.status === 'rejected' && <AlertCircle className="h-3 w-3 mr-1" />}
                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                      )}
                      
                      <Button variant="outline" onClick={handleDocumentUpload} className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload New Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Contact Information</CardTitle>
                    <CardDescription>
                      Update your organization's contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactName">Primary Contact Name</Label>
                        <Input 
                          id="contactName" 
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
                        <Label htmlFor="alternatePhone">Alternate Phone (Optional)</Label>
                        <Input 
                          id="alternatePhone" 
                          placeholder="Enter alternate phone number"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-3">Physical Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
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
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Password & Security</CardTitle>
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
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <h3 className="font-medium">Notification Preferences</h3>
                        <p className="text-sm text-muted-foreground">Manage how you receive notifications</p>
                      </div>
                      <Button variant="outline" asChild>
                        <Link href="/settings">
                          Manage Notifications
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="operations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Pickup Availability</CardTitle>
                    <CardDescription>
                      Set your regular hours for donation pickups
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(profileData.pickupAvailability).map(([day, time]) => (
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

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Food Needs & Preferences</CardTitle>
                    <CardDescription>
                      Specify what types of food your organization needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Food Types Needed</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['Fresh Produce', 'Bakery Items', 'Dairy', 'Canned Goods', 'Prepared Meals', 'Eggs', 'Meat', 'Seafood', 'Grains', 'Beverages', 'Snacks', 'Baby Food'].map(type => (
                            <div key={type} className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id={`type-${type}`} 
                                defaultChecked={profileData.foodNeeds.includes(type)}
                                disabled={!isEditing}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <Label htmlFor={`type-${type}`} className="text-sm font-normal">{type}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <Label htmlFor="specialRequirements">Special Requirements or Restrictions</Label>
                        <Textarea 
                          id="specialRequirements" 
                          placeholder="Enter any special requirements or dietary restrictions"
                          disabled={!isEditing}
                          className="mt-2"
                        />
                      </div>
                      
                      <div className="pt-4 border-t">
                        <Label htmlFor="storageCapacity">Storage Capacity</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                          <div className="space-y-2">
                            <Label htmlFor="refrigerated" className="text-sm font-normal">Refrigerated (cubic ft)</Label>
                            <Input 
                              id="refrigerated" 
                              type="number"
                              placeholder="0"
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="frozen" className="text-sm font-normal">Frozen (cubic ft)</Label>
                            <Input 
                              id="frozen" 
                              type="number"
                              placeholder="0"
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dry" className="text-sm font-normal">Dry Storage (cubic ft)</Label>
                            <Input 
                              id="dry" 
                              type="number"
                              placeholder="0"
                              disabled={!isEditing}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Transportation Capabilities</CardTitle>
                    <CardDescription>
                      Information about your ability to transport donations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Can pick up donations</h3>
                        <p className="text-sm text-muted-foreground">Ability to collect from donor locations</p>
                      </div>
                      <Switch defaultChecked disabled={!isEditing} />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Label htmlFor="transportationDetails">Transportation Details</Label>
                      <Textarea 
                        id="transportationDetails" 
                        placeholder="Describe your transportation capabilities (vehicle types, distance limitations, etc.)"
                        disabled={!isEditing}
                        className="mt-2"
                      />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Label htmlFor="maxDistance">Maximum Pickup Distance (miles)</Label>
                      <Input 
                        id="maxDistance" 
                        type="number"
                        placeholder="10"
                        className="mt-2 max-w-xs"
                        disabled={!isEditing}
                      />
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
  );
}
