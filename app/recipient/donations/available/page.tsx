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
import { GoogleMapComponent } from '@/components/GoogleMapComponent';

interface Donation {
  id: string;
  title: string;
  description: string;
  donorName: string;
  donorRating: number;
  category: string;
  quantity: number;
  quantityUnit: string;
  expiryDate: Date;
  pickupTimeStart: Date;
  pickupTimeEnd: Date;
  address: string;
  distance: number;
  imageUrl?: string;
  tags: string[];
  status: 'available' | 'reserved' | 'expired';
}

export default function AvailableDonationsPage() {
  const { user, loading, isAuthorized } = useAuth();
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAuthorized('recipient'))) {
      router.push('/auth/login');
    }
  }, [user, loading, isAuthorized, router]);

  useEffect(() => {
    // Mock data for available donations
    const mockDonations: Donation[] = [
      {
        id: '1',
        title: 'Fresh Organic Vegetables',
        description: 'Assorted fresh vegetables including carrots, lettuce, tomatoes, and bell peppers. All organic and freshly harvested.',
        donorName: 'Green Valley Farms',
        donorRating: 4.8,
        category: 'Fresh Produce',
        quantity: 25,
        quantityUnit: 'kg',
        expiryDate: new Date('2025-05-27'),
        pickupTimeStart: new Date('2025-05-25T09:00:00'),
        pickupTimeEnd: new Date('2025-05-25T17:00:00'),
        address: '123 Farm Road, Green Valley',
        distance: 2.5,
        imageUrl: '/images/vegetables.jpg',
        tags: ['Organic', 'Fresh', 'Local'],
        status: 'available'
      },
      {
        id: '2',
        title: 'Artisan Bread & Pastries',
        description: 'Fresh baked bread, croissants, and pastries from our daily production. Perfect for breakfast programs.',
        donorName: 'Sunshine Bakery',
        donorRating: 4.9,
        category: 'Bakery Items',
        quantity: 15,
        quantityUnit: 'loaves',
        expiryDate: new Date('2025-05-22'),
        pickupTimeStart: new Date('2025-05-21T18:00:00'),
        pickupTimeEnd: new Date('2025-05-21T20:00:00'),
        address: '456 Baker Street, Downtown',
        distance: 1.2,
        imageUrl: '/images/bread.jpg',
        tags: ['Fresh Baked', 'Artisan', 'Daily'],
        status: 'available'
      },
      {
        id: '3',
        title: 'Prepared Meals - Italian Cuisine',
        description: 'Ready-to-eat Italian meals including pasta, pizza, and salads. Prepared fresh today.',
        donorName: 'Bella Vista Restaurant',
        donorRating: 4.7,
        category: 'Prepared Meals',
        quantity: 30,
        quantityUnit: 'portions',
        expiryDate: new Date('2025-05-21'),
        pickupTimeStart: new Date('2025-05-21T20:00:00'),
        pickupTimeEnd: new Date('2025-05-21T22:00:00'),
        address: '789 Restaurant Row, Little Italy',
        distance: 3.1,
        imageUrl: '/images/italian-food.jpg',
        tags: ['Ready to Eat', 'Italian', 'Hot'],
        status: 'available'
      },
      {
        id: '4',
        title: 'Canned Goods & Non-Perishables',
        description: 'Variety of canned vegetables, soups, pasta, rice, and other shelf-stable items.',
        donorName: 'Community Pantry',
        donorRating: 4.6,
        category: 'Canned Goods',
        quantity: 50,
        quantityUnit: 'items',
        expiryDate: new Date('2025-12-31'),
        pickupTimeStart: new Date('2025-05-22T10:00:00'),
        pickupTimeEnd: new Date('2025-05-22T16:00:00'),
        address: '321 Community Center Dr, Midtown',
        distance: 4.2,
        imageUrl: '/images/canned-goods.jpg',
        tags: ['Long Shelf Life', 'Variety', 'Bulk'],
        status: 'available'
      }
    ];

    setDonations(mockDonations);
    setFilteredDonations(mockDonations);
    setIsLoading(false);
  }, []);

  // Filter and sort donations
  useEffect(() => {
    let filtered = donations.filter(donation => {
      const matchesSearch = donation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           donation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           donation.donorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || donation.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort donations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'expiry':
          return a.expiryDate.getTime() - b.expiryDate.getTime();
        case 'quantity':
          return b.quantity - a.quantity;
        case 'rating':
          return b.donorRating - a.donorRating;
        default:
          return 0;
      }
    });

    setFilteredDonations(filtered);
  }, [donations, searchQuery, selectedCategory, sortBy]);

  const categories = ['all', 'Fresh Produce', 'Bakery Items', 'Prepared Meals', 'Canned Goods', 'Dairy Products'];

  const handleReserveDonation = async (donationId: string) => {
    try {
      // In a real app, this would make an API call
      toast.success('Donation reserved successfully!');
      // Update local state
      setDonations(prev => prev.map(d =>
        d.id === donationId ? { ...d, status: 'reserved' as const } : d
      ));
    } catch (error) {
      toast.error('Failed to reserve donation. Please try again.');
    }
  };

  if (loading || !user || !isAuthorized('recipient')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div>Loading...</div>
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
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="expiry">Expiry Date</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                  <SelectItem value="rating">Donor Rating</SelectItem>
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
            {isLoading ? (
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