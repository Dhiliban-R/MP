'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import BackButton from '@/components/ui/back-button';
import { BarChart2, Users, Activity, Package, ShoppingBag, Calendar, TrendingUp, Award, Utensils } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore'; // Added doc, getDoc
import { AnalyticsData, DonationStatus } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast as sonnerToast } from 'sonner'; // For notifications
import { Skeleton } from '@/components/ui/skeleton';

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month' | 'year'>('all'); // Added 'all'
  const [error, setError] = useState<string | null>(null);
  const [allDonationsForFiltering, setAllDonationsForFiltering] = useState<any[]>([]);


  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Aggregated Analytics from 'analytics/summary'
        const analyticsDocRef = doc(db, 'analytics', 'summary');
        const analyticsDocSnap = await getDoc(analyticsDocRef);
        let summaryDataExists = false;

        if (analyticsDocSnap.exists()) {
          summaryDataExists = true;
          const summary = analyticsDocSnap.data();
          setAnalyticsData({
            totalDonations: summary.totalDonations || 0,
            activeDonations: summary.activeDonations || 0,
            completedDonations: summary.completedDonations || 0,
            totalRecipients: summary.totalRecipients || 0,
            totalDonors: summary.totalDonors || 0,
            donationsByCategory: summary.donationsByCategory || {},
            donationTrend: summary.donationTrend || {}, // This is an object {"Mon YYYY": count}
            impactMetrics: summary.impactMetrics || { mealsProvided: 0, foodWasteSaved: 0, carbonFootprint: 0 },
          });
        } else {
          console.warn("Analytics summary document not found!");
          sonnerToast.warning('Analytics summary not found. Some global stats might be missing.');
          // Initialize with empty/zeroed data if summary is missing
          setAnalyticsData({
            totalDonations: 0, activeDonations: 0, completedDonations: 0,
            totalRecipients: 0, totalDonors: 0,
            donationsByCategory: {}, donationTrend: {},
            impactMetrics: { mealsProvided: 0, foodWasteSaved: 0, carbonFootprint: 0 },
          });
        }

        // If a specific time range is selected (not 'all'), or if summary doesn't exist (for category calculation)
        // we might need to fetch all donations for client-side filtering for categories/status.
        // The main trend chart will use summaryData.donationTrend if available.
        if (timeRange !== 'all' || !summaryDataExists) {
            const donationsQuery = query(collection(db, 'donations'), orderBy('createdAt', 'desc'));
            const donationsSnapshot = await getDocs(donationsQuery);
            const fetchedDonations = donationsSnapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: (d.data().createdAt as Timestamp)?.toDate() || new Date(),
            }));
            setAllDonationsForFiltering(fetchedDonations); // Store for potential client-side filtering

            if (!summaryDataExists) { // If summary didn't exist, populate some stats from full fetch
                 setAnalyticsData(prev => ({
                    ...prev!,
                    totalDonations: fetchedDonations.length,
                    activeDonations: fetchedDonations.filter(d => d.status === DonationStatus.ACTIVE).length,
                    completedDonations: fetchedDonations.filter(d => d.status === DonationStatus.COMPLETED).length,
                    // Note: totalRecipients & totalDonors would still be missing or require user collection scan
                 }));
            }
        }

      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data.');
        sonnerToast.error('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  // Prepare data for charts based on analyticsData and potentially timeRange
  const getChartData = () => {
    const now = new Date();
    let startDate: Date;
    let filteredForRange = allDonationsForFiltering;

    if (timeRange !== 'all') {
        if (timeRange === 'week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
        } else if (timeRange === 'month') {
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
        } else { // year
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
        }
        filteredForRange = allDonationsForFiltering.filter(d =>
            d.createdAt >= startDate && d.createdAt <= now
        );
    }

    // Donation Trend Data
    // Uses summary data if 'all' and summary exists, otherwise calculates from filtered (if needed for specific range)
    // For this subtask, we'll primarily rely on summary.donationTrend for the main trend chart.
    // If timeRange !== 'all', this chart might show "data for selected period" or hide if granularity mismatch.
    // For now, let's assume `analyticsData.donationTrend` (from summary) is the primary source for the trend chart.
    const trendDataFromSummary = analyticsData?.donationTrend || {};
    const donationTrendChartData = Object.entries(trendDataFromSummary)
        .map(([date, count]) => ({ date, count: count as number }))
        // Simple sort for month-year strings; more robust parsing might be needed for perfect chronological order
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    // Donations by Category Data
    // Uses summary data if 'all' and summary exists, otherwise calculates from filteredForRange
    let categoryChartData: { name: string; value: number }[] = [];
    if (timeRange === 'all' && analyticsData && Object.keys(analyticsData.donationsByCategory).length > 0) {
        categoryChartData = Object.entries(analyticsData.donationsByCategory).map(([name, value]) => ({ name, value: value as number }));
    } else if (filteredForRange.length > 0) {
        const donationsByCategoryInRange: Record<string, number> = {};
        filteredForRange.forEach(donation => {
            const category = (donation as any).category || 'Uncategorized';
            donationsByCategoryInRange[category] = (donationsByCategoryInRange[category] || 0) + 1;
        });
        categoryChartData = Object.entries(donationsByCategoryInRange).map(([name, value]) => ({ name, value }));
    }

    return { donationTrendChartData, categoryChartData };
  };

  const { donationTrendChartData, categoryChartData } = getChartData();


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-10 px-4 md:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary">Analytics Dashboard</h1>
          <BackButton href="/admin/dashboard" label="Back to Dashboard" />
        </div>
        
        <p className="text-muted-foreground mb-8">
          Comprehensive analytics and insights for the food donation platform.
        </p>

        {/* Time range selector */}
        <div className="mb-8">
          <Tabs 
            defaultValue="all"
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as 'all' | 'week' | 'month' | 'year')}
            className="w-full max-w-md"
          >
            <TabsList className="grid w-full grid-cols-4"> {/* Updated for 4 tabs */}
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="week">Last Week</TabsTrigger>
              <TabsTrigger value="month">Last Month</TabsTrigger>
              <TabsTrigger value="year">Last Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary" />
                Total Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{analyticsData?.totalDonations || 0}</div>
              )}
              <p className="text-sm text-muted-foreground mt-1">All time donations</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-green-500" />
                Active Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{analyticsData?.activeDonations || 0}</div>
              )}
              <p className="text-sm text-muted-foreground mt-1">Currently available</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-500" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">
                  {(analyticsData?.totalDonors || 0) + (analyticsData?.totalRecipients || 0)}
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {analyticsData?.totalDonors || 0} donors, {analyticsData?.totalRecipients || 0} recipients
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                Completed Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{analyticsData?.completedDonations || 0}</div>
              )}
              <p className="text-sm text-muted-foreground mt-1">Successfully delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                Donation Trends
              </CardTitle>
              <CardDescription>
                {timeRange === 'week' ? 'Daily donations for the past week' : 
                 timeRange === 'month' ? 'Daily donations for the past month' : 
                 'Monthly donations for the past year'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={donationTrendChartData} // Use processed data
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" /> {/* Ensure this matches processed data key */}
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Donations" /> {/* Ensure this matches processed data key */}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary" />
                Donations by Category
              </CardTitle>
              <CardDescription>
                Distribution of donations across different food categories {timeRange !== 'all' ? `(Last ${timeRange})` : '(All Time)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={categoryChartData} // Use processed data
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Impact metrics */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-500" />
              Impact Metrics
            </CardTitle>
            <CardDescription>
              Measuring the positive impact of food donations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <Utensils className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="text-lg font-medium text-green-800">Meals Provided</h3>
                {loading ? (
                  <Skeleton className="h-10 w-24 mx-auto mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {analyticsData?.impactMetrics.mealsProvided.toLocaleString() || 0}
                  </p>
                )}
              </div>
              
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="text-lg font-medium text-blue-800">Food Waste Saved</h3>
                {loading ? (
                  <Skeleton className="h-10 w-24 mx-auto mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-blue-700 mt-2">
                    {analyticsData?.impactMetrics.foodWasteSaved.toLocaleString() || 0} kg
                  </p>
                )}
              </div>
              
              <div className="bg-purple-50 rounded-lg p-6 text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="text-lg font-medium text-purple-800">Carbon Footprint Reduced</h3>
                {loading ? (
                  <Skeleton className="h-10 w-24 mx-auto mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-purple-700 mt-2">
                    {analyticsData?.impactMetrics.carbonFootprint.toLocaleString() || 0} kg CO₂
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
