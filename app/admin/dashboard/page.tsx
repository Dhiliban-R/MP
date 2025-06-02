'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, BarChart, PieChart } from '@/components/ui/chart';
import { StatsCard } from '@/components/ui/stats-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { AnalyticsData, DonationStatus } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { Users, Package, Building, FileSpreadsheet, CalendarClock, ShoppingBag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function AdminDashboardPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch total donations
        const donationsSnapshot = await getDocs(collection(db, 'donations'));
        const totalDonations = donationsSnapshot.size;

        // Fetch active donations
        const activeDonationsSnapshot = await getDocs(query(collection(db, 'donations'), where('status', '==', 'active')));
        const activeDonations = activeDonationsSnapshot.size;

        // Fetch completed donations
        const completedDonationsSnapshot = await getDocs(query(collection(db, 'donations'), where('status', '==', 'completed')));
        const completedDonations = completedDonationsSnapshot.size;

        // Fetch total recipients (users with role 'recipient')
        const recipientsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'recipient')));
        const totalRecipients = recipientsSnapshot.size;

        // Fetch total donors (users with role 'donor')
        const donorsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'donor')));
        const totalDonors = donorsSnapshot.size;

        // Fetch donations by category (requires aggregation, simplified for now)
        // A more robust solution would involve cloud functions or pre-aggregated data
        const donationsByCategory: { [key: string]: number } = {};
        donationsSnapshot.docs.forEach(doc => {
          const category = doc.data().category || 'Other';
          donationsByCategory[category] = (donationsByCategory[category] || 0) + 1;
        });

        // Fetch donation trend (requires aggregation, simplified for now)
        // A more robust solution would involve cloud functions or pre-aggregated data
        const donationTrend: { date: string; count: number }[] = [];
        // Example: Group by month
        const monthlyCounts: { [key: string]: number } = {};
        donationsSnapshot.docs.forEach(doc => {
          const createdAt = doc.data().createdAt?.toDate();
          if (createdAt) {
            const monthYear = `${createdAt.getFullYear()}-${(createdAt.getMonth() + 1).toString().padStart(2, '0')}`;
            monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
          }
        });
        Object.keys(monthlyCounts).sort().forEach(monthYear => {
          donationTrend.push({ date: monthYear, count: monthlyCounts[monthYear] });
        });

        // Impact metrics (mocked for now, requires more complex logic)
        const impactMetrics = {
          mealsProvided: 0, // Needs calculation based on quantity/type
          foodWasteSaved: 0, // Needs calculation
          carbonFootprint: 0 // Needs calculation
        };

        setAnalyticsData({
          totalDonations,
          activeDonations,
          completedDonations,
          totalRecipients,
          totalDonors,
          donationsByCategory,
          donationTrend,
          impactMetrics,
        });

        // Fetch recent donations (last 5)
        const recentDonationsQuery = query(
          collection(db, 'donations'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentDonationsSnapshot = await getDocs(recentDonationsQuery);
        const fetchedRecentDonations = recentDonationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          expiryDate: doc.data().expiryDate?.toDate() || new Date(),
          completedAt: doc.data().completedAt?.toDate() || null,
          reservedAt: doc.data().reservedAt?.toDate() || null,
        }));
        setRecentDonations(fetchedRecentDonations);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading dashboard data...</div>;
  }

  // Data for charts
  const donationTrendData = analyticsData?.donationTrend.map((item) => ({
    name: item.date,
    value: item.count
  })) || [];

  const donationCategoryData = analyticsData ? 
    Object.entries(analyticsData.donationsByCategory).map(([name, value]) => ({
      name,
      value
    })) : [];

  const donationStatusData = [
    { name: 'Active', value: analyticsData?.activeDonations || 0 },
    { name: 'Completed', value: analyticsData?.completedDonations || 0 },
    { name: 'Other', value: (analyticsData?.totalDonations || 0) - 
      ((analyticsData?.activeDonations || 0) + (analyticsData?.completedDonations || 0)) }
  ];

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-heading font-bold">Admin Dashboard</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export Reports
            </Button>
          </div>
        </div>
         <Input
            placeholder="Search recent donations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Donations"
            value={analyticsData?.totalDonations.toString() || '0'}
            description="All time donations"
            icon={<Package className="h-5 w-5 text-primary" />}
            trend="+12%"
          />
          <StatsCard
            title="Active Donors"
            value={analyticsData?.totalDonors.toString() || '0'}
            description="Currently registered"
            icon={<Users className="h-5 w-5 text-secondary" />}
            trend="+5%"
          />
          <StatsCard
            title="Recipient Organizations"
            value={analyticsData?.totalRecipients.toString() || '0'}
            description="Currently registered"
            icon={<Building className="h-5 w-5 text-accent-orange" />}
            trend="+8%"
          />
          <StatsCard
            title="Meals Provided"
            value={analyticsData?.impactMetrics.mealsProvided.toString() || '0'}
            description="Estimated impact"
            icon={<ShoppingBag className="h-5 w-5 text-accent-teal" />}
            trend="+15%"
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Donation Trends</CardTitle>
              <CardDescription>Monthly donation volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              <AreaChart
                data={donationTrendData}
                xField="name"
                yField="value"
                height={300}
                colors={['hsl(var(--chart-1))']}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Donation Categories</CardTitle>
              <CardDescription>Distribution by food type</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart
                data={donationCategoryData}
                nameKey="name"
                dataKey="value"
                height={300}
                colors={[
                  'hsl(var(--chart-1))',
                  'hsl(var(--chart-2))',
                  'hsl(var(--chart-3))',
                  'hsl(var(--chart-4))',
                  'hsl(var(--chart-5))',
                  'hsl(var(--muted-foreground))'
                ]}
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
            <CardDescription>Latest donation activity across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b">
                <div className="col-span-2">Donation</div>
                <div>Donor</div>
                <div>Status</div>
                <div>Quantity</div>
                <div>Date</div>
              </div>
              <div className="divide-y">
                {recentDonations
                  .filter(donation =>
                    donation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    donation.donorName.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((donation) => (
                    <div key={donation.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                    <div className="col-span-2 font-medium">{donation.title}</div>
                    <div>{donation.donorName}</div>
                    <div>
                      <StatusBadge status={donation.status} />
                    </div>
                    <div>
                      {donation.quantity} {donation.quantityUnit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {donation.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <Button variant="outline" asChild>
                <a href="/admin/donations">View All Donations</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Impact Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Impact</CardTitle>
            <CardDescription>Measuring our collective difference</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="text-4xl font-bold text-primary">
                  {analyticsData?.impactMetrics.mealsProvided.toLocaleString()}
                </div>
                <div className="mt-2 text-sm font-medium">Meals Provided</div>
                <div className="mt-1 text-xs text-muted-foreground">Estimated from donated food</div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="text-4xl font-bold text-secondary">
                  {analyticsData?.impactMetrics.foodWasteSaved.toLocaleString()} kg
                </div>
                <div className="mt-2 text-sm font-medium">Food Waste Prevented</div>
                <div className="mt-1 text-xs text-muted-foreground">Total weight diverted from landfill</div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="text-4xl font-bold text-accent-teal">
                  {analyticsData?.impactMetrics.carbonFootprint.toLocaleString()} kg
                </div>
                <div className="mt-2 text-sm font-medium">CO₂ Emissions Saved</div>
                <div className="mt-1 text-xs text-muted-foreground">Equivalent carbon reduction</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
