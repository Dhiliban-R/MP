'use client';

import { db, storage } from './firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Donation, DonationStatus, Reservation } from './types/donation.types';
import { createDonationStatusNotification } from './notification-service';

// Create a new donation
export const createDonation = async (donationData: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'donations'), {
      ...donationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
};

// Get a single donation by ID
export const getDonationById = async (donationId: string): Promise<Donation | null> => {
  try {
    const docRef = doc(db, 'donations', donationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
        expiryDate: (data.expiryDate as Timestamp)?.toDate() || new Date(),
      } as Donation;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting donation:', error);
    throw error;
  }
};

// Get donations by donor ID
export const getDonationsByDonorId = async (donorId: string, status?: DonationStatus) => {
  try {
    let q = query(
      collection(db, 'donations'),
      where('donorId', '==', donorId),
      orderBy('createdAt', 'desc')
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const querySnapshot = await getDocs(q);
    const donations: Donation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      donations.push({
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
        expiryDate: (data.expiryDate as Timestamp)?.toDate() || new Date(),
      } as Donation);
    });
    
    return donations;
  } catch (error) {
    console.error('Error getting donations by donor:', error);
    throw error;
  }
};

// Get available donations (for recipients)
export const getAvailableDonations = async (limitCount = 20, lastDoc = null) => {
  try {
    let q = query(
      collection(db, 'donations'),
      where('status', '==', DonationStatus.ACTIVE),
      where('expiryDate', '>', Timestamp.fromDate(new Date())),
      orderBy('expiryDate', 'asc')
    );
    
    if (limit) {
      q = query(q, limit(limitCount));
    }
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const donations: Donation[] = [];
    let lastVisible = null;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      donations.push({
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
        expiryDate: (data.expiryDate as Timestamp)?.toDate() || new Date(),
      } as Donation);
      
      lastVisible = doc;
    });
    
    return { donations, lastVisible };
  } catch (error) {
    console.error('Error getting available donations:', error);
    throw error;
  }
};

// Update a donation
export const updateDonation = async (donationId: string, updateData: Partial<Donation>) => {
  try {
    const donationRef = doc(db, 'donations', donationId);
    
    // Remove id from updateData if it exists
    const { id, ...dataToUpdate } = updateData as any;
    
    await updateDoc(donationRef, {
      ...dataToUpdate,
      updatedAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error updating donation:', error);
    throw error;
  }
};

// Delete a donation
export const deleteDonation = async (donationId: string) => {
  try {
    // Get the donation first to check for images
    const donation = await getDonationById(donationId);
    
    if (donation && donation.imageUrls && donation.imageUrls.length > 0) {
      // Delete all images from storage
      const deletePromises = donation.imageUrls.map(async (url) => {
        try {
          // Extract the path from the URL
          const path = url.split('firebase.storage.app/')[1].split('?')[0];
          const storageRef = ref(storage, path);
          await deleteObject(storageRef);
        } catch (error) {
          console.error('Error deleting image:', error);
          // Continue with other deletions even if one fails
        }
      });
      
      await Promise.all(deletePromises);
    }
    
    // Delete the donation document
    await deleteDoc(doc(db, 'donations', donationId));
    
    return true;
  } catch (error) {
    console.error('Error deleting donation:', error);
    throw error;
  }
};

// Reserve a donation
export const reserveDonation = async (
  donationId: string,
  recipientId: string,
  recipientName: string
) => {
  try {
    // Get the donation first
    const donation = await getDonationById(donationId);
    
    if (!donation) {
      throw new Error('Donation not found');
    }
    
    if (donation.status !== DonationStatus.ACTIVE) {
      throw new Error('This donation is not available for reservation');
    }
    
    // Update the donation status
    await updateDoc(doc(db, 'donations', donationId), {
      status: DonationStatus.RESERVED,
      reservedBy: recipientId,
      reservedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Create a reservation record
    const reservationData: Omit<Reservation, 'id' | 'createdAt'> = {
      donationId,
      recipientId,
      recipientName,
      status: 'confirmed',
      pickupTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to 24 hours from now
    };
    
    const reservationRef = await addDoc(collection(db, 'reservations'), {
      ...reservationData,
      createdAt: serverTimestamp(),
    });
    
    // Create notifications for both donor and recipient
    await createDonationStatusNotification(
      donationId,
      donation.title,
      donation.donorId,
      recipientId,
      DonationStatus.RESERVED,
      recipientName
    );
    
    return reservationRef.id;
  } catch (error) {
    console.error('Error reserving donation:', error);
    throw error;
  }
};

// Complete a donation (mark as picked up)
export const completeDonation = async (donationId: string, reservationId: string) => {
  try {
    // Get the donation first
    const donation = await getDonationById(donationId);
    
    if (!donation) {
      throw new Error('Donation not found');
    }
    
    if (donation.status !== DonationStatus.RESERVED) {
      throw new Error('This donation is not reserved');
    }
    
    // Update the donation status
    await updateDoc(doc(db, 'donations', donationId), {
      status: DonationStatus.COMPLETED,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update the reservation status
    await updateDoc(doc(db, 'reservations', reservationId), {
      status: 'completed',
      completedAt: serverTimestamp(),
    });
    
    // Create notifications for both donor and recipient
    await createDonationStatusNotification(
      donationId,
      donation.title,
      donation.donorId,
      donation.reservedBy,
      DonationStatus.COMPLETED
    );
    
    return true;
  } catch (error) {
    console.error('Error completing donation:', error);
    throw error;
  }
};

// Cancel a reservation
export const cancelReservation = async (donationId: string, reservationId: string) => {
  try {
    // Get the donation first
    const donation = await getDonationById(donationId);
    
    if (!donation) {
      throw new Error('Donation not found');
    }
    
    if (donation.status !== DonationStatus.RESERVED) {
      throw new Error('This donation is not reserved');
    }
    
    // Update the donation status back to active
    await updateDoc(doc(db, 'donations', donationId), {
      status: DonationStatus.ACTIVE,
      reservedBy: deleteField(),
      reservedAt: deleteField(),
      updatedAt: serverTimestamp(),
    });
    
    // Update the reservation status
    await updateDoc(doc(db, 'reservations', reservationId), {
      status: 'cancelled',
    });
    
    // Create notifications for both donor and recipient
    await createDonationStatusNotification(
      donationId,
      donation.title,
      donation.donorId,
      donation.reservedBy,
      DonationStatus.CANCELLED
    );
    
    return true;
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    throw error;
  }
};

// Get reservations by recipient ID
export const getReservationsByRecipientId = async (recipientId: string, status?: string) => {
  try {
    let q = query(
      collection(db, 'reservations'),
      where('recipientId', '==', recipientId),
      orderBy('createdAt', 'desc')
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const querySnapshot = await getDocs(q);
    const reservations: any[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reservations.push({
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        pickupTime: (data.pickupTime as Timestamp)?.toDate() || new Date(),
        completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
      });
    });
    
    // Fetch the associated donations
    const reservationsWithDonations = await Promise.all(
      reservations.map(async (reservation) => {
        const donation = await getDonationById(reservation.donationId);
        return {
          ...reservation,
          donation,
        };
      })
    );
    
    return reservationsWithDonations;
  } catch (error) {
    console.error('Error getting reservations by recipient:', error);
    throw error;
  }
};

// Subscribe to real-time updates for a specific donation
export const subscribeToDonation = (donationId: string, callback: (donation: Donation | null) => void) => {
  const unsubscribe = onSnapshot(
    doc(db, 'donations', donationId),
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const donation = {
          id: docSnapshot.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
          expiryDate: (data.expiryDate as Timestamp)?.toDate() || new Date(),
          reservedAt: data.reservedAt ? (data.reservedAt as Timestamp).toDate() : undefined,
          completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
        } as Donation;
        
        callback(donation);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to donation:', error);
      callback(null);
    }
  );
  
  return unsubscribe;
};

// Get donor statistics
export const getDonorStats = async (donorId: string) => {
  try {
    const donations = await getDonationsByDonorId(donorId);
    
    const total = donations.length;
    const active = donations.filter(d => d.status === DonationStatus.ACTIVE).length;
    const reserved = donations.filter(d => d.status === DonationStatus.RESERVED).length;
    const completed = donations.filter(d => d.status === DonationStatus.COMPLETED).length;
    const expired = donations.filter(d => d.status === DonationStatus.EXPIRED).length;
    const cancelled = donations.filter(d => d.status === DonationStatus.CANCELLED).length;
    
    // Calculate donation trend (by month)
    const donationsByMonth: Record<string, number> = {};
    
    donations.forEach(donation => {
      const month = donation.createdAt.toLocaleString('default', { month: 'short' });
      donationsByMonth[month] = (donationsByMonth[month] || 0) + 1;
    });
    
    const donationTrend = Object.entries(donationsByMonth).map(([month, count]) => ({
      date: month,
      count
    }));
    
    // Calculate donations by category
    const donationsByCategory: Record<string, number> = {};
    
    donations.forEach(donation => {
      donationsByCategory[donation.category] = (donationsByCategory[donation.category] || 0) + 1;
    });
    
    return {
      total,
      active,
      reserved,
      completed,
      expired,
      cancelled,
      donationTrend,
      donationsByCategory
    };
  } catch (error) {
    console.error('Error getting donor stats:', error);
    throw error;
  }
};

// Upload donation images
export const uploadDonationImages = async (userId: string, files: File[]): Promise<string[]> => {
  if (files.length === 0) return [];
  
  try {
    const uploadPromises = files.map(async (file) => {
      const storageRef = ref(storage, `donations/${userId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      return getDownloadURL(snapshot.ref);
    });
    
    return Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

// Check for expired donations and update their status
export const checkAndUpdateExpiredDonations = async () => {
  try {
    const now = new Date();
    
    // Query for active donations that have expired
    const q = query(
      collection(db, 'donations'),
      where('status', '==', DonationStatus.ACTIVE),
      where('expiryDate', '<', now)
    );
    
    const querySnapshot = await getDocs(q);
    const batch: any[] = [];
    
    querySnapshot.forEach((document) => {
      const donationRef = doc(db, 'donations', document.id);
      batch.push(
        updateDoc(donationRef, {
          status: DonationStatus.EXPIRED,
          updatedAt: serverTimestamp(),
        })
      );
      
      // Create notification for the donor
      const donationData = document.data();
      batch.push(
        createDonationStatusNotification(
          document.id,
          donationData.title,
          donationData.donorId,
          undefined,
          DonationStatus.EXPIRED
        )
      );
    });
    
    await Promise.all(batch);
    
    return querySnapshot.size; // Return the number of donations updated
  } catch (error) {
    console.error('Error updating expired donations:', error);
    throw error;
  }
};

// Subscribe to real-time updates for available donations
export const subscribeToAvailableDonations = (
  onData: (donations: Donation[]) => void,
  onError: (error: Error) => void
) => {
  const q = query(
    collection(db, 'donations'),
    where('status', '==', DonationStatus.ACTIVE),
    where('expiryDate', '>', Timestamp.fromDate(new Date())),
    orderBy('expiryDate', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const donations: Donation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        donations.push({
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
          expiryDate: (data.expiryDate as Timestamp)?.toDate() || new Date(),
        } as Donation);
      });
      onData(donations);
    },
    (error) => {
      console.error('Error subscribing to available donations:', error);
      onError(error); // Call the provided error handler
    }
  );

  return unsubscribe;
};

// Donation Templates
export interface DonationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  quantityUnit: string;
  defaultQuantity: number;
  pickupInstructions: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
  usageCount: number;
}

/**
 * Create a donation template
 */
export const createDonationTemplate = async (template: Omit<DonationTemplate, 'id' | 'createdAt' | 'usageCount'>): Promise<string> => {
  try {
    const templateData = {
      ...template,
      createdAt: serverTimestamp(),
      usageCount: 0
    };

    const docRef = await addDoc(collection(db, 'donationTemplates'), templateData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating donation template:', error);
    throw error;
  }
};

/**
 * Get donation templates for a user
 */
export const getDonationTemplates = async (userId: string): Promise<DonationTemplate[]> => {
  try {
    const templatesQuery = query(
      collection(db, 'donationTemplates'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(templatesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as DonationTemplate[];
  } catch (error) {
    console.error('Error getting donation templates:', error);
    throw error;
  }
};

/**
 * Get public donation templates
 */
export const getPublicDonationTemplates = async (): Promise<DonationTemplate[]> => {
  try {
    const templatesQuery = query(
      collection(db, 'donationTemplates'),
      where('isPublic', '==', true),
      orderBy('usageCount', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(templatesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as DonationTemplate[];
  } catch (error) {
    console.error('Error getting public donation templates:', error);
    throw error;
  }
};

/**
 * Update template usage count
 */
export const incrementTemplateUsage = async (templateId: string): Promise<void> => {
  try {
    const templateRef = doc(db, 'donationTemplates', templateId);
    await updateDoc(templateRef, {
      usageCount: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing template usage:', error);
    throw error;
  }
};

/**
 * Create donation from template
 */
export const createDonationFromTemplate = async (
  templateId: string,
  donationData: Partial<Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
  try {
    // Get template
    const templateDoc = await getDoc(doc(db, 'donationTemplates', templateId));
    if (!templateDoc.exists()) {
      throw new Error('Template not found');
    }

    const template = templateDoc.data() as DonationTemplate;

    // Create donation with template data
    const donation: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'> = {
      title: donationData.title || template.name,
      description: donationData.description || template.description,
      category: template.category,
      quantity: donationData.quantity || template.defaultQuantity,
      quantityUnit: template.quantityUnit,
      pickupInstructions: donationData.pickupInstructions || template.pickupInstructions,
      expiryDate: donationData.expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      donorId: donationData.donorId!,
      donorName: donationData.donorName!,
      pickupAddress: donationData.pickupAddress!,
      imageUrls: donationData.imageUrls || [],
      status: DonationStatus.ACTIVE
    };

    const donationId = await createDonation(donation);

    // Increment template usage
    await incrementTemplateUsage(templateId);

    return donationId;
  } catch (error) {
    console.error('Error creating donation from template:', error);
    throw error;
  }
};

// Export aliases for compatibility
export const getDonations = getAvailableDonations;
export const getDonationsByDonor = getDonationsByDonorId;
export const getDonationsByRecipient = getReservationsByRecipientId;

// Enhanced search donations function with advanced filtering
export const searchDonations = async (searchQuery: string, filters?: any): Promise<Donation[]> => {
  try {
    // Build base query
    const baseQuery = collection(db, 'donations');
    const constraints = [];

    // Add status filter (default to active)
    constraints.push(where('status', '==', filters?.status || DonationStatus.ACTIVE));

    // Add category filter if provided
    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }

    // Add location filter if provided
    if (filters?.location) {
      // This is a simplified location filter - in a real app you'd use geohash or similar
      constraints.push(where('pickupAddress', '>=', filters.location));
      constraints.push(where('pickupAddress', '<=', filters.location + '\uf8ff'));
    }

    // Add expiry filter (only non-expired donations)
    constraints.push(where('expiryDate', '>', Timestamp.fromDate(new Date())));

    // Order by creation date
    constraints.push(orderBy('createdAt', 'desc'));

    // Apply limit if provided
    if (filters?.limit) {
      constraints.push(limit(filters.limit));
    }

    const queryRef = query(baseQuery, ...constraints);
    const snapshot = await getDocs(queryRef);

    let donations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Donation[];

    // Filter by search query if provided
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim();
      donations = donations.filter(donation =>
        donation.title.toLowerCase().includes(searchTerm) ||
        donation.description.toLowerCase().includes(searchTerm) ||
        donation.category.toLowerCase().includes(searchTerm)
      );
    }

    return donations;
  } catch (error) {
    console.error('Error searching donations:', error);
    throw error;
  }
};

// Advanced search interface
export interface AdvancedSearchFilters {
  query?: string;
  categories?: string[];
  status?: DonationStatus[];
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  expiryRange?: {
    start?: Date;
    end?: Date;
  };
  quantityRange?: {
    min?: number;
    max?: number;
  };
  donorId?: string;
  recipientId?: string;
  sortBy?: 'createdAt' | 'expiryDate' | 'quantity' | 'distance' | 'urgency';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  includeExpired?: boolean;
  tags?: string[];
}

// Enhanced search with advanced filtering
export const advancedSearchDonations = async (filters: AdvancedSearchFilters): Promise<Donation[]> => {
  try {
    // Build base query
    const baseQuery = collection(db, 'donations');
    const constraints = [];

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (filters.status.length === 1) {
        constraints.push(where('status', '==', filters.status[0]));
      } else {
        constraints.push(where('status', 'in', filters.status));
      }
    } else {
      constraints.push(where('status', '==', DonationStatus.ACTIVE));
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (filters.categories.length === 1) {
        constraints.push(where('category', '==', filters.categories[0]));
      } else {
        constraints.push(where('category', 'in', filters.categories));
      }
    }

    // Date range filter
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.dateRange.start)));
      }
      if (filters.dateRange.end) {
        constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.dateRange.end)));
      }
    }

    // Expiry filter
    if (!filters.includeExpired) {
      constraints.push(where('expiryDate', '>', Timestamp.fromDate(new Date())));
    }

    if (filters.expiryRange) {
      if (filters.expiryRange.start) {
        constraints.push(where('expiryDate', '>=', Timestamp.fromDate(filters.expiryRange.start)));
      }
      if (filters.expiryRange.end) {
        constraints.push(where('expiryDate', '<=', Timestamp.fromDate(filters.expiryRange.end)));
      }
    }

    // Donor/Recipient filter
    if (filters.donorId) {
      constraints.push(where('donorId', '==', filters.donorId));
    }
    if (filters.recipientId) {
      constraints.push(where('recipientId', '==', filters.recipientId));
    }

    // Sorting
    const sortField = filters.sortBy || 'createdAt';
    const sortDirection = filters.sortOrder || 'desc';
    constraints.push(orderBy(sortField, sortDirection));

    // Limit
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }

    const queryRef = query(baseQuery, ...constraints);
    const snapshot = await getDocs(queryRef);

    let donations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      expiryDate: (doc.data().expiryDate as Timestamp)?.toDate() || new Date(),
    })) as Donation[];

    // Apply client-side filters that can't be done in Firestore
    donations = applyClientSideFilters(donations, filters);

    return donations;
  } catch (error) {
    console.error('Error in advanced search:', error);
    throw error;
  }
};

// Apply filters that need to be done client-side
function applyClientSideFilters(donations: Donation[], filters: AdvancedSearchFilters): Donation[] {
  let filtered = [...donations];

  // Text search
  if (filters.query && filters.query.trim()) {
    const searchTerms = filters.query.toLowerCase().trim().split(/\s+/);
    filtered = filtered.filter(donation => {
      const searchableText = [
        donation.title,
        donation.description,
        donation.category,
        donation.donorName,
        donation.pickupAddress?.street,
        donation.pickupAddress?.city,
        ...(donation.tags || [])
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  // Quantity range filter
  if (filters.quantityRange) {
    if (filters.quantityRange.min !== undefined) {
      filtered = filtered.filter(donation => donation.quantity >= filters.quantityRange!.min!);
    }
    if (filters.quantityRange.max !== undefined) {
      filtered = filtered.filter(donation => donation.quantity <= filters.quantityRange!.max!);
    }
  }

  // Location-based filtering (if location provided)
  if (filters.location) {
    filtered = filtered.filter(donation => {
      if (!donation.pickupAddress?.latitude || !donation.pickupAddress?.longitude) {
        return false;
      }

      const distance = calculateDistance(
        filters.location!.latitude,
        filters.location!.longitude,
        donation.pickupAddress.latitude,
        donation.pickupAddress.longitude
      );

      return distance <= filters.location!.radius;
    });

    // Sort by distance if location is provided and sortBy is distance
    if (filters.sortBy === 'distance') {
      filtered.sort((a, b) => {
        const distanceA = calculateDistance(
          filters.location!.latitude,
          filters.location!.longitude,
          a.pickupAddress?.latitude || 0,
          a.pickupAddress?.longitude || 0
        );
        const distanceB = calculateDistance(
          filters.location!.latitude,
          filters.location!.longitude,
          b.pickupAddress?.latitude || 0,
          b.pickupAddress?.longitude || 0
        );

        return filters.sortOrder === 'desc' ? distanceB - distanceA : distanceA - distanceB;
      });
    }
  }

  // Sort by urgency (custom sorting)
  if (filters.sortBy === 'urgency') {
    filtered.sort((a, b) => {
      const urgencyA = calculateUrgencyScore(a);
      const urgencyB = calculateUrgencyScore(b);
      return filters.sortOrder === 'desc' ? urgencyB - urgencyA : urgencyA - urgencyB;
    });
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(donation => {
      const donationTags = donation.tags || [];
      return filters.tags!.some(tag => donationTags.includes(tag));
    });
  }

  return filtered;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate urgency score for sorting
function calculateUrgencyScore(donation: Donation): number {
  let score = 0;

  // Base score from status
  if (donation.status === DonationStatus.ACTIVE) score += 100;
  else if (donation.status === DonationStatus.RESERVED) score += 50;

  // Expiry urgency
  if (donation.expiryDate) {
    const now = new Date();
    const expiry = new Date(donation.expiryDate);
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilExpiry < 0) score -= 200; // Expired
    else if (hoursUntilExpiry < 6) score += 200; // Very urgent
    else if (hoursUntilExpiry < 24) score += 100; // Urgent
    else if (hoursUntilExpiry < 72) score += 50; // Moderately urgent
  }

  // Quantity factor (larger donations might be more urgent)
  score += Math.min(donation.quantity * 2, 50);

  return score;
}