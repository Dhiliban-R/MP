import { useState, useEffect, useCallback } from 'react';
import { 
  getDonations, 
  getDonationsByDonor, 
  getDonationsByRecipient,
  searchDonations,
  reserveDonation,
  completeDonation,
  cancelReservation,
  deleteDonation,
  updateDonation
} from '@/lib/donation-service';
import { Donation, DonationStatus, DonationFilters } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export interface UseDonationsOptions {
  filters?: DonationFilters;
  realtime?: boolean;
  userSpecific?: 'donor' | 'recipient' | null;
}

export interface UseDonationsReturn {
  donations: Donation[];
  loading: boolean;
  error: string | null;
  refreshDonations: () => Promise<void>;
  reserveDonation: (donationId: string, recipientName: string) => Promise<void>;
  completeDonation: (donationId: string) => Promise<void>;
  cancelReservation: (donationId: string) => Promise<void>;
  deleteDonation: (donationId: string) => Promise<void>;
  updateDonation: (donationId: string, updates: Partial<Donation>) => Promise<void>;
  searchDonations: (query: string, filters?: DonationFilters) => Promise<void>;
}

export const useDonations = (options: UseDonationsOptions = {}): UseDonationsReturn => {
  const { filters, realtime = true, userSpecific } = options;
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDonations = useCallback(async () => {
    if (!user && userSpecific) {
      setDonations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let fetchedDonations: Donation[];

      if (userSpecific === 'donor' && user) {
        fetchedDonations = await getDonationsByDonor(user.uid);
      } else if (userSpecific === 'recipient' && user) {
        fetchedDonations = await getDonationsByRecipient(user.uid);
      } else {
        // getDonations expects (limitCount, lastDoc) not filters and returns { donations, lastVisible }
        const limitCount = filters?.limit || 20;
        const result = await getDonations(limitCount);
        fetchedDonations = result.donations;
      }

      setDonations(fetchedDonations);
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch donations');
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [user, filters, userSpecific]);

  const handleReserveDonation = useCallback(async (donationId: string, recipientName: string) => {
    if (!user) {
      toast.error('You must be logged in to reserve donations');
      return;
    }

    try {
      await reserveDonation(donationId, user.uid, recipientName);
      toast.success('Donation reserved successfully');
      await fetchDonations();
    } catch (err) {
      console.error('Error reserving donation:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to reserve donation');
    }
  }, [user, fetchDonations]);

  const handleCompleteDonation = useCallback(async (donationId: string) => {
    try {
      // Note: This needs a reservationId parameter - should be passed from the calling component
      throw new Error('completeDonation requires reservationId parameter');
      toast.success('Donation marked as completed');
      await fetchDonations();
    } catch (err) {
      console.error('Error completing donation:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to complete donation');
    }
  }, [fetchDonations]);

  const handleCancelReservation = useCallback(async (donationId: string) => {
    try {
      // Note: This needs a reservationId parameter - should be passed from the calling component
      throw new Error('cancelReservation requires reservationId parameter');
      toast.success('Reservation cancelled');
      await fetchDonations();
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to cancel reservation');
    }
  }, [fetchDonations]);

  const handleDeleteDonation = useCallback(async (donationId: string) => {
    try {
      await deleteDonation(donationId);
      toast.success('Donation deleted successfully');
      await fetchDonations();
    } catch (err) {
      console.error('Error deleting donation:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete donation');
    }
  }, [fetchDonations]);

  const handleUpdateDonation = useCallback(async (donationId: string, updates: Partial<Donation>) => {
    try {
      await updateDonation(donationId, updates);
      toast.success('Donation updated successfully');
      await fetchDonations();
    } catch (err) {
      console.error('Error updating donation:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update donation');
    }
  }, [fetchDonations]);

  const handleSearchDonations = useCallback(async (query: string, searchFilters?: DonationFilters) => {
    try {
      setLoading(true);
      setError(null);
      const results = await searchDonations(query, searchFilters);
      setDonations(results);
    } catch (err) {
      console.error('Error searching donations:', err);
      setError(err instanceof Error ? err.message : 'Failed to search donations');
      toast.error('Failed to search donations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  return {
    donations,
    loading,
    error,
    refreshDonations: fetchDonations,
    reserveDonation: handleReserveDonation,
    completeDonation: handleCompleteDonation,
    cancelReservation: handleCancelReservation,
    deleteDonation: handleDeleteDonation,
    updateDonation: handleUpdateDonation,
    searchDonations: handleSearchDonations,
  };
};

export default useDonations;
