'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorOption, FieldError, FieldValues, FormState, ReadFormState, RegisterOptions, useForm, UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Package, Image, Loader2, Save, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MapView } from '@/components/ui/map-view';
import { Address, Donation } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { useParams } from 'next/navigation';

const categoryOptions = [
  'Fresh Produce',
  'Bakery Items',
  'Canned Goods',
  'Dairy Products',
  'Meat & Seafood',
  'Prepared Meals',
  'Dry Goods & Pasta',
  'Frozen Foods',
  'Beverages',
  'Other',
];

const quantityUnitOptions = [
  'kg',
  'lbs',
  'items',
  'packages',
  'servings',
  'cans',
  'bottles',
  'boxes',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const donationFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  category: z.string().min(1, { message: 'Please select a category.' }),
  quantity: z.coerce.number().min(1, { message: 'Quantity must be at least 1.' }),
  quantityUnit: z.string().min(1, { message: 'Please select a unit.' }),
  expiryDate: z.date().min(new Date(), { message: 'Expiry date must be in the future.' }),
  images: z
    .custom<FileList | string[]>((val) => val instanceof FileList || Array.isArray(val), { // Allow FileList or string[]
      message: 'Please select at least one image.',
    })
    .refine((files) => (Array.isArray(files) ? files.length > 0 : files.length > 0), { message: 'Please select at least one image.' })
    .refine(
      (files) => Array.from(files instanceof FileList ? files : []).every((file) => file.size <= MAX_FILE_SIZE), // Only check size for new files
      `Max image size is 5MB.`
    )
    .refine(
      (files) => Array.from(files instanceof FileList ? files : []).every((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)), // Only check type for new files
      'Only .jpg, .jpeg, .png and .webp files are accepted.'
    ),
  pickupInstructions: z.string().optional(),
  useCurrentLocation: z.boolean().default(true).optional(),
  pickupAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
});


interface DonationFormValues extends z.infer<typeof donationFormSchema> {}

interface EditDonationPageProps {
  pickupInstructions?: string;
}
export default function EditDonationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ donationId: string }>();
  const donationId = params.donationId;
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDonation, setLoadingDonation] = useState<boolean>(true);
  const [donation, setDonation] = useState<Donation | null>(null);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { control, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm<DonationFormValues>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      quantity: 1,
      quantityUnit: 'kg',
      expiryDate: undefined,
      images: [],
      pickupInstructions: '',
      useCurrentLocation: true,
      pickupAddress: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
    },
  });

  const fetchCurrentLocation = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          if (error.code === error.PERMISSION_DENIED) {
            toast.info('Location access denied. Please manually enter the pickup address.');
          } else {
            toast.error('Unable to get your current location.');
          }
        }
      );
    } else {
    }
  }, [setValue]);

  // Fetch donation data
  useEffect(() => {
    // Set default expiry date to today initially
    setValue('expiryDate', new Date());
    // Fetch current location on component mount
    fetchCurrentLocation();

    const fetchDonation = async () => {
      if (!donationId || typeof donationId !== 'string') {
        toast.error('Invalid donation ID.');
        setLoadingDonation(false);
        return;
      }

      try {
        const docRef = doc(db, 'donations', donationId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const donationData = {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: (docSnap.data().createdAt as any)?.toDate() || new Date(),
            updatedAt: (docSnap.data().updatedAt as any)?.toDate() || new Date(),
            expiryDate: (docSnap.data().expiryDate as any)?.toDate() || new Date(),
            completedAt: (docSnap.data().completedAt as any)?.toDate() || null,
            reservedAt: (docSnap.data().reservedAt as any)?.toDate() || null,
          } as Donation;
          setDonation(donationData);
          setExistingImageUrls(donationData.imageUrls || []);
          setSelectedImages(donationData.imageUrls || []); // Initialize displayed images with existing ones

          // Set form default values
          reset({
            title: donationData.title,
            description: donationData.description,
            category: donationData.category,
            quantity: donationData.quantity,
            quantityUnit: donationData.quantityUnit,
            expiryDate: donationData.expiryDate,
            pickupInstructions: (donationData as any).pickupInstructions || '',
            useCurrentLocation: !(donationData.pickupAddress?.street || donationData.pickupAddress?.latitude), // Default to true if no address is set
            pickupAddress: donationData.pickupAddress || {},
            images: donationData.imageUrls || [], // Initialize images field with existing URLs
          });

        } else {
          toast.error('Donation not found.');
          router.push('/donor/donations/active'); // Redirect if donation not found
        }
      } catch (err) {
        console.error('Error fetching donation:', err);
        toast.error('Failed to load donation details for editing.');
        router.push('/donor/donations/active');
      } finally {
 setLoadingDonation(false);
      }
    }; 

    fetchDonation(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donationId, router, reset, donationId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesArray = Array.from(files);

    // Create preview URLs for new files
    const newImageUrls: string[] = filesArray.map((file: File) => URL.createObjectURL(file));
    setSelectedImages((prev: string[]) => [...prev, ...newImageUrls]);
    // Update form value with both existing and new files

    // Get current files from the form state
    const currentFiles = control._formValues.images && control._formValues.images instanceof FileList ? Array.from(control._formValues.images) : [];
    // Combine existing files (if they were File objects) and new files
    const updatedFiles = [...currentFiles.filter(file => file instanceof File), ...filesArray];
    const dataTransfer = new DataTransfer();
    updatedFiles.forEach(file => dataTransfer.items.add(file));
  };

  const removeImage = (index: number, isExisting: boolean) => {
    const imageUrlToRemove = selectedImages[index];

    if (isExisting) {
      // Remove from existing URLs and selected images
      setExistingImageUrls((prev: string[]) => prev.filter((url) => url !== imageUrlToRemove));
      setSelectedImages((prev: string[]) => prev.filter((url) => url !== imageUrlToRemove));

    } else {
      // Remove from new files and selected images
      const fileToRemove = selectedImages[index]; // This is a preview URL, need to find the corresponding File object
      setSelectedImages((prev: string[]) => prev.filter((url) => url !== imageUrlToRemove));
      URL.revokeObjectURL(imageUrlToRemove); // Clean up preview URL

      // Update form value with remaining new files
      const currentFiles = control._formValues.images && control._formValues.images instanceof FileList ? Array.from(control._formValues.images) : [];
      // Filter out the file that corresponds to the removed preview URL
      const remainingFiles = currentFiles.filter(file => URL.createObjectURL(file) !== imageUrlToRemove);
      const dataTransfer = new DataTransfer();
      setValue('images', dataTransfer.files);
    }
  };

  const onSubmit = async (data: DonationFormValues) => {
    if (!user || !donation) {
      toast.error('User or donation data is missing.');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare address data
      let pickupAddress: Address = {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      };

      if (data.useCurrentLocation && currentLocation) {
        pickupAddress = {
          ...pickupAddress,
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
        };
      } else if (data.pickupAddress) {
        pickupAddress = data.pickupAddress as Address;
      }

      // Upload new images
      const newImageUrls: string[] = [];
      const newFiles = Array.from(data.images || []).filter(file => file instanceof File) as File[];

      for (const file of newFiles) {
        // Generate a unique path for each image
        const imageRef = ref(storage, `donations/${donationId}/${file.name}`);
        await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(imageRef);
        newImageUrls.push(downloadURL);
      }

      // Combine existing and new image URLs
      const finalImageUrls = [...existingImageUrls, ...newImageUrls]; // Combine existing and newly uploaded URLs

      // Update the donation via API
      const response = await fetch('/api/donations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: donationId,
          title: data.title,
          description: data.description,
          category: data.category,
          quantity: data.quantity,
          quantityUnit: data.quantityUnit,
          pickupAddress,
          pickupInstructions: data.pickupInstructions || '',
          expiryDate: data.expiryDate,
          imageUrls: finalImageUrls,
          updatedAt: new Date(),
        }),
      });
      if (!response.ok) throw new Error('Failed to update donation');
      toast.success('Donation updated successfully!');
      router.push('/donor/donations/active');
    } catch (error) {
      console.error('Error updating donation:', error);
      toast.error('Failed to update donation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete donation handler
  const handleDelete = async () => {
    if (!donationId) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/donations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: donationId }),
      });
      if (!response.ok) throw new Error('Failed to delete donation');
      toast.success('Donation deleted successfully!');
      router.push('/donor/donations/active');
    } catch (error) {
      console.error('Error deleting donation:', error);
      toast.error('Failed to delete donation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickupLocation = watch('useCurrentLocation') && currentLocation
    ? currentLocation
    : (watch('pickupAddress.latitude') && watch('pickupAddress.longitude')
      ? { lat: watch('pickupAddress.latitude'), lng: watch('pickupAddress.longitude') }
      : null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-heading font-bold">Edit Donation</h2>
        <p className="text-muted-foreground">Modify the details of your food donation</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Donation Details</CardTitle>
            <CardDescription>
              Update information about the food items
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDonation ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading donation details...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <p>Edit donation functionality is temporarily disabled for maintenance.</p>
                <Button onClick={() => router.push('/donor/donations/active')}>
                  Back to Active Donations
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}