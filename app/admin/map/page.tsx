'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapView } from '@/components/ui/map-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, MapPin } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Donation, DonationStatus } from '@/lib/types';

export default function AdminMapPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, this would fetch from Firestore
        // For demo, we're using mock data
        
        // Mock donations with location data
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
            status: DonationStatus.RESERVED
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

    fetchData();
  }, []);

  // Filter donations based on active tab
  const filteredDonations = donations.filter(donation => {
    const searchTermLower = searchTerm.toLowerCase();
    const titleMatch = donation.title.toLowerCase().includes(searchTermLower);
    const donorNameMatch = donation.donorName.toLowerCase().includes(searchTermLower);

    if (!titleMatch && !donorNameMatch) {
      return false;
    }

    if (activeTab === 'all') return true;
    if (activeTab === 'active') return donation.status === DonationStatus.ACTIVE;
    if (activeTab === 'reserved') return donation.status === DonationStatus.RESERVED;
    if (activeTab === 'completed') return donation.status === DonationStatus.COMPLETED;
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading map data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between">
        <div className="flex w-full items-center justify-between mb-2">
          <h2 className="text-3xl font-heading font-bold">Donation Map</h2>
          <a href="/admin/dashboard">
            <Button variant="secondary" size="sm">Back to Dashboard</Button>
          </a>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="From"
            className="max-w-sm"
          />
          <Input
            placeholder="To"
            className="max-w-sm"
          />
        </div>
        <Input
          placeholder="Search donations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
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
              <CardTitle>Live Donation Tracking</CardTitle>
              <CardDescription>View and manage all donations across the platform</CardDescription>
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
                <TabsTrigger value="reserved" className="text-xs">Reserved</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-6">
          <MapView 
            donations={filteredDonations} 
            height="600px" 
            initialZoom={12} 
            showUserLocation={true}
          />
        </CardContent>
        <div className="p-4">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => alert('Navigation functionality not implemented yet.')}>
            Show Directions
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Donation Stats by Location</CardTitle>
          <CardDescription>Geographic distribution of donations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="bg-primary/10 p-3 rounded-full">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">New York</p>
                <p className="text-sm text-muted-foreground">42 active donations</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="bg-secondary/10 p-3 rounded-full">
                <MapPin className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="font-medium">Brooklyn</p>
                <p className="text-sm text-muted-foreground">28 active donations</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="bg-accent-orange/10 p-3 rounded-full">
                <MapPin className="h-5 w-5 text-accent-orange" />
              </div>
              <div>
                <p className="font-medium">Queens</p>
                <p className="text-sm text-muted-foreground">19 active donations</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
