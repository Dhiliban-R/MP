'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { User, Address } from '@/lib/types/user.types';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertCircle,
  Camera,
  Check,
  Loader2,
  MapPin,
  Save,
  User as UserIcon,
  Lock,
  Bell,
  Mail,
  X,
  Upload
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage, auth } from '@/lib/firebase';
import { 
  updateProfile as updateFirebaseProfile, 
  updatePassword, 
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Schema for profile update form
const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: "Display name must be at least 2 characters" })
    .max(50, { message: "Display name must not exceed 50 characters" }),
  phoneNumber: z
    .string()
    .optional()
    .refine((val) => !val || /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(val), {
      message: "Please enter a valid phone number",
    }),
  organizationName: z
    .string()
    .optional(),
  street: z
    .string()
    .optional(),
  city: z
    .string()
    .optional(),
  state: z
    .string()
    .optional(),
  postalCode: z
    .string()
    .optional(),
  country: z
    .string()
    .optional(),
});

// Schema for password change form
const passwordFormSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: "Current password is required" }),
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" }),
  confirmPassword: z
    .string()
    .min(1, { message: "Please confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Schema for email preferences form
const emailPreferencesSchema = z.object({
  receiveNotifications: z.boolean().default(true),
  emailFrequency: z.enum(["immediate", "daily", "weekly"]).default("immediate"),
  marketingEmails: z.boolean().default(false),
  receiveUpdates: z.boolean().default(true),
});

// Combined type for all form schemas
type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type EmailPreferencesValues = z.infer<typeof emailPreferencesSchema>;

export default function ProfileSettingsPage() {
  const { user, isFeatureAccessible, isEmailVerified } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [preferencesUpdateSuccess, setPreferencesUpdateSuccess] = useState(false);
  
  // Initialize the profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      phoneNumber: "",
      organizationName: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  // Initialize the password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Initialize the email preferences form
  const emailPreferencesForm = useForm<EmailPreferencesValues>({
    resolver: zodResolver(emailPreferencesSchema),
    defaultValues: {
      receiveNotifications: true,
      emailFrequency: "immediate",
      marketingEmails: false,
      receiveUpdates: true,
    },
  });

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      // Set profile image URL if it exists
      if (user.photoURL) {
        setProfileImageUrl(user.photoURL);
      }

      // Update profile form with user data
      profileForm.reset({
        displayName: user.displayName || "",
        phoneNumber: user.phoneNumber || "",
        organizationName: user.organizationName || "",
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        postalCode: user.address?.postalCode || "",
        country: user.address?.country || "",
      });

      // Fetch email preferences from Firestore
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.preferences) {
            emailPreferencesForm.reset({
              receiveNotifications: userData.preferences.receiveNotifications ?? true,
              emailFrequency: userData.preferences.emailFrequency ?? "immediate",
              marketingEmails: userData.preferences.marketingEmails ?? false,
              receiveUpdates: userData.preferences.receiveUpdates ?? true,
            });
          }
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserData();
  }, [user, profileForm, emailPreferencesForm]);

  // Handle profile form submission
  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    // Check if profile edit access is allowed
    if (!isFeatureAccessible('profile_edit', true)) {
      return;
    }

    setIsLoading(true);
    setProfileUpdateSuccess(false);

    try {
      // Create address object from form data
      const address: Address = {
        street: data.street || "",
        city: data.city || "",
        state: data.state || "",
        postalCode: data.postalCode || "",
        country: data.country || "",
      };

      // Update profile photo if a new one was selected
      let photoURL = user.photoURL;
      
      if (profileImageFile) {
        // Create a storage reference
        const storageRef = ref(storage, `profile_images/${user.uid}`);
        
        // Upload the file
        await uploadBytes(storageRef, profileImageFile);
        
        // Get the download URL
        photoURL = await getDownloadURL(storageRef);
      }

      // Update Firebase Auth profile
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateFirebaseProfile(currentUser, {
          displayName: data.displayName,
          photoURL: photoURL || null,
        });
      }

      // Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: data.displayName,
        phoneNumber: data.phoneNumber || null,
        organizationName: data.organizationName || null,
        address: address,
        photoURL: photoURL || null,
        updatedAt: new Date().toISOString(),
      });

      // Show success message
      toast.success('Profile updated successfully');
      setProfileUpdateSuccess(true);

      // Update profile image URL state
      if (photoURL) {
        setProfileImageUrl(photoURL);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', {
        description: 'Please try again or contact support',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password form submission
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!user) return;
    
    // Verify email before allowing password change
    if (!isEmailVerified) {
      toast.error('Email verification required', {
        description: 'Please verify your email before changing your password',
      });
      return;
    }

    setIsLoading(true);
    setPasswordChangeSuccess(false);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('User not authenticated');
      }

      // Reauthenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        data.currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      
      // Change password
      await updatePassword(currentUser, data.newPassword);

      // Show success message
      toast.success('Password changed successfully');
      setPasswordChangeSuccess(true);
      
      // Reset form
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
        passwordForm.setError("currentPassword", {
          type: "manual",
          message: "Current password is incorrect",
        });
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Session expired', {
          description: 'Please log out and log back in to change your password',
        });
      } else {
        toast.error('Failed to change password', {
          description: 'Please try again or contact support',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email preferences form submission
  const onEmailPreferencesSubmit = async (data: EmailPreferencesValues) => {
    if (!user) return;

    setIsLoading(true);
    setPreferencesUpdateSuccess(false);

    try {
      // Update preferences in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'preferences.receiveNotifications': data.receiveNotifications,
        'preferences.emailFrequency': data.emailFrequency,
        'preferences.marketingEmails': data.marketingEmails,
        'preferences.receiveUpdates': data.receiveUpdates,
        updatedAt: new Date().toISOString(),
      });

      // Show success message
      toast.success('Email preferences updated successfully');
      setPreferencesUpdateSuccess(true);
    } catch (error) {
      console.error('Error updating email preferences:', error);
      toast.error('Failed to update email preferences', {
        description: 'Please try again or contact support',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile image selection
  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image too large', {
          description: 'Please select an image smaller than 2MB',
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type', {
          description: 'Please select an image file',
        });
        return;
      }
      
      // Set file for upload
      setProfileImageFile(file);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfileImageUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset success messages when tab changes
  const handleTabChange = (value: string) => {
    setProfileUpdateSuccess(false);
    setPasswordChangeSuccess(false);
    setPreferencesUpdateSuccess(false);
  };

  // Handle loading state
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Loading your profile information...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Profile Settings</h1>
      
      {!isEmailVerified && (
        <Alert className="mb-8" variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Email verification required</AlertTitle>
          <AlertDescription>
            Some features are limited until you verify your email address.
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => router.push('/profile/verify-email')}
            >
              Verify Email
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="preferences">Email Preferences</TabsTrigger>
        </TabsList>
        
        {/* Profile Information Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your profile information and address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                  {/* Profile Photo Upload */}
                  <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <Avatar className="h-24 w-24 border-2 border-muted">
                      <AvatarImage src={profileImageUrl || ""} alt={user.displayName} />
                      <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <h4 className="text-sm font-medium">Profile Picture</h4>
                      <p className="text-sm text-muted-foreground">
                        Upload a new profile picture. JPG, PNG or GIF, max 2MB.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => document.getElementById('profile-image-upload')?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                          <input
                            id="profile-image-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleProfileImageChange}
                          />
                        </Button>
                        {profileImageUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-destructive"
                            onClick={() => {
                              setProfileImageUrl(user.photoURL || null);
                              setProfileImageFile(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Profile Information */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Display Name */}
                    <FormField
                      control={profileForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Your name" />
                          </FormControl>
                          <FormDescription>
                            This is your public display name.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone Number */}
                    <FormField
                      control={profileForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Your phone number" />
                          </FormControl>
                          <FormDescription>
                            For contact purposes only.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Organization Name - Show only for donors and recipients */}
                    {(user.role === 'donor' || user.role === 'recipient') && (
                      <FormField
                        control={profileForm.control}
                        name="organizationName"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your organization name (if applicable)" />
                            </FormControl>
                            <FormDescription>
                              The name of your organization or business, if applicable.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <Separator />

                  {/* Address Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-primary" />
                      Address Information
                    </h3>
                    
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Street */}
                      <FormField
                        control={profileForm.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Street address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* City */}
                      <FormField
                        control={profileForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="City" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* State/Province */}
                      <FormField
                        control={profileForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="State or province" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Postal Code */}
                      <FormField
                        control={profileForm.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Postal code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Country */}
                      <FormField
                        control={profileForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Country" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Success Message */}
                  {profileUpdateSuccess && (
                    <Alert className="bg-green-50 border-green-200">
                      <Check className="h-4 w-4 text-green-500" />
                      <AlertTitle>Profile Updated</AlertTitle>
                      <AlertDescription>
                        Your profile information has been updated successfully.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading} className="flex items-center gap-1">
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Password Change Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isEmailVerified ? (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Email verification required</AlertTitle>
                  <AlertDescription>
                    You need to verify your email address before you can change your password.
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => router.push('/profile/verify-email')}
                    >
                      Verify Email
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 8 characters and include uppercase, number, and special character.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Success Message */}
                    {passwordChangeSuccess && (
                      <Alert className="bg-green-50 border-green-200">
                        <Check className="h-4 w-4 text-green-500" />
                        <AlertTitle>Password Changed</AlertTitle>
                        <AlertDescription>
                          Your password has been changed successfully.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLoading || !isEmailVerified} className="flex items-center gap-1">
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isLoading ? 'Changing Password...' : 'Change Password'}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Email Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Preferences
              </CardTitle>
              <CardDescription>
                Manage your email notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailPreferencesForm}>
                <form onSubmit={emailPreferencesForm.handleSubmit(onEmailPreferencesSubmit)} className="space-y-6">
                  <FormField
                    control={emailPreferencesForm.control}
                    name="receiveNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Receive Notifications
                          </FormLabel>
                          <FormDescription>
                            Receive notifications about donations, messages, and account activities.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={emailPreferencesForm.control}
                    name="emailFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Frequency</FormLabel>
                        <div className="grid grid-cols-3 gap-4">
                          <Button
                            type="button"
                            variant={field.value === 'immediate' ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => field.onChange('immediate')}
                          >
                            Immediate
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'daily' ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => field.onChange('daily')}
                          >
                            Daily Digest
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'weekly' ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => field.onChange('weekly')}
                          >
                            Weekly Digest
                          </Button>
                        </div>
                        <FormDescription>
                          How often you want to receive email notifications.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={emailPreferencesForm.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Marketing Emails
                          </FormLabel>
                          <FormDescription>
                            Receive emails about new features, tips, and promotions.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={emailPreferencesForm.control}
                    name="receiveUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Platform Updates
                          </FormLabel>
                          <FormDescription>
                            Receive emails about platform updates and important announcements.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Success Message */}
                  {preferencesUpdateSuccess && (
                    <Alert className="bg-green-50 border-green-200">
                      <Check className="h-4 w-4 text-green-500" />
                      <AlertTitle>Preferences Updated</AlertTitle>
                      <AlertDescription>
                        Your email preferences have been updated successfully.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading} className="flex items-center gap-1">
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isLoading ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

