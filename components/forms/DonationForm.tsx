'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ImageUploader } from '@/components/ui/image-uploader'; // Assuming ImageUploader is in ui
import { Donation, DonationStatus } from '@/lib/types/donation.types';
import { useAuth } from '@/hooks/useAuth';
import { createDonation } from '@/lib/donation-service';
import { uploadDonationImages } from '@/lib/image-service';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }).max(100, {
    message: 'Title must not exceed 100 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }).max(500, {
    message: 'Description must not exceed 500 characters.',
  }),
  quantity: z.number().min(1, {
    message: 'Quantity must be at least 1.',
  }).max(1000, {
    message: 'Quantity must not exceed 1000.',
  }),
  expiryDate: z.string().refine((dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date > new Date();
  }, {
    message: 'Expiry date must be a valid date in the future.',
  }),
  locationAddress: z.string().min(10, {
    message: 'Address must be at least 10 characters.',
  }).max(200, {
    message: 'Address must not exceed 200 characters.',
  }),
  imageFiles: z.array(z.instanceof(File)).optional(),
});

interface DonationFormProps {
  onSuccess?: () => void;
}

const DonationForm = ({ onSuccess }: DonationFormProps) => {
  const authContext = useAuth();
  const user = authContext?.user;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      quantity: 1,
      expiryDate: '',
      locationAddress: '',
      imageFiles: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error('You must be logged in to create a donation.');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (values.imageFiles && values.imageFiles.length > 0) {
        imageUrls = await uploadDonationImages(user.uid, values.imageFiles);
      }

      // Placeholder for actual lat/lng from address
      // In a real application, you would use a geocoding service here
      // In a real application, you would use a geocoding service here to get lat/lng from address
      const pickupAddress = {
        street: values.locationAddress, // Assuming locationAddress is the full street address
        city: 'Unknown', // TODO: Extract from address or add new form fields
        state: 'Unknown', // TODO: Extract from address or add new form fields
        postalCode: '00000', // TODO: Extract from address or add new form fields
        country: 'Unknown', // TODO: Extract from address or add new form fields
        latitude: 0, // TODO: Replace with actual latitude
        longitude: 0, // TODO: Replace with actual longitude
      };

      const newDonation: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'> = {
        donorId: user.uid,
        donorName: user.displayName || 'Anonymous Donor', // Assuming displayName is available
        title: values.title,
        description: values.description,
        quantity: values.quantity,
        quantityUnit: 'units', // Default unit, could be a form field
        expiryDate: new Date(values.expiryDate),
        pickupAddress: pickupAddress,
        status: DonationStatus.ACTIVE,
        imageUrls: imageUrls,
        category: 'Food', // Default category, could be a form field
      };

      await createDonation(newDonation);
      toast.success('Donation created successfully!');
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating donation:', error);
      toast.error('Failed to create donation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Donation Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Fresh Vegetables" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the items, quantity, and any special instructions." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity (in kg or units)</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={event => field.onChange(parseFloat(event.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiry Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pickup Address</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 123 Main St, Anytown" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageFiles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload Images (Optional)</FormLabel>
              <FormControl>
                <ImageUploader onImagesChange={(files: File[]) => field.onChange(files)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Donation...' : 'Create Donation'}
        </Button>
      </form>
    </Form>
  );
};

export default DonationForm;