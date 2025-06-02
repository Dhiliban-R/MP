'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  Copy,
  Save,
  X,
  Package,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { createDonation } from '@/lib/donation-service';
import { DonationStatus } from '@/lib/types/donation.types';
import { toast } from 'sonner';

interface BulkDonationItem {
  id: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  quantityUnit: string;
  expiryDate: string;
  pickupInstructions: string;
}

interface BulkDonationCreatorProps {
  onSuccess?: () => void;
  className?: string;
}

const DONATION_CATEGORIES = [
  'Fresh Produce',
  'Dairy Products',
  'Meat & Poultry',
  'Bakery Items',
  'Canned Goods',
  'Frozen Foods',
  'Beverages',
  'Prepared Meals',
  'Snacks',
  'Other'
];

const QUANTITY_UNITS = [
  'kg', 'lbs', 'pieces', 'boxes', 'bags', 'bottles', 'cans', 'servings', 'liters', 'gallons'
];

export const BulkDonationCreator: React.FC<BulkDonationCreatorProps> = ({
  onSuccess,
  className = ''
}) => {
  const authContext = useAuth();
  const user = authContext?.user;
  const [donations, setDonations] = useState<BulkDonationItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [template, setTemplate] = useState<Partial<BulkDonationItem>>({
    category: '',
    quantityUnit: 'kg',
    expiryDate: '',
    pickupInstructions: ''
  });

  const createEmptyDonation = (): BulkDonationItem => ({
    id: Math.random().toString(36).substr(2, 9),
    title: '',
    description: '',
    category: template.category || '',
    quantity: 1,
    quantityUnit: template.quantityUnit || 'kg',
    expiryDate: template.expiryDate || '',
    pickupInstructions: template.pickupInstructions || ''
  });

  const addDonation = () => {
    setDonations(prev => [...prev, createEmptyDonation()]);
  };

  const removeDonation = (id: string) => {
    setDonations(prev => prev.filter(d => d.id !== id));
  };

  const updateDonation = (id: string, field: keyof BulkDonationItem, value: any) => {
    setDonations(prev => prev.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const duplicateDonation = (id: string) => {
    const donation = donations.find(d => d.id === id);
    if (donation) {
      const newDonation = {
        ...donation,
        id: Math.random().toString(36).substr(2, 9),
        title: `${donation.title} (Copy)`
      };
      setDonations(prev => [...prev, newDonation]);
    }
  };

  const applyTemplate = () => {
    setDonations(prev => prev.map(d => ({
      ...d,
      category: template.category || d.category,
      quantityUnit: template.quantityUnit || d.quantityUnit,
      expiryDate: template.expiryDate || d.expiryDate,
      pickupInstructions: template.pickupInstructions || d.pickupInstructions
    })));
  };

  const validateDonations = (): string[] => {
    const errors: string[] = [];
    
    donations.forEach((donation, index) => {
      if (!donation.title.trim()) {
        errors.push(`Donation ${index + 1}: Title is required`);
      }
      if (!donation.description.trim()) {
        errors.push(`Donation ${index + 1}: Description is required`);
      }
      if (!donation.category) {
        errors.push(`Donation ${index + 1}: Category is required`);
      }
      if (donation.quantity <= 0) {
        errors.push(`Donation ${index + 1}: Quantity must be greater than 0`);
      }
      if (!donation.expiryDate) {
        errors.push(`Donation ${index + 1}: Expiry date is required`);
      }
    });

    return errors;
  };

  const handleCreateDonations = async () => {
    if (!user) {
      toast.error('You must be logged in to create donations');
      return;
    }

    const errors = validateDonations();
    if (errors.length > 0) {
      toast.error('Please fix the following errors:', {
        description: errors.slice(0, 3).join(', ') + (errors.length > 3 ? '...' : '')
      });
      return;
    }

    setIsCreating(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const donation of donations) {
        try {
          await createDonation({
            title: donation.title,
            description: donation.description,
            category: donation.category,
            quantity: donation.quantity,
            quantityUnit: donation.quantityUnit,
            expiryDate: new Date(donation.expiryDate),
            pickupInstructions: donation.pickupInstructions,
            donorId: user.uid,
            donorName: user.displayName || 'Anonymous',
            imageUrls: [],
            status: DonationStatus.ACTIVE,
            pickupAddress: {
              street: '',
              city: '',
              state: '',
              postalCode: '',
              country: '',
              latitude: 0,
              longitude: 0
            }
          });
          successCount++;
        } catch (error) {
          console.error('Error creating donation:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} donation(s)`);
        setDonations([]);
        onSuccess?.();
      }

      if (errorCount > 0) {
        toast.error(`Failed to create ${errorCount} donation(s)`);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const exportTemplate = () => {
    const csvContent = [
      ['Title', 'Description', 'Category', 'Quantity', 'Unit', 'Expiry Date', 'Pickup Instructions'].join(','),
      ...donations.map(d => [
        `"${d.title}"`,
        `"${d.description}"`,
        `"${d.category}"`,
        d.quantity,
        `"${d.quantityUnit}"`,
        d.expiryDate,
        `"${d.pickupInstructions}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-donations-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Bulk Donation Creator</span>
            <Badge variant="secondary">{donations.length} items</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={addDonation}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Template Settings */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Template Settings</span>
            </h3>
            <Button size="sm" onClick={applyTemplate}>
              Apply to All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Default Category</Label>
              <Select
                value={template.category}
                onValueChange={(value) => setTemplate(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DONATION_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Unit</Label>
              <Select
                value={template.quantityUnit}
                onValueChange={(value) => setTemplate(prev => ({ ...prev, quantityUnit: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUANTITY_UNITS.map(unit => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Expiry Date</Label>
              <Input
                type="date"
                value={template.expiryDate}
                onChange={(e) => setTemplate(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Instructions</Label>
              <Input
                placeholder="Pickup instructions"
                value={template.pickupInstructions}
                onChange={(e) => setTemplate(prev => ({ ...prev, pickupInstructions: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        <Separator />

        {/* Donation Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Donation Items</h3>
            {donations.length === 0 && (
              <Button onClick={addDonation}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            )}
          </div>

          {donations.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No donations added yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first donation item
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {donations.map((donation, index) => (
                  <Card key={donation.id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => duplicateDonation(donation.id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeDonation(donation.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          placeholder="Donation title"
                          value={donation.title}
                          onChange={(e) => updateDonation(donation.id, 'title', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select
                          value={donation.category}
                          onValueChange={(value) => updateDonation(donation.id, 'category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {DONATION_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            min="1"
                            value={donation.quantity}
                            onChange={(e) => updateDonation(donation.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="flex-1"
                          />
                          <Select
                            value={donation.quantityUnit}
                            onValueChange={(value) => updateDonation(donation.id, 'quantityUnit', value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUANTITY_UNITS.map(unit => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Expiry Date *</Label>
                        <Input
                          type="date"
                          value={donation.expiryDate}
                          onChange={(e) => updateDonation(donation.id, 'expiryDate', e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label>Description *</Label>
                        <Textarea
                          placeholder="Describe the donation"
                          value={donation.description}
                          onChange={(e) => updateDonation(donation.id, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label>Pickup Instructions</Label>
                        <Input
                          placeholder="Special pickup instructions"
                          value={donation.pickupInstructions}
                          onChange={(e) => updateDonation(donation.id, 'pickupInstructions', e.target.value)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Actions */}
        {donations.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>All donations will use your current location as pickup address</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setDonations([])}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button onClick={handleCreateDonations} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create {donations.length} Donation{donations.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
