import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsData } from '@/lib/types/analytics.types';

interface AnalyticsProps {
  data: AnalyticsData;
  loading?: boolean;
}

const Analytics: React.FC<AnalyticsProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="w-full p-8 rounded-lg bg-muted/20 animate-pulse">
        <div className="h-8 w-1/3 bg-muted mb-4 rounded"></div>
        <div className="h-64 w-full bg-muted rounded"></div>
      </div>
    );
  }

  // Format donation trend data for chart
  const trendData = data.donationTrend || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Donation Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" name="Donations" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalDonations}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.activeDonations}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Completed Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.completedDonations}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Impact Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <h3 className="text-lg font-medium">Meals Provided</h3>
              <p className="text-2xl font-bold">{data.impactMetrics.mealsProvided.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Food Waste Saved</h3>
              <p className="text-2xl font-bold">{data.impactMetrics.foodWasteSaved.toLocaleString()} kg</p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Carbon Footprint Reduced</h3>
              <p className="text-2xl font-bold">{data.impactMetrics.carbonFootprint.toLocaleString()} kg CO₂</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
