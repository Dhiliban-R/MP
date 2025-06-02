'use client';


import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart } from '@/components/ui/chart';
import { StatsCard } from '@/components/ui/stats-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { DonationStatus, Donation } from '@/lib/types';
// import { db } from '@/lib/firebase'; // Direct db access no longer needed
// import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'; // Direct db access no longer needed
import { getDonationsByDonorId, getDonorStats } from '@/lib/donation-service'; // Import service functions
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner'; // For error notifications
import { Package, Clock, CheckCircle, AlertTriangle, Plus, User, Map, History, TrendingUp } from 'lucide-react'; // Added TrendingUp
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DonorDashboardPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    reserved: 0,
    completed: 0,
    expired: 0,
    cancelled: 0, // Added for completeness from getDonorStats
  });
  const [loading, setLoading] = useState(true);
  const [donationTrendData, setDonationTrendData] = useState<{ name: string; value: number }[]>([]);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchDonorData = async () => {
      if (!user?.uid) {
        setLoading(false);
        // Optionally, redirect or show message if user is not available
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch Stats and Trend
        const statsData = await getDonorStats(user.uid);
        setStats({
          total: statsData.total,
          active: statsData.active,
          reserved: statsData.reserved,
          completed: statsData.completed,
          expired: statsData.expired,
          cancelled: statsData.cancelled,
        });
        setDonationTrendData(
          statsData.donationTrend.map(item => ({ name: item.date, value: item.count }))
        );

        // Fetch Recent Donations (e.g., latest 5)
        // Assuming getDonationsByDonorId returns them sorted by createdAt desc
        const allDonations = await getDonationsByDonorId(user.uid);
        setDonations(allDonations.slice(0, 5)); // Displaying latest 5, or adjust as needed

      } catch (err) {
        console.error('Error fetching donor data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDonorData();
    } else {
      // Handle case where user is not yet available (e.g. still loading from useAuth)
      // For now, we just don't fetch if user is null, loading spinner will show.
      // If user is definitively null after auth loading, might redirect or show login prompt.
       if (!loading && !user) { // Check auth loading state from useAuth() if available
         router.push('/auth/login');
       }
    }
  }, [user, loading]); // `loading` from useAuth if it provides it, otherwise remove

  if (loading) { // This is the component's own loading state
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
          Welcome, {user?.displayName || 'Donor'}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          {user?.organizationName || 'Donor'} Dashboard - Manage your food donations and impact
        </p>
      </div>
        {/* Quick Actions Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300" asChild>
            <Link href="/donor/donations/new">
              <Plus className="h-4 w-4" />
              Create Donation
            </Link>
          </Button>
          <Button variant="outline" className="gap-2 shadow-md hover:shadow-lg transition-all duration-300" asChild>
            <Link href="/donor/donations/active">
              <Package className="h-4 w-4" />
              View Donations
            </Link>
          </Button>
          <Button variant="outline" className="gap-2 shadow-md hover:shadow-lg transition-all duration-300" asChild>
            <Link href="/donor/map">
              <Map className="h-4 w-4" />
              Map View
            </Link>
          </Button>
          <Button variant="outline" className="gap-2 shadow-md hover:shadow-lg transition-all duration-300" asChild>
            <Link href="/donor/profile">
              <User className="h-4 w-4" />
              Profile
            </Link>
          </Button>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden">
            <StatsCard
              title="Total Donations"
              value={stats.total.toString()}
              description="All time donations"
              icon={<Package className="h-6 w-6 text-primary" />}
              className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-all duration-300"
            />
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10"></div>
          </div>
          <div className="relative overflow-hidden">
            <StatsCard
              title="Active Donations"
              value={stats.active.toString()}
              description="Currently available"
              icon={<Clock className="h-6 w-6 text-blue-500" />}
              className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300"
            />
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -translate-y-10 translate-x-10"></div>
          </div>
          <div className="relative overflow-hidden">
            <StatsCard
              title="Completed"
              value={stats.completed.toString()}
              description="Successfully delivered"
              icon={<CheckCircle className="h-6 w-6 text-green-500" />}
              className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300"
            />
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -translate-y-10 translate-x-10"></div>
          </div>
          <div className="relative overflow-hidden">
            <StatsCard
              title="Expired"
              value={stats.expired.toString()}
              description="Past expiry date"
              icon={<AlertTriangle className="h-6 w-6 text-orange-500" />}
              className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300"
            />
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-full -translate-y-10 translate-x-10"></div>
          </div>
        </div>

        {/* Donation Activity Chart */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              Your Donation Activity
            </CardTitle>
            <CardDescription>Monthly donation trends and impact overview</CardDescription>
          </CardHeader>
          <CardContent>
              {donationTrendData.length > 0 ? (
                <AreaChart
                  data={donationTrendData}
                  xField="name"
                  yField="value"
                  height={250}
                  colors={['hsl(var(--chart-1))']}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[250px]">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No donation trend data yet.</p>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Recent Donations */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> {/* Changed Icon */}
              Your Recent Donations
            </CardTitle>
            <CardDescription>Track and manage your recent donations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {donations.map((donation) => (
                <Card key={donation.id} className="hover:shadow-md transition-all duration-300 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">{donation.title}</h3>
                          <StatusBadge status={donation.status} />
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{donation.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {donation.quantity} {donation.quantityUnit}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              Expires {donation.expiryDate.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {donation.reservedBy || 'No reservations'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 lg:flex-col lg:w-32">
                        <Button size="sm" variant="outline" className="flex-1 lg:w-full">
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 lg:w-full text-red-600 border-red-200 hover:bg-red-50">
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-center mt-6">
              <Button variant="outline" className="gap-2 shadow-md" asChild>
                <Link href="/donor/donations/active">
                  <Package className="h-4 w-4" />
                  View All Donations
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Quick Links */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create New Donation
              </CardTitle>
              <CardDescription>List available food items for donation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Add details about available food items, expiry dates, and pickup instructions.
              </p>
              <Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md" asChild>
                <Link href="/donor/donations/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Donation
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-blue-600" />
                View Map
              </CardTitle>
              <CardDescription>See donation locations and recipients</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View a map of your donations and nearby recipient organizations.
              </p>
              <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 shadow-md" asChild>
                <Link href="/donor/map">
                  <Map className="h-4 w-4 mr-2" />
                  Open Map View
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-green-600" />
                Donation History
              </CardTitle>
              <CardDescription>Review your past donations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access details and reports on all your previous donations.
              </p>
              <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50 shadow-md" asChild>
                <Link href="/donor/donations/history">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
