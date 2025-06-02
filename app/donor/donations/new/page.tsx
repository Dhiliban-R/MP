'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, ImagePlus, X, MapPin } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DonationStatus, Address } from '@/lib/types';
import { useAppStore } from '@/store/store';

// Define the form schema with Zod
const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters' }).max(100),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }).max(500),
  category: z.string().min(1, { message: 'Please select a category' }),
  quantity: z.number().positive({ message: 'Quantity must be positive' }),
  quantityUnit: z.string().min(1, { message: 'Please specify the unit' }),
  expiryDate: z.date().min(new Date(), { message: 'Expiry date must be in the future' }),
  pickupAddress: z.object({
    street: z.string().min(1, { message: 'Street address is required' }),
    city: z.string().min(1, { message: 'City is required' }),
    state: z.string().min(1, { message: 'State is required' }),
    postalCode: z.string().min(1, { message: 'Postal code is required' }),
    country: z.string().min(1, { message: 'Country is required' }),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  imageUrls: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const foodCategories = [
  'Fresh Produce',
  'Bakery Items',
  'Dairy Products',
  'Canned Goods',
  'Prepared Meals',
  'Beverages',
  'Grains & Pasta',
  'Meat & Seafood',
  'Snacks',
  'Baby Food',
  'Other'
];

const quantityUnits = [
  'kg',
  'lbs',
  'items',
  'servings',
  'boxes',
  'cans',
  'bottles',
  'packages',
  'loaves',
  'liters',
  'gallons',
  'meals',
  'other'
];

export default function DonationForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const { mapCenter } = useAppStore();

  const { register, handleSubmit, control, setValue, formState: { errors }, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      quantity: 1,
      quantityUnit: 'items',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
      pickupAddress: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        postalCode: user?.address?.postalCode || '',
        country: user?.address?.country || 'USA',
        latitude: user?.address?.latitude,
        longitude: user?.address?.longitude,
      },
      imageUrls: [],
    }
  });

  // Pre-fill address if user has one
  useEffect(() => {
    if (user?.address) {
      setValue('pickupAddress', {
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        postalCode: user.address.postalCode || '',
        country: user.address.country || 'USA',
        latitude: user.address.latitude,
        longitude: user.address.longitude,
      });
    }
  }, [user, setValue]);

  // Redirect if not a donor
  useEffect(() => {
    if (!loading && (!user || user.role !== 'donor')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Limit to 5 images total
      const totalImages = imageFiles.length + newFiles.length;
      if (totalImages > 5) {
        toast.error('Maximum 5 images allowed');
        return;
      }
      
      setImageFiles(prev => [...prev, ...newFiles]);
      
      // Create preview URLs
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  // Remove an image
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Use current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Update form values
          setValue('pickupAddress.latitude', latitude);
          setValue('pickupAddress.longitude', longitude);
          
          // Use reverse geocoding to get address (in a real app)
          // For now, just set the coordinates
          setIsUsingCurrentLocation(true);
          setLocationLoading(false);
          
          toast.success('Location updated successfully');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get your location. Please enter address manually.');
          setLocationLoading(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  // Upload images to Firebase Storage
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    
    const uploadPromises = files.map(async (file) => {
      const storageRef = ref(storage, `donations/${user?.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      return getDownloadURL(snapshot.ref);
    });
    
    return Promise.all(uploadPromises);
  };

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to create a donation');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload images first
      const imageUrls = await uploadImages(imageFiles);
      
      // Prepare donation data
      const donationData = {
        ...data,
        imageUrls,
        donorId: user.uid,
        donorName: user.displayName,
        status: DonationStatus.ACTIVE,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'donations'), donationData);
      
      toast.success('Donation created successfully!');
      
      // Redirect to donation details page
      router.push(`/donor/donations/${docRef.id}`);
    } catch (error) {
      console.error('Error creating donation:', error);
      toast.error('Failed to create donation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user || user.role !== 'donor') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
          Create New Donation
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          List food items you'd like to donate
        </p>
      </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Donation Details</CardTitle>
              <CardDescription>
                Provide information about the food items you're donating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="E.g., Fresh vegetables from local farm"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                <Textarea
                  id="description"
                  placeholder="Describe the food items, their condition, and any other relevant details"
                  rows={4}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {foodCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              {/* Quantity and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity <span className="text-destructive">*</span></Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    {...register('quantity', { valueAsNumber: true })}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-destructive">{errors.quantity.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantityUnit">Unit <span className="text-destructive">*</span></Label>
                  <Controller
                    name="quantityUnit"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {quantityUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.quantityUnit && (
                    <p className="text-sm text-destructive">{errors.quantityUnit.message}</p>
                  )}
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date <span className="text-destructive">*</span></Label>
                <Controller
                  name="expiryDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.expiryDate && (
                  <p className="text-sm text-destructive">{errors.expiryDate.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pickup Address */}
          <Card>
            <CardHeader>
              <CardTitle>Pickup Address</CardTitle>
              <CardDescription>
                Where can recipients pick up the donation?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label>Address Details <span className="text-destructive">*</span></Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Use Current Location
                </Button>
              </div>

              {/* Street */}
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  placeholder="123 Main St"
                  {...register('pickupAddress.street')}
                />
                {errors.pickupAddress?.street && (
                  <p className="text-sm text-destructive">{errors.pickupAddress.street.message}</p>
                )}
              </div>

              {/* City, State, Postal Code */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    {...register('pickupAddress.city')}
                  />
                  {errors.pickupAddress?.city && (
                    <p className="text-sm text-destructive">{errors.pickupAddress.city.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    {...register('pickupAddress.state')}
                  />
                  {errors.pickupAddress?.state && (
                    <p className="text-sm text-destructive">{errors.pickupAddress.state.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    placeholder="Postal Code"
                    {...register('pickupAddress.postalCode')}
                  />
                  {errors.pickupAddress?.postalCode && (
                    <p className="text-sm text-destructive">{errors.pickupAddress.postalCode.message}</p>
                  )}
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  {...register('pickupAddress.country')}
                />
                {errors.pickupAddress?.country && (
                  <p className="text-sm text-destructive">{errors.pickupAddress.country.message}</p>
                )}
              </div>

              {isUsingCurrentLocation && (
                <div className="text-sm text-muted-foreground">
                  Using your current location coordinates. You can still edit the address fields above.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images (Optional)</CardTitle>
              <CardDescription>
                Add up to 5 images of the food items you're donating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative w-24 h-24">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {imagePreviewUrls.length < 5 && (
                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-md border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors">
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-2">Add Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Adding clear images helps recipients better understand what you're donating.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Donation...
                </>
              ) : (
                'Create Donation'
              )}
            </Button>
          </div>
        </form>
    </div>
  );
}
