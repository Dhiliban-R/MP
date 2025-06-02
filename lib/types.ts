// Re-export types from dedicated type files to avoid conflicts
export type { UserRole, User, Address } from './types/user.types';
export type { Donation, DonationFilters, Reservation, DonationWithDistance } from './types/donation.types';
export { DonationStatus } from './types/donation.types';





// Notification type moved to lib/types/notification.types.ts
export type { Notification } from './types/notification.types';

export interface AnalyticsData {
  totalDonations: number;
  activeDonations: number;
  completedDonations: number;
  totalRecipients: number;
  totalDonors: number;
  donationsByCategory: Record<string, number>;
  donationTrend: {
    date: string;
    count: number;
  }[];
  impactMetrics: {
    mealsProvided: number;
    foodWasteSaved: number; // in kg
    carbonFootprint: number; // in kg CO2 equivalent
  };
}
