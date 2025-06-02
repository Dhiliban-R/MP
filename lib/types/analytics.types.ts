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
