'use client';

import { db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs, Timestamp, orderBy, limit, startAfter } from 'firebase/firestore';
import { AnalyticsData } from './types/analytics.types';
import { DonationStatus, Donation } from './types/donation.types';

// Get analytics summary data
export const getAnalyticsSummary = async (): Promise<AnalyticsData> => {
  try {
    // Get the analytics summary document
    const analyticsRef = doc(db, 'analytics', 'summary');
    const analyticsDoc = await getDoc(analyticsRef);
    
    if (!analyticsDoc.exists()) {
      // Return default values if analytics document doesn't exist
      return {
        totalDonations: 0,
        activeDonations: 0,
        completedDonations: 0,
        totalRecipients: 0,
        totalDonors: 0,
        donationsByCategory: {},
        donationTrend: [],
        impactMetrics: {
          mealsProvided: 0,
          foodWasteSaved: 0,
          carbonFootprint: 0
        }
      };
    }
    
    const data = analyticsDoc.data();
    
    // Format donation trend data for chart
    const trendData = data.donationTrend || {};
    const formattedTrend = Object.entries(trendData).map(([date, count]) => ({
      date,
      count: count as number
    }));
    
    // Sort trend data by date (assuming format is "MMM YYYY")
    formattedTrend.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    return {
      totalDonations: data.totalDonations || 0,
      activeDonations: data.activeDonations || 0,
      completedDonations: data.completedDonations || 0,
      totalRecipients: data.totalRecipients || 0,
      totalDonors: data.totalDonors || 0,
      donationsByCategory: data.donationsByCategory || {},
      donationTrend: formattedTrend,
      impactMetrics: {
        mealsProvided: data.impactMetrics?.mealsProvided || 0,
        foodWasteSaved: data.impactMetrics?.foodWasteSaved || 0,
        carbonFootprint: data.impactMetrics?.carbonFootprint || 0
      }
    };
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    throw error;
  }
};

// Get donor-specific analytics
export const getDonorAnalytics = async (donorId: string): Promise<AnalyticsData> => {
  try {
    // Get the global analytics first
    const globalAnalytics = await getAnalyticsSummary();
    
    // Query donations by this donor
    const donationsQuery = query(
      collection(db, 'donations'),
      where('donorId', '==', donorId)
    );
    
    const donationsSnapshot = await getDocs(donationsQuery);
    
    // Count donations by status
    let totalDonations = 0;
    let activeDonations = 0;
    let completedDonations = 0;
    const donationsByCategory: Record<string, number> = {};
    const donationsByMonth: Record<string, number> = {};
    let mealsProvided = 0;
    let foodWasteSaved = 0;
    let carbonFootprint = 0;
    
    donationsSnapshot.forEach(doc => {
      const donation = doc.data();
      totalDonations++;
      
      // Count by status
      if (donation.status === DonationStatus.ACTIVE) {
        activeDonations++;
      } else if (donation.status === DonationStatus.COMPLETED) {
        completedDonations++;
      }
      
      // Count by category
      const category = donation.category || 'Other';
      donationsByCategory[category] = (donationsByCategory[category] || 0) + 1;
      
      // Group by month for trend data
      const createdAt = donation.createdAt as Timestamp;
      if (createdAt) {
        const date = createdAt.toDate();
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        donationsByMonth[monthYear] = (donationsByMonth[monthYear] || 0) + 1;
      }
      
      // Calculate impact metrics based on quantity and category
      const quantity = donation.quantity || 0;
      
      // These calculations should match the ones in the Cloud Function
      switch((donation.category || '').toLowerCase()) {
        case 'produce':
        case 'fruits':
        case 'vegetables':
          mealsProvided += quantity * 2;
          foodWasteSaved += quantity;
          carbonFootprint += quantity * 2.5;
          break;
        case 'grains':
        case 'bread':
        case 'bakery':
          mealsProvided += quantity * 4;
          foodWasteSaved += quantity;
          carbonFootprint += quantity * 1.8;
          break;
        case 'dairy':
          mealsProvided += quantity * 3;
          foodWasteSaved += quantity;
          carbonFootprint += quantity * 3.2;
          break;
        case 'meat':
        case 'protein':
          mealsProvided += quantity * 5;
          foodWasteSaved += quantity;
          carbonFootprint += quantity * 5.5;
          break;
        case 'prepared':
        case 'meals':
          mealsProvided += quantity * 1;
          foodWasteSaved += quantity * 0.5;
          carbonFootprint += quantity * 2.2;
          break;
        default:
          mealsProvided += quantity * 2;
          foodWasteSaved += quantity;
          carbonFootprint += quantity * 2.5;
      }
    });
    
    // Format trend data
    const trendData = Object.entries(donationsByMonth).map(([date, count]) => ({
      date,
      count
    }));
    
    // Sort trend data by date
    trendData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    return {
      totalDonations,
      activeDonations,
      completedDonations,
      totalRecipients: globalAnalytics.totalRecipients,
      totalDonors: globalAnalytics.totalDonors,
      donationsByCategory,
      donationTrend: trendData,
      impactMetrics: {
        mealsProvided,
        foodWasteSaved,
        carbonFootprint
      }
    };
  } catch (error) {
    console.error('Error getting donor analytics:', error);
    throw error;
  }
};

// Get recipient-specific analytics
export const getRecipientAnalytics = async (recipientId: string): Promise<AnalyticsData> => {
  try {
    // Get the global analytics first
    const globalAnalytics = await getAnalyticsSummary();
    
    // Query reservations by this recipient
    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('recipientId', '==', recipientId)
    );
    
    const reservationsSnapshot = await getDocs(reservationsQuery);
    
    // Count reservations by status
    let totalReservations = 0;
    let completedReservations = 0;
    let pendingReservations = 0;
    const reservationsByMonth: Record<string, number> = {};
    
    reservationsSnapshot.forEach(doc => {
      const reservation = doc.data();
      totalReservations++;
      
      // Count by status
      if (reservation.status === 'completed') {
        completedReservations++;
      } else if (reservation.status === 'confirmed' || reservation.status === 'pending') {
        pendingReservations++;
      }
      
      // Group by month for trend data
      const createdAt = reservation.createdAt as Timestamp;
      if (createdAt) {
        const date = createdAt.toDate();
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        reservationsByMonth[monthYear] = (reservationsByMonth[monthYear] || 0) + 1;
      }
    });
    
    // Format trend data
    const trendData = Object.entries(reservationsByMonth).map(([date, count]) => ({
      date,
      count
    }));
    
    // Sort trend data by date
    trendData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    // For recipients, we'll use the global impact metrics
    // but scale them based on the proportion of completed reservations
    const impactProportion = globalAnalytics.completedDonations > 0 
      ? completedReservations / globalAnalytics.completedDonations 
      : 0;
    
    return {
      totalDonations: totalReservations,
      activeDonations: pendingReservations,
      completedDonations: completedReservations,
      totalRecipients: globalAnalytics.totalRecipients,
      totalDonors: globalAnalytics.totalDonors,
      donationsByCategory: {}, // Not relevant for recipients
      donationTrend: trendData,
      impactMetrics: {
        mealsProvided: Math.round(globalAnalytics.impactMetrics.mealsProvided * impactProportion),
        foodWasteSaved: Math.round(globalAnalytics.impactMetrics.foodWasteSaved * impactProportion),
        carbonFootprint: Math.round(globalAnalytics.impactMetrics.carbonFootprint * impactProportion)
      }
    };
  } catch (error) {
    console.error('Error getting recipient analytics:', error);
    throw error;
  }
};

// Advanced Analytics Interfaces
export interface DetailedImpactReport {
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  summary: {
    totalDonations: number;
    totalQuantity: number;
    mealsProvided: number;
    foodWasteSaved: number;
    carbonFootprintSaved: number;
    uniqueDonors: number;
    uniqueRecipients: number;
    averageResponseTime: number; // in hours
    completionRate: number; // percentage
    totalValue: number; // estimated monetary value
  };
  breakdown: {
    byCategory: Record<string, { count: number; quantity: number; impact: number; value: number }>;
    byLocation: Record<string, { count: number; quantity: number }>;
    byTimeOfDay: Record<string, number>;
    byDayOfWeek: Record<string, number>;
    byStatus: Record<string, number>;
    byUrgency: Record<string, number>;
  };
  trends: {
    donationVolume: Array<{ date: string; count: number; quantity: number }>;
    impactTrend: Array<{ date: string; meals: number; waste: number; carbon: number }>;
    userGrowth: Array<{ date: string; donors: number; recipients: number }>;
    categoryTrends: Record<string, Array<{ date: string; count: number }>>;
  };
  performance: {
    averagePickupTime: number;
    donorRetentionRate: number;
    recipientSatisfactionScore: number;
    platformEfficiency: number;
  };
  predictions: {
    nextWeekDonations: number;
    nextMonthImpact: number;
    seasonalTrends: Array<{ month: string; predicted: number; confidence: number }>;
  };
}

export interface ExportData {
  donations: Donation[];
  analytics: AnalyticsData;
  metadata: {
    exportDate: Date;
    period: string;
    totalRecords: number;
    filters?: Record<string, any>;
  };
}

/**
 * Generate detailed impact report
 */
export const generateImpactReport = async (
  period: 'week' | 'month' | 'quarter' | 'year',
  startDate?: Date,
  endDate?: Date
): Promise<DetailedImpactReport> => {
  try {
    // Calculate date range if not provided
    const now = new Date();
    if (!endDate) endDate = now;
    if (!startDate) {
      startDate = new Date(endDate);
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
    }

    // Get donations in the period
    const donationsQuery = query(
      collection(db, 'donations'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );

    const donationsSnapshot = await getDocs(donationsQuery);
    const donations = donationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      expiryDate: doc.data().expiryDate.toDate()
    })) as Donation[];

    // Calculate summary metrics
    const completedDonations = donations.filter(d => d.status === DonationStatus.COMPLETED);
    const totalResponseTimes = donations
      .filter(d => d.reservedAt && d.createdAt)
      .map(d => {
        const created = new Date(d.createdAt).getTime();
        const reserved = new Date(d.reservedAt!).getTime();
        return (reserved - created) / (1000 * 60 * 60); // hours
      });

    const summary = {
      totalDonations: donations.length,
      totalQuantity: donations.reduce((sum, d) => sum + d.quantity, 0),
      mealsProvided: donations.reduce((sum, d) => sum + calculateMealsProvided(d.quantity, d.category), 0),
      foodWasteSaved: donations.reduce((sum, d) => sum + d.quantity, 0),
      carbonFootprintSaved: donations.reduce((sum, d) => sum + calculateCarbonSaved(d.quantity, d.category), 0),
      uniqueDonors: new Set(donations.map(d => d.donorId)).size,
      uniqueRecipients: new Set(donations.filter(d => d.reservedBy).map(d => d.reservedBy)).size,
      averageResponseTime: totalResponseTimes.length > 0 ?
        totalResponseTimes.reduce((sum, time) => sum + time, 0) / totalResponseTimes.length : 0,
      completionRate: donations.length > 0 ? (completedDonations.length / donations.length) * 100 : 0,
      totalValue: donations.reduce((sum, d) => sum + calculateDonationValue(d.quantity, d.category), 0)
    };

    // Calculate breakdowns
    const byCategory: Record<string, any> = {};
    const byLocation: Record<string, any> = {};
    const byTimeOfDay: Record<string, number> = {};
    const byDayOfWeek: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byUrgency: Record<string, number> = {};

    donations.forEach(donation => {
      // By category
      if (!byCategory[donation.category]) {
        byCategory[donation.category] = { count: 0, quantity: 0, impact: 0, value: 0 };
      }
      byCategory[donation.category].count++;
      byCategory[donation.category].quantity += donation.quantity;
      byCategory[donation.category].impact += calculateMealsProvided(donation.quantity, donation.category);
      byCategory[donation.category].value += calculateDonationValue(donation.quantity, donation.category);

      // By location (city)
      const city = donation.pickupAddress?.city || 'Unknown';
      if (!byLocation[city]) {
        byLocation[city] = { count: 0, quantity: 0 };
      }
      byLocation[city].count++;
      byLocation[city].quantity += donation.quantity;

      // By status
      byStatus[donation.status] = (byStatus[donation.status] || 0) + 1;

      // By urgency (based on expiry time)
      const urgencyLevel = calculateUrgencyLevel(donation);
      byUrgency[urgencyLevel] = (byUrgency[urgencyLevel] || 0) + 1;

      // By time of day
      const hour = donation.createdAt.getHours();
      const timeSlot = getTimeSlot(hour);
      byTimeOfDay[timeSlot] = (byTimeOfDay[timeSlot] || 0) + 1;

      // By day of week
      const dayOfWeek = donation.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
      byDayOfWeek[dayOfWeek] = (byDayOfWeek[dayOfWeek] || 0) + 1;
    });

    // Generate trends (daily data points)
    const trends = generateTrends(donations, startDate, endDate);

    return {
      period,
      startDate,
      endDate,
      summary,
      breakdown: {
        byCategory,
        byLocation,
        byTimeOfDay,
        byDayOfWeek
      },
      trends
    };
  } catch (error) {
    console.error('Error generating impact report:', error);
    throw error;
  }
};

/**
 * Export analytics data
 */
export const exportAnalyticsData = async (
  format: 'json' | 'csv',
  filters?: Record<string, any>
): Promise<ExportData> => {
  try {
    // Get donations based on filters
    let donationsQuery = query(collection(db, 'donations'), orderBy('createdAt', 'desc'));

    if (filters?.startDate) {
      donationsQuery = query(donationsQuery, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters?.endDate) {
      donationsQuery = query(donationsQuery, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
    }
    if (filters?.status) {
      donationsQuery = query(donationsQuery, where('status', '==', filters.status));
    }
    if (filters?.category) {
      donationsQuery = query(donationsQuery, where('category', '==', filters.category));
    }

    const donationsSnapshot = await getDocs(donationsQuery);
    const donations = donationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      expiryDate: doc.data().expiryDate.toDate()
    })) as Donation[];

    // Get analytics data
    const analytics = await getAnalyticsSummary();

    return {
      donations,
      analytics,
      metadata: {
        exportDate: new Date(),
        period: filters?.period || 'all',
        totalRecords: donations.length,
        filters
      }
    };
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    throw error;
  }
};

/**
 * Get top performing donors
 */
export const getTopDonors = async (limit: number = 10) => {
  try {
    const donationsQuery = query(
      collection(db, 'donations'),
      where('status', 'in', [DonationStatus.COMPLETED, DonationStatus.RESERVED]),
      orderBy('createdAt', 'desc')
    );

    const donationsSnapshot = await getDocs(donationsQuery);
    const donorStats: Record<string, any> = {};

    donationsSnapshot.docs.forEach(doc => {
      const donation = doc.data();
      const donorId = donation.donorId;

      if (!donorStats[donorId]) {
        donorStats[donorId] = {
          donorId,
          donorName: donation.donorName,
          totalDonations: 0,
          totalQuantity: 0,
          completedDonations: 0,
          impactScore: 0
        };
      }

      donorStats[donorId].totalDonations++;
      donorStats[donorId].totalQuantity += donation.quantity;

      if (donation.status === DonationStatus.COMPLETED) {
        donorStats[donorId].completedDonations++;
      }

      donorStats[donorId].impactScore += calculateMealsProvided(donation.quantity, donation.category);
    });

    return Object.values(donorStats)
      .sort((a: any, b: any) => b.impactScore - a.impactScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting top donors:', error);
    throw error;
  }
};

// Helper functions
const calculateMealsProvided = (quantity: number, category: string): number => {
  const multipliers: Record<string, number> = {
    'Fresh Produce': 2,
    'Dairy Products': 3,
    'Meat & Poultry': 5,
    'Bakery Items': 4,
    'Canned Goods': 3,
    'Frozen Foods': 3,
    'Beverages': 1,
    'Prepared Meals': 1,
    'Snacks': 2
  };
  return quantity * (multipliers[category] || 2);
};

const calculateCarbonSaved = (quantity: number, category: string): number => {
  const carbonFactors: Record<string, number> = {
    'Fresh Produce': 2.5,
    'Dairy Products': 3.2,
    'Meat & Poultry': 5.5,
    'Bakery Items': 1.8,
    'Canned Goods': 2.0,
    'Frozen Foods': 2.8,
    'Beverages': 1.5,
    'Prepared Meals': 2.2,
    'Snacks': 2.0
  };
  return quantity * (carbonFactors[category] || 2.5);
};

const getTimeSlot = (hour: number): string => {
  if (hour < 6) return 'Night (12-6 AM)';
  if (hour < 12) return 'Morning (6-12 PM)';
  if (hour < 18) return 'Afternoon (12-6 PM)';
  return 'Evening (6-12 AM)';
};

const generateTrends = (donations: Donation[], startDate: Date, endDate: Date) => {
  const donationVolume: Array<{ date: string; count: number; quantity: number }> = [];
  const userActivity: Array<{ date: string; donors: number; recipients: number }> = [];
  const completionRate: Array<{ date: string; rate: number }> = [];

  // Group donations by date
  const donationsByDate: Record<string, Donation[]> = {};
  donations.forEach(donation => {
    const dateKey = donation.createdAt.toISOString().split('T')[0];
    if (!donationsByDate[dateKey]) {
      donationsByDate[dateKey] = [];
    }
    donationsByDate[dateKey].push(donation);
  });

  // Generate daily data points
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const dayDonations = donationsByDate[dateKey] || [];

    donationVolume.push({
      date: dateKey,
      count: dayDonations.length,
      quantity: dayDonations.reduce((sum, d) => sum + d.quantity, 0)
    });

    userActivity.push({
      date: dateKey,
      donors: new Set(dayDonations.map(d => d.donorId)).size,
      recipients: new Set(dayDonations.filter(d => d.reservedBy).map(d => d.reservedBy)).size
    });

    const completed = dayDonations.filter(d => d.status === DonationStatus.COMPLETED).length;
    const total = dayDonations.length;
    completionRate.push({
      date: dateKey,
      rate: total > 0 ? (completed / total) * 100 : 0
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    donationVolume,
    userActivity,
    completionRate
  };
};

// Enhanced utility functions
export const calculateDonationValue = (quantity: number, category: string): number => {
  // Estimated monetary value per unit by category
  const valuePerUnit: Record<string, number> = {
    'Fresh Produce': 3.50,
    'Prepared Meals': 8.00,
    'Packaged Foods': 2.50,
    'Dairy Products': 4.00,
    'Baked Goods': 3.00,
    'Beverages': 2.00,
    'Meat & Seafood': 12.00,
    'Grains & Pasta': 1.50,
    'Canned Goods': 2.00,
    'Snacks': 2.50,
    'Baby Food': 5.00,
    'Other': 3.00
  };

  return quantity * (valuePerUnit[category] || valuePerUnit['Other']);
};

export const calculateUrgencyLevel = (donation: Donation): string => {
  if (!donation.expiryDate) return 'Low';

  const now = new Date();
  const expiry = new Date(donation.expiryDate);
  const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilExpiry < 0) return 'Expired';
  if (hoursUntilExpiry < 6) return 'Critical';
  if (hoursUntilExpiry < 24) return 'High';
  if (hoursUntilExpiry < 72) return 'Medium';
  return 'Low';
};

// Calculate performance metrics
export const calculatePerformanceMetrics = (donations: Donation[]) => {
  const completedDonations = donations.filter(d => d.status === DonationStatus.COMPLETED);

  // Average pickup time (from creation to completion)
  const pickupTimes = completedDonations
    .filter(d => d.completedAt && d.createdAt)
    .map(d => {
      const created = new Date(d.createdAt).getTime();
      const completed = new Date(d.completedAt!).getTime();
      return (completed - created) / (1000 * 60 * 60); // hours
    });

  const averagePickupTime = pickupTimes.length > 0 ?
    pickupTimes.reduce((sum, time) => sum + time, 0) / pickupTimes.length : 0;

  // Donor retention rate (donors who made multiple donations)
  const donorCounts: Record<string, number> = {};
  donations.forEach(d => {
    donorCounts[d.donorId] = (donorCounts[d.donorId] || 0) + 1;
  });
  const repeatDonors = Object.values(donorCounts).filter(count => count > 1).length;
  const totalDonors = Object.keys(donorCounts).length;
  const donorRetentionRate = totalDonors > 0 ? (repeatDonors / totalDonors) * 100 : 0;

  // Platform efficiency (completion rate)
  const platformEfficiency = donations.length > 0 ?
    (completedDonations.length / donations.length) * 100 : 0;

  return {
    averagePickupTime,
    donorRetentionRate,
    recipientSatisfactionScore: 85, // This would come from surveys/ratings
    platformEfficiency
  };
};

// Generate predictions based on historical data
export const generatePredictions = (donations: Donation[]) => {
  // Simple linear regression for next week predictions
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentDonations = donations.filter(d => new Date(d.createdAt) >= oneWeekAgo);

  if (recentDonations.length < 2) {
    return {
      nextWeekDonations: 0,
      nextMonthImpact: 0,
      seasonalTrends: []
    };
  }

  // Calculate weekly average
  const weeklyAverage = recentDonations.length;
  const nextWeekDonations = Math.max(0, weeklyAverage);

  // Monthly impact prediction
  const avgMealsPerDonation = donations.length > 0 ?
    donations.reduce((sum, d) => sum + calculateMealsProvided(d.quantity, d.category), 0) / donations.length : 0;
  const nextMonthImpact = nextWeekDonations * 4 * avgMealsPerDonation;

  // Seasonal trends (simplified)
  const seasonalTrends = [
    { month: 'Jan', predicted: nextWeekDonations * 0.8, confidence: 75 },
    { month: 'Feb', predicted: nextWeekDonations * 0.9, confidence: 80 },
    { month: 'Mar', predicted: nextWeekDonations * 1.1, confidence: 85 },
    { month: 'Apr', predicted: nextWeekDonations * 1.2, confidence: 80 },
    { month: 'May', predicted: nextWeekDonations * 1.0, confidence: 85 },
    { month: 'Jun', predicted: nextWeekDonations * 0.9, confidence: 80 }
  ];

  return {
    nextWeekDonations: Math.round(nextWeekDonations),
    nextMonthImpact: Math.round(nextMonthImpact),
    seasonalTrends
  };
};