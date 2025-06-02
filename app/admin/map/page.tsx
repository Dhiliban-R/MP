'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapView } from '@/components/ui/map-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, MapPin, Loader2 } from 'lucide-react'; // Added Loader2
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'; // Added orderBy, Timestamp
import { Donation, DonationStatus } from '@/lib/types';
import { toast } from 'sonner'; // For error notifications

export default function AdminMapPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, 'donations'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedDonations: Donation[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate(),
            updatedAt: (data.updatedAt as Timestamp)?.toDate(),
            expiryDate: (data.expiryDate as Timestamp)?.toDate(),
            reservedAt: (data.reservedAt as Timestamp)?.toDate(),
            completedAt: (data.completedAt as Timestamp)?.toDate(),
          } as Donation;
        });
        setDonations(fetchedDonations);
      } catch (err) {
        console.error('Error fetching donations:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch donations');
        toast.error('Failed to load donations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter donations based on active tab and search term
  const filteredDonations = donations.filter(donation => {
    const searchTermLower = searchTerm.toLowerCase();
    const titleMatch = donation.title.toLowerCase().includes(searchTermLower);
    const donorNameMatch = donation.donorName?.toLowerCase().includes(searchTermLower) || false;
    const categoryMatch = donation.category?.toLowerCase().includes(searchTermLower) || false;
    const cityMatch = donation.pickupAddress?.city?.toLowerCase().includes(searchTermLower) || false;


    const searchMatches = titleMatch || donorNameMatch || categoryMatch || cityMatch;

    if (!searchMatches) {
      return false;
    }

    if (activeTab === 'all') return true;
    return donation.status === activeTab; // Directly compare with DonationStatus values
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        Loading map data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-destructive">
        <MapPin className="h-12 w-12 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Donations</h3>
        <p className="text-center mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
      </div>
    );
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
