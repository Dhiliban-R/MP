'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import BackButton from '@/components/ui/back-button';
import { BarChart2, Users, Activity, Package, ShoppingBag, Calendar, TrendingUp, Award, Utensils } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { AnalyticsData, DonationStatus } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        // Get all donations
        const donationsQuery = query(
          collection(db, 'donations'),
          orderBy('createdAt', 'desc')
        );
        const donationsSnapshot = await getDocs(donationsQuery);
        const donations = donationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        }));

        // Get all users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate donation trends
        const now = new Date();
        let startDate: Date;
        
        if (timeRange === 'week') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
        } else if (timeRange === 'month') {
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
        } else {
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
        }

        const filteredDonations = donations.filter(d => 
          d.createdAt >= startDate && d.createdAt <= now
        );

        // Group donations by date
        const donationsByDate: Record<string, number> = {};
        filteredDonations.forEach(donation => {
          let dateKey: string;
          
          if (timeRange === 'week') {
            dateKey = donation.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
          } else if (timeRange === 'month') {
            dateKey = donation.createdAt.toLocaleDateString('en-US', { day: '2-digit' });
          } else {
            dateKey = donation.createdAt.toLocaleDateString('en-US', { month: 'short' });
          }
          
          donationsByDate[dateKey] = (donationsByDate[dateKey] || 0) + 1;
        });

        // Convert to array for chart
        const donationTrend = Object.entries(donationsByDate).map(([date, count]) => ({
          date,
          count
        }));

        // Calculate donations by category
        const donationsByCategory: Record<string, number> = {};
        filteredDonations.forEach(donation => {
          const donationData = donation as any; // Type assertion for analytics
          const category = donationData.category || 'Uncategorized';
          donationsByCategory[category] = (donationsByCategory[category] || 0) + 1;
        });

        // Calculate donations by status
        const donationsByStatus: Record<string, number> = {};
        filteredDonations.forEach(donation => {
          const donationData = donation as any; // Type assertion for analytics
          const status = donationData.status || 'unknown';
          donationsByStatus[status] = (donationsByStatus[status] || 0) + 1;
        });

        // Calculate impact metrics
        const completedDonations = donations.filter(d => (d as any).status === DonationStatus.COMPLETED);
        const totalQuantity = completedDonations.reduce((sum, d) => sum + ((d as any).quantity || 0), 0);
        
        // Estimate meals provided (assuming 1 meal = 0.5kg of food on average)
        const mealsProvided = Math.round(totalQuantity * 2);
        
        // Estimate food waste saved in kg
        const foodWasteSaved = totalQuantity;
        
        // Estimate carbon footprint saved (assuming 2.5kg CO2 saved per kg of food waste)
        const carbonFootprint = Math.round(foodWasteSaved * 2.5);

        setAnalyticsData({
          totalDonations: donations.length,
          activeDonations: donations.filter(d => (d as any).status === DonationStatus.ACTIVE).length,
          completedDonations: completedDonations.length,
          totalRecipients: users.filter(u => (u as any).role === 'recipient').length,
          totalDonors: users.filter(u => (u as any).role === 'donor').length,
          donationsByCategory,
          donationTrend,
          impactMetrics: {
            mealsProvided,
            foodWasteSaved,
            carbonFootprint
          }
        });
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  // Format category data for pie chart
  const categoryData = analyticsData ? 
    Object.entries(analyticsData.donationsByCategory).map(([name, value]) => ({ name, value })) : 
    [];

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
            defaultValue="month" 
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as 'week' | 'month' | 'year')}
            className="w-full max-w-md"
          >
            <TabsList className="grid w-full grid-cols-3">
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
                    data={analyticsData?.donationTrend || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Donations" />
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
                Distribution of donations across different food categories
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
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
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
