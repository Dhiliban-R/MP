'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Truck,
  Clock,
  Package,
  MapPin,
  Calendar,
  Phone,
  CheckCircle,
  Star
} from 'lucide-react';
import Link from 'next/link';

export default function PendingCollections() {
  const { user, loading, isAuthorized } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAuthorized('recipient'))) {
      router.push('/auth/login');
    }
  }, [user, loading, isAuthorized, router]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await fetch('/api/requests');
        if (!response.ok) throw new Error('Failed to fetch requests');
        const data = await response.json();
        setRequests(data.filter((r: any) => r.recipientId === user.uid && r.status === 'pending'));
      } catch (error) {
        toast.error('Failed to load requests.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      const response = await fetch('/api/requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Failed to delete request');
      setRequests(requests.filter(r => r.id !== id));
      toast.success('Request deleted.');
    } catch (error) {
      toast.error('Failed to delete request.');
    }
  };

  if (loading || !user || !isAuthorized('recipient')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Skeleton className="w-64 h-32 rounded-lg" />
      </div>
    );
  }

  // Mock upcoming pickups data
  const mockUpcomingPickups = [
    {
      id: 'p1',
      title: 'Prepared meals from restaurant',
      description: 'Fresh Italian cuisine including pasta, pizza, and salads prepared today',
      donorName: 'Green Plate Restaurant',
      donorRating: 4.8,
      pickupTime: new Date('2025-05-26T18:30:00'),
      status: 'confirmed',
      quantity: 20,
      quantityUnit: 'meals',
      address: '123 Oak Street, Cityville',
      distance: 2.1,
      category: 'Prepared Meals',
      expiryDate: new Date('2025-05-26T22:00:00'),
      specialInstructions: 'Please bring insulated containers. Use rear entrance.',
      contactPhone: '+1 (555) 123-4567'
    },
    {
      id: 'p2',
      title: 'Dairy products - milk and cheese',
      description: 'Fresh dairy products including whole milk, cheese varieties, and yogurt',
      donorName: 'Fresh Farms Co-op',
      donorRating: 4.9,
      pickupTime: new Date('2025-05-25T14:00:00'),
      status: 'confirmed',
      quantity: 12,
      quantityUnit: 'items',
      address: '456 Maple Avenue, Townsburg',
      distance: 3.5,
      category: 'Dairy Products',
      expiryDate: new Date('2025-05-28T23:59:59'),
      specialInstructions: 'Refrigerated transport required. Loading dock available.',
      contactPhone: '+1 (555) 987-6543'
    },
    {
      id: 'p3',
      title: 'Fresh vegetables and fruits',
      description: 'Seasonal organic produce including carrots, apples, lettuce, and tomatoes',
      donorName: 'Sunshine Organic Farm',
      donorRating: 4.7,
      pickupTime: new Date('2025-05-27T10:00:00'),
      status: 'pending_confirmation',
      quantity: 35,
      quantityUnit: 'kg',
      address: '789 Farm Road, Green Valley',
      distance: 5.2,
      category: 'Fresh Produce',
      expiryDate: new Date('2025-05-30T23:59:59'),
      specialInstructions: 'Early morning pickup preferred. Bring crates for vegetables.',
      contactPhone: '+1 (555) 456-7890'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
          Upcoming Pickups
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          Manage your scheduled donation collections
        </p>
      </div>
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Confirmed Pickups</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {mockUpcomingPickups.filter(p => p.status === 'confirmed').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Pending Confirmation</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {mockUpcomingPickups.filter(p => p.status === 'pending_confirmation').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-200 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Items</p>
                  <p className="text-2xl font-bold text-green-900">
                    {mockUpcomingPickups.reduce((sum, p) => sum + p.quantity, 0)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pickups List */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Scheduled Pickups
            </CardTitle>
            <CardDescription>
              Your confirmed and pending donation collections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="w-full h-32 rounded-lg" />
                ))}
              </div>
            ) : mockUpcomingPickups.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming pickups</h3>
                <p className="text-gray-500 mb-4">
                  You don't have any scheduled pickups at the moment.
                </p>
                <Button asChild>
                  <Link href="/recipient/donations/available">
                    Find Donations
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {mockUpcomingPickups.map((pickup) => (
                  <Card key={pickup.id} className="overflow-hidden hover:shadow-md transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Main Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{pickup.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{pickup.description}</p>
                            </div>
                            <Badge
                              variant={pickup.status === 'confirmed' ? 'default' : 'secondary'}
                              className={pickup.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200'}
                            >
                              {pickup.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                            </Badge>
                          </div>

                          {/* Donor Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {pickup.donorName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{pickup.donorName}</p>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm text-gray-500">{pickup.donorRating}</span>
                              </div>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-medium">{pickup.pickupTime.toLocaleDateString()}</p>
                                <p className="text-gray-500">{pickup.pickupTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-medium">{pickup.quantity} {pickup.quantityUnit}</p>
                                <p className="text-gray-500">{pickup.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-medium">{pickup.distance} km away</p>
                                <p className="text-gray-500 truncate">{pickup.address.split(',')[0]}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-medium">Expires</p>
                                <p className="text-gray-500">{pickup.expiryDate.toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>

                          {/* Special Instructions */}
                          {pickup.specialInstructions && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-blue-900 mb-1">Special Instructions:</p>
                              <p className="text-sm text-blue-700">{pickup.specialInstructions}</p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 lg:w-48">
                          <Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md">
                            <MapPin className="h-4 w-4 mr-2" />
                            View Location
                          </Button>
                          <Button variant="outline" className="w-full shadow-md">
                            <Phone className="h-4 w-4 mr-2" />
                            Contact Donor
                          </Button>
                          {pickup.status === 'pending_confirmation' && (
                            <Button variant="outline" className="w-full shadow-md border-green-200 text-green-700 hover:bg-green-50">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm Pickup
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                            Cancel Pickup
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}