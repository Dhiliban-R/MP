'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Clock, Package } from 'lucide-react';
import { Donation, DonationStatus } from '@/lib/types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '@/components/ui/status-badge';

export default function RecipientDonationHistoryPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchDonationHistory = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch donations reserved or completed by the current user
        const q = query(
          collection(db, 'donations'),
          where('reservedBy', '==', user.uid), // Donations reserved by the current user
          where('status', 'in', ['reserved', 'completed']), // Status is reserved or completed
          orderBy('updatedAt', 'desc') // Order by last update date
        );

        const querySnapshot = await getDocs(q);
        const fetchedDonations = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          expiryDate: doc.data().expiryDate?.toDate() || new Date(),
          completedAt: doc.data().completedAt?.toDate() || null,
          reservedAt: doc.data().reservedAt?.toDate() || null,
        })) as Donation[];

        setDonations(fetchedDonations);
      } catch (err) {
        console.error('Error fetching recipient donation history:', err);
        toast.error('Failed to load donation history.');
      } finally {
        setLoading(false);
      }
    };

    fetchDonationHistory();
  }, [user]);

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = searchTerm === '' || 
                          donation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          donation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || donation.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusOptions: DonationStatus[] = [DonationStatus.RESERVED, DonationStatus.COMPLETED];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-heading font-bold">Donation History</h2>
        <p className="text-muted-foreground">View donations you have reserved or completed</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            className="w-full pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
           <Filter className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
           <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Loading history...</div>
      ) : filteredDonations.length === 0 ? (
        <div className="text-center text-muted-foreground h-64 flex items-center justify-center">
          No donation history found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonations.map((donation) => (
            <Card key={donation.id}>
              <CardHeader>
                <CardTitle>{donation.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                   <Package className="h-4 w-4" /> {donation.category}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{donation.description}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                     <Clock className="h-4 w-4" /> Expires {formatDistanceToNow(donation.expiryDate, { addSuffix: true })}
                  </div>
                   <StatusBadge status={donation.status} />
                </div>
                 <Link href={`/recipient/donations/${donation.id}`} passHref>
                    <Button variant="outline" className="w-full">View Details</Button>
                 </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}