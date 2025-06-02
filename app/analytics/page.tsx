'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  Download,
  RefreshCw,
  Calendar,
  Target,
  Award,
  Activity,
  PieChart as PieChartIcon,
  FileText,
  Share2
} from 'lucide-react';
import { ImpactDashboard } from '@/components/analytics/ImpactDashboard';
import { AdvancedAnalyticsDashboard } from '@/components/analytics/AdvancedAnalyticsDashboard';
import { getAnalyticsSummary, exportAnalyticsData, getTopDonors } from '@/lib/analytics-service';
import { AnalyticsData } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'impact' | 'advanced' | 'reports'>('overview');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [topDonors, setTopDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Load analytics data
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analytics, donors] = await Promise.all([
        getAnalyticsSummary(),
        getTopDonors(10)
      ]);
      
      setAnalyticsData(analytics);
      setTopDonors(donors);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Export analytics data
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportData = await exportAnalyticsData(timeRange);
      
      // Create and download CSV
      const csvContent = generateCSV(exportData);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fdms-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Analytics data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export analytics data');
    } finally {
      setExporting(false);
    }
  };

  // Generate CSV content
  const generateCSV = (data: any) => {
    const headers = ['Date', 'Donations', 'Meals Provided', 'Food Waste Saved', 'Carbon Saved'];
    const rows = data.donations.map((donation: any) => [
      new Date(donation.createdAt).toLocaleDateString(),
      '1',
      donation.quantity.toString(),
      donation.quantity.toString(),
      (donation.quantity * 2.5).toString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  if (loading && !analyticsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-lg text-gray-600 mt-2">
            Comprehensive insights into donation impact and platform performance
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={handleExport} disabled={exporting}>
            <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Donations</p>
                  <p className="text-3xl font-bold">{analyticsData.totalDonations.toLocaleString()}</p>
                  <p className="text-blue-100 text-xs">
                    {analyticsData.activeDonations} active
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Meals Provided</p>
                  <p className="text-3xl font-bold">{analyticsData.impactMetrics.mealsProvided.toLocaleString()}</p>
                  <p className="text-green-100 text-xs">
                    {analyticsData.impactMetrics.foodWasteSaved.toLocaleString()}kg saved
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Active Users</p>
                  <p className="text-3xl font-bold">{analyticsData.totalDonors + analyticsData.totalRecipients}</p>
                  <p className="text-orange-100 text-xs">
                    {analyticsData.totalDonors} donors, {analyticsData.totalRecipients} recipients
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Carbon Impact</p>
                  <p className="text-3xl font-bold">{analyticsData.impactMetrics.carbonFootprint.toFixed(1)}</p>
                  <p className="text-purple-100 text-xs">kg CO₂ saved</p>
                </div>
                <Activity className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics Interface */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="impact" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Impact</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Advanced</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {analyticsData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Chart */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Donation Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Chart would go here - using existing chart components */}
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                      <p className="text-gray-500">Donation trend chart</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Donors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Top Donors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topDonors.slice(0, 5).map((donor, index) => (
                      <div key={donor.donorId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium text-sm">{donor.donorName}</p>
                            <p className="text-xs text-gray-500">
                              {donor.totalDonations} donations
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{donor.impactScore}</p>
                          <p className="text-xs text-gray-500">impact</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Impact Tab */}
        <TabsContent value="impact" className="space-y-6">
          <ImpactDashboard />
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <AdvancedAnalyticsDashboard />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Analytics Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
                  <Download className="h-6 w-6" />
                  <span>Export CSV</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
                  <FileText className="h-6 w-6" />
                  <span>Generate PDF</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
                  <Share2 className="h-6 w-6" />
                  <span>Share Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
