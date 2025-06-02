'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Users, 
  Package, 
  Leaf, 
  DollarSign,
  Clock,
  Target,
  Award,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { generateImpactReport, DetailedImpactReport } from '@/lib/analytics-service';
import { formatDistanceToNow } from 'date-fns';

interface ImpactDashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export const ImpactDashboard: React.FC<ImpactDashboardProps> = ({
  className = ''
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [report, setReport] = useState<DetailedImpactReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load impact report
  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await generateImpactReport(period);
      setReport(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load impact report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [period]);

  if (loading && !report) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-gray-500">Loading impact analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Available</h3>
            <p className="text-gray-500">Unable to load impact analytics</p>
            <Button onClick={loadReport} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const categoryData = Object.entries(report.breakdown.byCategory).map(([name, data]) => ({
    name,
    count: data.count,
    quantity: data.quantity,
    impact: data.impact,
    value: data.value
  }));

  const statusData = Object.entries(report.breakdown.byStatus).map(([name, count]) => ({
    name,
    value: count
  }));

  const urgencyData = Object.entries(report.breakdown.byUrgency).map(([name, count]) => ({
    name,
    value: count
  }));

  const timeData = Object.entries(report.breakdown.byTimeOfDay).map(([name, count]) => ({
    name,
    value: count
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-6 w-6 text-green-500" />
                <span>Impact Dashboard</span>
                <Badge variant="outline">{period}</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive analytics and impact metrics
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={period} onValueChange={(value) => setPeriod(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={loadReport} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Last updated {formatDistanceToNow(lastUpdated)} ago
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Donations</p>
                <p className="text-3xl font-bold">{report.summary.totalDonations.toLocaleString()}</p>
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
                <p className="text-3xl font-bold">{report.summary.mealsProvided.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Food Waste Saved</p>
                <p className="text-3xl font-bold">{report.summary.foodWasteSaved.toLocaleString()}</p>
                <p className="text-orange-100 text-xs">kg</p>
              </div>
              <Leaf className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Value</p>
                <p className="text-3xl font-bold">${report.summary.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{report.summary.uniqueDonors + report.summary.uniqueRecipients}</p>
                <p className="text-xs text-gray-500">
                  {report.summary.uniqueDonors} donors, {report.summary.uniqueRecipients} recipients
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{report.summary.averageResponseTime.toFixed(1)}</p>
                <p className="text-xs text-gray-500">hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{report.summary.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Leaf className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Carbon Saved</p>
                <p className="text-2xl font-bold">{report.summary.carbonFootprintSaved.toFixed(1)}</p>
                <p className="text-xs text-gray-500">kg CO₂</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donation Volume Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Donation Volume Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={report.trends.donationVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5" />
              <span>Donations by Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impact Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Impact Over Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={report.trends.impactTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="meals" stroke="#8884d8" name="Meals" />
                <Line type="monotone" dataKey="waste" stroke="#82ca9d" name="Waste Saved (kg)" />
                <Line type="monotone" dataKey="carbon" stroke="#ffc658" name="Carbon Saved (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Donation Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {report.performance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Performance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {report.performance.averagePickupTime.toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600">Avg Pickup Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {report.performance.donorRetentionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Donor Retention</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {report.performance.recipientSatisfactionScore.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Satisfaction Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {report.performance.platformEfficiency.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Platform Efficiency</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predictions */}
      {report.predictions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Predictions & Forecasts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {report.predictions.nextWeekDonations}
                </div>
                <div className="text-sm text-blue-700">Predicted Next Week</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {report.predictions.nextMonthImpact}
                </div>
                <div className="text-sm text-green-700">Meals Next Month</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">
                  Seasonal Trends
                </div>
                <div className="text-sm text-orange-700">
                  {report.predictions.seasonalTrends.length} months forecasted
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
