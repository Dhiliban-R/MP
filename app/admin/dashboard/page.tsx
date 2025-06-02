'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, BarChart, PieChart } from '@/components/ui/chart';
import { StatsCard } from '@/components/ui/stats-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { AnalyticsData, DonationStatus } from '@/lib/types'; // AnalyticsData might need adjustment
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore'; // Added doc, getDoc
import { Users, Package, Building, FileSpreadsheet, CalendarClock, ShoppingBag, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { toast as sonnerToast } from 'sonner'; // Using sonner directly for consistency
import { Input } from '@/components/ui/input';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function AdminDashboardPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Aggregated Analytics from 'analytics/summary'
        const analyticsDocRef = doc(db, 'analytics', 'summary');
        const analyticsDocSnap = await getDoc(analyticsDocRef);

        if (analyticsDocSnap.exists()) {
          const summaryData = analyticsDocSnap.data();
          setAnalyticsData({
            totalDonations: summaryData.totalDonations || 0,
            activeDonations: summaryData.activeDonations || 0,
            completedDonations: summaryData.completedDonations || 0,
            totalRecipients: summaryData.totalRecipients || 0,
            totalDonors: summaryData.totalDonors || 0,
            donationsByCategory: summaryData.donationsByCategory || {},
            // Firestore stores donationTrend as an object, e.g., {"Jan 2024": 5, "Feb 2024": 10}
            // This will be transformed later for the chart
            donationTrend: summaryData.donationTrend || {},
            impactMetrics: summaryData.impactMetrics || { mealsProvided: 0, foodWasteSaved: 0, carbonFootprint: 0 },
          });
        } else {
          console.warn("Analytics summary document not found!");
          sonnerToast.warning('Analytics summary not found. Some data may be incomplete.');
          // Set to default/empty state if summary doc doesn't exist
          setAnalyticsData({
            totalDonations: 0,
            activeDonations: 0,
            completedDonations: 0,
            totalRecipients: 0,
            totalDonors: 0,
            donationsByCategory: {},
            donationTrend: {},
            impactMetrics: { mealsProvided: 0, foodWasteSaved: 0, carbonFootprint: 0 },
          });
        }

        // Fetch recent donations (last 5) - this remains a direct query
        const recentDonationsQuery = query(
          collection(db, 'donations'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentDonationsSnapshot = await getDocs(recentDonationsQuery);
        const fetchedRecentDonations = recentDonationsSnapshot.docs.map(docSnap => { // Renamed doc to docSnap
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            expiryDate: data.expiryDate?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate() || null,
            reservedAt: data.reservedAt?.toDate() || null,
          } as any; // Cast to any or ensure Donation type matches
        });
        setRecentDonations(fetchedRecentDonations);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
        sonnerToast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading dashboard data...</div>;
  }

  if (error && !analyticsData) { // Show full page error if initial analytics load failed
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
        </div>
      </DashboardShell>
    );
  }

  // Data for charts
  // Transform donationTrend from object to array for the chart
  const trendDataFromAnalytics = analyticsData?.donationTrend || {};
  const donationTrendData = Object.entries(trendDataFromAnalytics)
    .map(([date, count]) => ({ name: date, value: count as number }))
    // Optional: Sort by date if needed, though Firestore map keys might not guarantee order
    // .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
    // Assuming the keys are "Mon YYYY" and need specific sort order, this might need custom sort.
    // For simplicity, using as-is for now.

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
