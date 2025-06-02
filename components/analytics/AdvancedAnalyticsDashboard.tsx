'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Download, 
  Calendar,
  Users,
  Package,
  Leaf,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { 
  generateImpactReport, 
  exportAnalyticsData, 
  getTopDonors,
  DetailedImpactReport,
  ExportData 
} from '@/lib/analytics-service';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface AdvancedAnalyticsDashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  className = ''
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [report, setReport] = useState<DetailedImpactReport | null>(null);
  const [topDonors, setTopDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load initial data
  useEffect(() => {
    loadReport();
    loadTopDonors();
  }, [period, dateRange]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const reportData = await generateImpactReport(
        period,
        dateRange?.from,
        dateRange?.to
      );
      setReport(reportData);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopDonors = async () => {
    try {
      const donors = await getTopDonors(10);
      setTopDonors(donors);
    } catch (error) {
      console.error('Error loading top donors:', error);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const exportData = await exportAnalyticsData(format, {
        period,
        startDate: dateRange?.from,
        endDate: dateRange?.to
      });

      // Create and download file
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(exportData, null, 2) : convertToCSV(exportData)],
        { type: format === 'json' ? 'application/json' : 'text/csv' }
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${format}-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExporting(false);
    }
  };

  const convertToCSV = (data: ExportData): string => {
    const headers = ['ID', 'Title', 'Category', 'Quantity', 'Status', 'Created Date', 'Donor Name'];
    const rows = data.donations.map(donation => [
      donation.id,
      `"${donation.title}"`,
      `"${donation.category}"`,
      donation.quantity,
      donation.status,
      format(donation.createdAt, 'yyyy-MM-dd'),
      `"${donation.donorName}"`
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  if (loading && !report) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Advanced Analytics Dashboard</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                disabled={exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Period:</label>
              <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Custom Range:</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>

            <Button onClick={loadReport} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{report.summary.totalDonations}</p>
                    <p className="text-xs text-muted-foreground">Total Donations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{report.summary.mealsProvided}</p>
                    <p className="text-xs text-muted-foreground">Meals Provided</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Leaf className="h-8 w-8 text-emerald-600" />
                  <div>
                    <p className="text-2xl font-bold">{report.summary.foodWasteSaved.toFixed(1)}kg</p>
                    <p className="text-xs text-muted-foreground">Food Waste Saved</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{report.summary.carbonFootprintSaved.toFixed(1)}kg</p>
                    <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="trends" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Donation Volume Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Donation Volume Over Time</CardTitle>
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

                {/* User Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={report.trends.userActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="donors" stroke="#8884d8" name="Donors" />
                        <Line type="monotone" dataKey="recipients" stroke="#82ca9d" name="Recipients" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* By Category */}
                <Card>
                  <CardHeader>
                    <CardTitle>Donations by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(report.breakdown.byCategory).map(([name, data]) => ({
                            name,
                            value: data.count
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(report.breakdown.byCategory).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* By Time of Day */}
                <Card>
                  <CardHeader>
                    <CardTitle>Donations by Time of Day</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(report.breakdown.byTimeOfDay).map(([time, count]) => ({
                        time,
                        count
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              {/* Top Donors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Top Performing Donors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topDonors.slice(0, 5).map((donor, index) => (
                      <div key={donor.donorId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{donor.donorName}</p>
                            <p className="text-sm text-muted-foreground">
                              {donor.totalDonations} donations • {donor.totalQuantity} items
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{donor.impactScore} meals</p>
                          <p className="text-xs text-muted-foreground">Impact Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
