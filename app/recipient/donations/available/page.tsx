'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Package,
  Truck,
  Calendar,
  Star,
  Heart,
  Eye
} from 'lucide-react';
import { MapView } from '@/components/ui/map-view'; // Import MapView
import { useDonations } from '@/hooks/use-donations';
import { Donation, DonationStatus } from '@/lib/types'; // Assuming global Donation type
import { format } from 'date-fns'; // For date formatting

export default function AvailableDonationsPage() {
  const { user, loading: authLoading, isAuthorized } = useAuth();
  const router = useRouter();

  const {
    donations: allFetchedDonations,
    loading: donationsLoading,
    error: donationsError,
    reserveDonation: hookReserveDonation, // Use from hook
    refreshDonations // Use from hook
  } = useDonations({ realtime: true }); // Fetches available donations by default

  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('expiryDate'); // Default sort by expiry
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    if (!authLoading && (!user || !isAuthorized('recipient'))) {
      router.push('/auth/login?message=Please log in as a recipient to view available donations.');
    }
  }, [user, authLoading, isAuthorized, router]);

  useEffect(() => {
    if (donationsError) {
      toast.error(donationsError || 'Failed to load donations.');
    }
  }, [donationsError]);

  // Filter and sort donations
  useEffect(() => {
    let currentDonations = allFetchedDonations || [];

    let filtered = currentDonations.filter(donation => {
      const matchesSearch = donation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (donation.description && donation.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           (donation.donorName && donation.donorName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || donation.category === selectedCategory;
      // Ensure only active donations are shown, hook should already do this, but as a safeguard
      return matchesSearch && matchesCategory && donation.status === DonationStatus.ACTIVE;
    });

    // Sort donations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'expiryDate':
          return (new Date(a.expiryDate)).getTime() - (new Date(b.expiryDate)).getTime();
        case 'quantity':
          return b.quantity - a.quantity;
        // Add other relevant sort options if needed, e.g., createdAt
        case 'createdAt':
          return (new Date(b.createdAt || 0)).getTime() - (new Date(a.createdAt || 0)).getTime();
        default:
          return 0;
      }
    });

    setFilteredDonations(filtered);
  }, [allFetchedDonations, searchQuery, selectedCategory, sortBy]);

  const categories = ['all', 'Fresh Produce', 'Bakery Items', 'Prepared Meals', 'Canned Goods', 'Dairy Products', 'Beverages', 'Grains & Pasta', 'Meat & Seafood', 'Snacks', 'Baby Food', 'Other'];

  const handleReserveDonation = async (donationId: string) => {
    if (!user) {
      toast.error('You must be logged in to reserve a donation.');
      return;
    }
    try {
      // Assuming user.displayName can be used as recipientName
      await hookReserveDonation(donationId, user.displayName || 'Recipient');
      // Real-time updates should handle UI change, or call refreshDonations if needed
      // For immediate feedback, can optimistically update or rely on toast from hook
    } catch (error) {
      // Error is already handled by the hook's toast
    }
  };

  if (authLoading || (donationsLoading && !allFetchedDonations.length)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center">
          <Search className="h-6 w-6 animate-pulse mr-2" />
          <span>Loading available donations...</span>
        </div>
      </div>
    );
  }

  if (donationsError && !allFetchedDonations.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Package className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Donations</h2>
        <p className="text-muted-foreground mb-4">{donationsError}</p>
        <Button onClick={() => refreshDonations && refreshDonations()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
          Find Available Donations
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          Discover food donations available in your area
        </p>
      </div>
        {/* Search and Filter Controls */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-gray-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search & Filter Donations
            </CardTitle>
            <CardDescription>
              Find the perfect donations for your organization's needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search Input */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search donations, donors, or descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white shadow-sm"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white shadow-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white shadow-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expiryDate">Expiry Date</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                  <SelectItem value="createdAt">Date Added</SelectItem>
                  {/* Removed distance and rating as they are not in global Donation type */}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Found {filteredDonations.length} donation{filteredDonations.length !== 1 ? 's' : ''}
              </div>
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'map')}>
                <TabsList className="bg-white shadow-sm">
                  <TabsTrigger value="list" className="gap-2">
                    <Package className="h-4 w-4" />
                    List View
                  </TabsTrigger>
                  <TabsTrigger value="map" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Map View
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        {viewMode === 'list' ? (
          /* List View */
          <div className="space-y-4">
            {(donationsLoading && filteredDonations.length === 0) ? ( // Show skeleton if loading and no data yet
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDonations.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No donations found</h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search criteria or check back later for new donations.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredDonations.map((donation) => (
                  <Card key={donation.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                    {/* Donation Image */}
                    <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="h-16 w-16 text-primary/30" />
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="bg-white/90 text-gray-700">
                          {donation.category}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className="bg-white/90 border-green-200 text-green-700">
                          {donation.distance} km away
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Title and Description */}
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                            {donation.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {donation.description}
                          </p>
                        </div>

                        {/* Donor Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {donation.donorName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{donation.donorName}</p>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-500">{donation.donorRating}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {donation.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {donation.quantity} {donation.quantityUnit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              Expires {donation.expiryDate.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {donation.pickupTimeStart.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 truncate">
                              {donation.address.split(',')[0]}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
                            onClick={() => handleReserveDonation(donation.id)}
                            disabled={donation.status === 'reserved'}
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            {donation.status === 'reserved' ? 'Reserved' : 'Reserve'}
                          </Button>
                          <Button variant="outline" size="icon" className="shadow-md">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="shadow-md">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Map View */
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Donation Locations Map
              </CardTitle>
              <CardDescription>
                View all available donations on an interactive map
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Interactive map will be displayed here</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Showing {filteredDonations.length} donation locations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}