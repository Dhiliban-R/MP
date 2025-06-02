import { Address } from './user.types';

export enum DonationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  RESERVED = 'reserved',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  quantityUnit: string;
  imageUrls: string[];
  pickupAddress: Address;
  pickupInstructions?: string;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
  status: DonationStatus;
  reservedBy?: string;
  reservedAt?: Date;
  completedAt?: Date;
}

export interface DonationWithDistance extends Donation {
  distance: number; // Distance in kilometers from the query origin
}

export interface Reservation {
  id: string;
  donationId: string;
  recipientId: string;
  recipientName: string;
  createdAt: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  pickupTime?: Date;
  completedAt?: Date;
  donorFeedback?: string;
  recipientFeedback?: string;
}

export interface DonationFilters {
  category?: string;
  status?: DonationStatus;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  limit?: number;
  lastVisible?: any; // Firestore document snapshot
}
