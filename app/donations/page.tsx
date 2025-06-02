'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Donation, DonationStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Package, MapPin, Calendar, Search } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { MapView } from '@/components/ui/map-view';
import { MainLayout } from '@/components/layout/main-layout';

export default function PublicDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'donations'),
          where('status', '==', DonationStatus.ACTIVE),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedDonations: Donation[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          expiryDate: doc.data().expiryDate?.toDate(),
        })) as Donation[];
        setDonations(fetchedDonations);
      } catch (error) {
        console.error('Error fetching public donations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load available donations.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = searchTerm === '' || 
                          donation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          donation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          donation.donorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || donation.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const foodCategories = [
    'Fresh Produce', 'Bakery Items', 'Dairy Products', 'Canned Goods', 
    'Prepared Meals', 'Beverages', 'Grains & Pasta', 'Meat & Seafood', 
    'Snacks', 'Baby Food', 'Other'
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading donations...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-heading font-bold">Available Donations</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search donations by title, description, or donor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">All Categories</option>
            {foodCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {filteredDonations.length === 0 ? (
            <Card className="text-center py-10">
              <CardContent>
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">No active donations found matching your criteria.</p>
                <p className="text-sm text-muted-foreground mt-2">Check back later or adjust your search filters.</p>
              </CardContent>
            </Card>
          ) : (
            filteredDonations.map(donation => (
              <Card key={donation.id} className="flex flex-col md:flex-row overflow-hidden">
                {donation.imageUrls && donation.imageUrls.length > 0 && (
                  <div className="w-full md:w-1/3 h-48 md:h-auto flex-shrink-0">
                    <img 
                      src={donation.imageUrls[0]} 
                      alt={donation.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{donation.title}</h2>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{donation.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-primary" />
                        <span>{donation.quantity} {donation.quantityUnit}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <span>Expires: {format(donation.expiryDate, 'PPP')}</span>
                      </div>
                      <div className="flex items-center col-span-2">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <span>{donation.pickupAddress.city}, {donation.pickupAddress.state}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link href={`/recipient/donations/${donation.id}`}>
                      <Button variant="default">View Details</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Donations Map</CardTitle>
              <CardDescription>Explore available donations on the map.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] p-0">
              <MapView donations={filteredDonations} height="100%" />
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </MainLayout>
  );
}