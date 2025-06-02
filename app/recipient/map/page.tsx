'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import React, { Suspense } from 'react';
const MapView = React.lazy(() => import('@/components/ui/map-view').then(mod => ({ default: mod.MapView })));
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, ListFilter } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Donation, DonationStatus } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

export default function RecipientMapPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableDonations = async () => {
      try {
        // In a real app, this would fetch from Firestore
        // For demo, we're using mock data
        
        // Mock available donations with location data
        const mockDonations = [
          {
            id: 'm1',
            donorId: 'd1',
            donorName: 'Green Valley Farms',
            title: 'Fresh vegetables',
            description: 'Variety of fresh vegetables including lettuce, carrots, and tomatoes',
            category: 'Fresh Produce',
            quantity: 20,
            quantityUnit: 'kg',
            imageUrls: [],
            pickupAddress: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              postalCode: '10001',
              country: 'USA',
              latitude: 40.730610 + 0.01,
              longitude: -73.935242 - 0.01
            },
            expiryDate: new Date('2025-05-30'),
            createdAt: new Date(),
            updatedAt: new Date(),
            status: DonationStatus.ACTIVE
          },
          {
            id: 'm2',
            donorId: 'd2',
            donorName: 'Metro Grocery',
            title: 'Bread and pastries',
            description: 'Day-old bread and pastries still fresh for consumption',
            category: 'Bakery Items',
            quantity: 15,
            quantityUnit: 'items',
            imageUrls: [],
            pickupAddress: {
              street: '456 Broadway',
              city: 'New York',
              state: 'NY',
              postalCode: '10002',
              country: 'USA',
              latitude: 40.730610 - 0.01,
              longitude: -73.935242 + 0.005
            },
            expiryDate: new Date('2025-05-28'),
            createdAt: new Date(),
            updatedAt: new Date(),
            status: DonationStatus.ACTIVE
          },
          {
            id: 'm3',
            donorId: 'd3',
            donorName: 'Community Kitchen',
            title: 'Prepared meals',
            description: 'Prepared meals ready for pickup and distribution',
            category: 'Prepared Meals',
            quantity: 30,
            quantityUnit: 'meals',
            imageUrls: [],
            pickupAddress: {
              street: '789 Park Ave',
              city: 'New York',
              state: 'NY',
              postalCode: '10003',
              country: 'USA',
              latitude: 40.730610 + 0.005,
              longitude: -73.935242 + 0.01
            },
            expiryDate: new Date('2025-05-26'),
            createdAt: new Date(),
            updatedAt: new Date(),
            status: DonationStatus.ACTIVE
          },
          {
            id: 'm4',
            donorId: 'd4',
            donorName: 'Local Restaurant',
            title: 'Surplus prepared food',
            description: 'End of day prepared food items',
            category: 'Prepared Meals',
            quantity: 12,
            quantityUnit: 'portions',
            imageUrls: [],
            pickupAddress: {
              street: '101 5th Ave',
              city: 'New York',
              state: 'NY',
              postalCode: '10011',
              country: 'USA',
              latitude: 40.740610,
              longitude: -73.995242
            },
            expiryDate: new Date('2025-05-26'),
            createdAt: new Date(),
            updatedAt: new Date(),
            status: DonationStatus.ACTIVE
          },
          {
            id: 'm5',
            donorId: 'd5',
            donorName: 'Grocery Co-op',
            title: 'Canned goods',
            description: 'Assorted canned vegetables and fruits',
            category: 'Canned Goods',
            quantity: 50,
            quantityUnit: 'cans',
            imageUrls: [],
            pickupAddress: {
              street: '222 Hudson St',
              city: 'New York',
              state: 'NY',
              postalCode: '10013',
              country: 'USA',
              latitude: 40.726650,
              longitude: -74.008846
            },
            expiryDate: new Date('2025-08-15'),
            createdAt: new Date(),
            updatedAt: new Date(),
            status: DonationStatus.ACTIVE
          }
        ];

        setDonations(mockDonations);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching donations:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchAvailableDonations();
    }
  }, [user]);

  // Filter donations based on active tab (category)
  const filteredDonations = donations.filter(donation => {
    if (activeTab === 'all') return true;
    return donation.category.toLowerCase().includes(activeTab.toLowerCase());
  });

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading map data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-heading font-bold">Find Available Donations</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            Search Area
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Available Donations Near You</CardTitle>
              <CardDescription>Find and reserve food donations in your area</CardDescription>
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all" className="text-xs">All Types</TabsTrigger>
                <TabsTrigger value="fresh produce" className="text-xs">Produce</TabsTrigger>
                <TabsTrigger value="bakery" className="text-xs">Bakery</TabsTrigger>
                <TabsTrigger value="prepared" className="text-xs">Prepared</TabsTrigger>
                <TabsTrigger value="canned" className="text-xs">Canned</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-6">
          <Suspense fallback={<div>Loading map...</div>}>
            <MapView 
              donations={filteredDonations} 
              height="500px" 
              initialZoom={13} 
              showUserLocation={true}
              markerType="donation"
            />
          </Suspense>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Donation Categories</CardTitle>
            <CardDescription>Types of donations available nearby</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                <div>
                  <p className="font-medium">Fresh Produce</p>
                  <p className="text-sm text-muted-foreground">Fruits, vegetables</p>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {donations.filter(d => d.category.toLowerCase().includes('produce')).length}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-secondary/5 rounded-lg">
                <div>
                  <p className="font-medium">Bakery Items</p>
                  <p className="text-sm text-muted-foreground">Bread, pastries</p>
                </div>
                <div className="text-2xl font-bold text-secondary">
                  {donations.filter(d => d.category.toLowerCase().includes('bakery')).length}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-accent-orange/5 rounded-lg">
                <div>
                  <p className="font-medium">Prepared Meals</p>
                  <p className="text-sm text-muted-foreground">Ready-to-eat food</p>
                </div>
                <div className="text-2xl font-bold text-accent-orange">
                  {donations.filter(d => d.category.toLowerCase().includes('prepared')).length}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-accent-teal/5 rounded-lg">
                <div>
                  <p className="font-medium">Canned Goods</p>
                  <p className="text-sm text-muted-foreground">Non-perishable items</p>
                </div>
                <div className="text-2xl font-bold text-accent-teal">
                  {donations.filter(d => d.category.toLowerCase().includes('canned')).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Collection Stats</CardTitle>
            <CardDescription>Your food collection activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-bold">28</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">Upcoming Pickups</p>
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between">
                      <p className="font-medium">Prepared meals from restaurant</p>
                      <p className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Tomorrow</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Green Plate Restaurant • 6:30 PM</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between">
                      <p className="font-medium">Dairy products - milk and cheese</p>
                      <p className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">May 25</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Fresh Farms Co-op • 2:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
