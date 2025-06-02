'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/stats-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { DonationStatus, Donation, Pickup } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, Package, Map, Search, User } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function RecipientDashboardPage() {
  const { user } = useAuth();
  const [availableDonations, setAvailableDonations] = useState<Donation[]>([]);
  const [upcomingPickups, setUpcomingPickups] = useState<Pickup[]>([]);
  const [stats, setStats] = useState({
    collected: 0,
    upcoming: 0,
    available: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipientData = async () => {
      try {
        // For demo purposes, using mock data
        // In production, this would fetch from Firestore based on the logged-in recipient
        
        // Mock available donations nearby
        const mockAvailableDonations = [
          {
            id: 'a1',
            title: 'Fresh vegetables from local farm',
            donorName: 'Green Valley Farms',
            distance: 2.5,
            status: DonationStatus.ACTIVE,
            expiryDate: new Date('2025-05-27'),
            quantity: 25,
            quantityUnit: 'kg',
            category: 'Fresh Produce'
          },
          {
            id: 'a2',
            title: 'Bread and baked goods',
            donorName: 'Sunshine Bakery',
            distance: 1.2,
            status: DonationStatus.ACTIVE,
            expiryDate: new Date('2025-05-22'),
            quantity: 15,
            quantityUnit: 'loaves',
            category: 'Bakery Items'
          },
          {
            id: 'a3',
            title: 'Canned goods and non-perishables',
            donorName: 'Community Pantry',
            distance: 3.8,
            status: DonationStatus.ACTIVE,
            expiryDate: new Date('2025-08-15'),
            quantity: 42,
            quantityUnit: 'items',
            category: 'Canned Goods'
          }
        ];

        // Mock upcoming pickups
        const mockUpcomingPickups = [
          {
            id: 'p1',
            title: 'Prepared meals from restaurant',
            donorName: 'Green Plate Restaurant',
            pickupTime: new Date('2025-05-26T18:30:00'),
            status: 'confirmed',
            quantity: 20,
            quantityUnit: 'meals',
            address: '123 Oak Street, Cityville'
          },
          {
            id: 'p2',
            title: 'Dairy products - milk and cheese',
            donorName: 'Fresh Farms Co-op',
            pickupTime: new Date('2025-05-25T14:00:00'),
            status: 'confirmed',
            quantity: 12,
            quantityUnit: 'items',
            address: '456 Maple Avenue, Townsburg'
          }
        ];

        setAvailableDonations(mockAvailableDonations);
        setUpcomingPickups(mockUpcomingPickups);

        // Calculate stats
        setStats({
          collected: 28, // Mock total collections
          upcoming: mockUpcomingPickups.length,
          available: mockAvailableDonations.length
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching recipient data:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchRecipientData();
    }
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
          Welcome, {user?.displayName || 'Recipient'}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          {user?.organizationName || 'Recipient'} Dashboard - Manage your food collection activities
        </p>
      </div>
        {/* Quick Actions Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300" asChild>
            <Link href="/recipient/donations/available">
              <Search className="h-4 w-4" />
              Find Donations
            </Link>
          </Button>
          <Button variant="outline" className="gap-2 shadow-md hover:shadow-lg transition-all duration-300" asChild>
            <Link href="/recipient/pickups/upcoming">
              <Clock className="h-4 w-4" />
              View Pickups
            </Link>
          </Button>
          <Button variant="outline" className="gap-2 shadow-md hover:shadow-lg transition-all duration-300" asChild>
            <Link href="/recipient/profile">
              <User className="h-4 w-4" />
              Profile
            </Link>
          </Button>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="relative overflow-hidden">
            <StatsCard
              title="Available Nearby"
              value={stats.available.toString()}
              description="Donations in your area"
              icon={<Package className="h-6 w-6 text-primary" />}
              className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-all duration-300"
            />
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10"></div>
          </div>
          <div className="relative overflow-hidden">
            <StatsCard
              title="Upcoming Pickups"
              value={stats.upcoming.toString()}
              description="Scheduled collections"
              icon={<Clock className="h-6 w-6 text-orange-500" />}
              className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300"
            />
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-full -translate-y-10 translate-x-10"></div>
          </div>
          <div className="relative overflow-hidden">
            <StatsCard
              title="Total Collected"
              value={stats.collected.toString()}
              description="All time collections"
              icon={<Calendar className="h-6 w-6 text-green-500" />}
              className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300"
            />
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -translate-y-10 translate-x-10"></div>
          </div>
        </div>

        {/* Available Donations */}
        <Card>
          <CardHeader>
            <CardTitle>Available Donations Nearby</CardTitle>
            <CardDescription>Food donations available in your area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b">
                <div className="col-span-2">Donation</div>
                <div>Donor</div>
                <div>Distance</div>
                <div>Quantity</div>
                <div>Expiry Date</div>
              </div>
              <div className="divide-y">
                {availableDonations.map((donation) => (
                  <div key={donation.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                    <div className="col-span-2 font-medium">{donation.title}</div>
                    <div>{donation.donorName}</div>
                    <div>{donation.distance} km</div>
                    <div>
                      {donation.quantity} {donation.quantityUnit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {donation.expiryDate.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <Button variant="outline" asChild>
                <Link href="/recipient/donations/available">View All Available</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Pickups */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Pickups</CardTitle>
            <CardDescription>Your scheduled donation collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b">
                <div className="col-span-2">Donation</div>
                <div>Donor</div>
                <div>Pickup Time</div>
                <div>Quantity</div>
                <div>Address</div>
              </div>
              <div className="divide-y">
                {upcomingPickups.map((pickup) => (
                  <div key={pickup.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                    <div className="col-span-2 font-medium">{pickup.title}</div>
                    <div>{pickup.donorName}</div>
                    <div className="text-sm">
                      {pickup.pickupTime.toLocaleDateString()}<br />
                      {pickup.pickupTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div>
                      {pickup.quantity} {pickup.quantityUnit}
                    </div>
                    <div className="text-sm text-muted-foreground truncate" title={pickup.address}>
                      {pickup.address}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <Button variant="outline" asChild>
                <Link href="/recipient/pickups/upcoming">View All Pickups</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Map View</CardTitle>
            <CardDescription>Find nearby donation locations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View a map of all available donations in your area with optimized routes for pickup.
            </p>
            <Button className="w-full" asChild>
              <Link href="/recipient/map">
                <Map className="mr-2 h-4 w-4" />
                Open Map View
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collection History</CardTitle>
            <CardDescription>Review your past collections</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access details and reports on all your previous food collection activity.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/recipient/pickups/history">
                <Calendar className="mr-2 h-4 w-4" />
                View History
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
