'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapView } from '@/components/ui/map-view';
import {
  Search,
  Filter,
  Plus,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  Users,
  Navigation,
  Eye
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Donation, DonationStatus } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function DonorMapPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonorDonations = async () => {
      try {
        // In a real app, this would fetch from Firestore based on the donor's ID
        // For demo, we're using mock data
        
        // Mock donor's donations with location data
        const mockDonations = [
          {
            id: 'd1',
            donorId: user?.uid || 'donor1',
            donorName: user?.organizationName || user?.displayName || 'Demo Donor',
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
            id: 'd2',
            donorId: user?.uid || 'donor1',
            donorName: user?.organizationName || user?.displayName || 'Demo Donor',
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
            status: DonationStatus.RESERVED
          },
          {
            id: 'd3',
            donorId: user?.uid || 'donor1',
            donorName: user?.organizationName || user?.displayName || 'Demo Donor',
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
        console.error('Error fetching donor donations:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchDonorDonations();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
          Your Donations Map
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          View and manage your donation locations and nearby recipients
        </p>
      </div>
        {/* Quick Actions Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300" asChild>
            <Link href="/donor/donations/new">
              <Plus className="h-4 w-4" />
              Add Donation
            </Link>
          </Button>
          <Button variant="outline" className="gap-2 shadow-md hover:shadow-lg transition-all duration-300" asChild>
            <Link href="/donor/donations/active">
              <Package className="h-4 w-4" />
              View All Donations
            </Link>
          </Button>
          <Button variant="outline" className="gap-2 shadow-md hover:shadow-lg transition-all duration-300">
            <Navigation className="h-4 w-4" />
            Get Directions
          </Button>
        </div>

        {/* Map Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Total Donations</p>
                  <p className="text-2xl font-bold text-primary">{donations.length}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active</p>
                  <p className="text-2xl font-bold text-green-900">
                    {donations.filter(d => d.status === DonationStatus.ACTIVE).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Reserved</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {donations.filter(d => d.status === DonationStatus.RESERVED).length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Completed</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {donations.filter(d => d.status === DonationStatus.COMPLETED).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Map Section */}
        <Card className="overflow-hidden shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Donation Locations
            </CardTitle>
            <CardDescription>
              Interactive map showing your active and reserved donations with recipient locations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              <MapView
                donations={donations}
                height="500px"
                initialZoom={12}
                showUserLocation={true}
                markerType="donation"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Active Donations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Reserved Donations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Recipients</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Bottom Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Your Donations
              </CardTitle>
              <CardDescription>Current status and details of your donations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {donations.map((donation) => (
                  <Card key={donation.id} className="hover:shadow-md transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{donation.title}</h3>
                            <Badge
                              variant={donation.status === DonationStatus.ACTIVE ? 'default' :
                                     donation.status === DonationStatus.RESERVED ? 'secondary' : 'outline'}
                              className={
                                donation.status === DonationStatus.ACTIVE ? 'bg-green-100 text-green-800 border-green-200' :
                                donation.status === DonationStatus.RESERVED ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                'bg-gray-100 text-gray-800 border-gray-200'
                              }
                            >
                              {donation.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{donation.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {donation.quantity} {donation.quantityUnit}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {donation.pickupAddress.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires {donation.expiryDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Recipients Nearby
              </CardTitle>
              <CardDescription>Organizations in your area that collect donations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Card className="hover:shadow-md transition-all duration-300 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center border border-primary/20">
                        <span className="text-primary text-lg font-bold">CH</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Community Hope Center</h3>
                        <p className="text-sm text-gray-600">Food Bank • Serves 500+ families weekly</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            1.2 miles away
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            15 collections
                          </span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active Partner
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Navigation className="h-3 w-3" />
                        Directions
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                        <span className="text-blue-600 text-lg font-bold">HS</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Hope Shelter</h3>
                        <p className="text-sm text-gray-600">Homeless Shelter • 24/7 emergency services</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            2.5 miles away
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            8 collections
                          </span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Regular Pickup
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Navigation className="h-3 w-3" />
                        Directions
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all duration-300 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full flex items-center justify-center border border-orange-200">
                        <span className="text-orange-600 text-lg font-bold">FP</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Family Pantry</h3>
                        <p className="text-sm text-gray-600">Food Pantry • Supporting local families</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            3.1 miles away
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            5 collections
                          </span>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            New Partner
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Navigation className="h-3 w-3" />
                        Directions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
