'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users, 
  Package, 
  Clock,
  Target,
  Zap,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { subscribeToAvailableDonations } from '@/lib/donation-service';
import { Donation, DonationStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface RealTimeMetricsProps {
  className?: string;
}

interface MetricChange {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface RealTimeData {
  activeDonations: MetricChange;
  totalUsers: MetricChange;
  avgResponseTime: MetricChange;
  completionRate: MetricChange;
  urgentDonations: number;
  recentActivity: Array<{
    id: string;
    type: 'donation_created' | 'donation_reserved' | 'donation_completed';
    message: string;
    timestamp: Date;
  }>;
}

export const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  className = ''
}) => {
  const [data, setData] = useState<RealTimeData>({
    activeDonations: { value: 0, change: 0, trend: 'stable' },
    totalUsers: { value: 0, change: 0, trend: 'stable' },
    avgResponseTime: { value: 0, change: 0, trend: 'stable' },
    completionRate: { value: 0, change: 0, trend: 'stable' },
    urgentDonations: 0,
    recentActivity: []
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);

  // Calculate metrics from donations
  const calculateMetrics = useCallback((donations: Donation[]) => {
    const activeDonations = donations.filter(d => d.status === DonationStatus.ACTIVE);
    const completedDonations = donations.filter(d => d.status === DonationStatus.COMPLETED);
    const reservedDonations = donations.filter(d => d.status === DonationStatus.RESERVED);

    // Calculate urgent donations (expiring within 24 hours)
    const now = new Date();
    const urgentDonations = activeDonations.filter(d => {
      if (!d.expiryDate) return false;
      const expiry = new Date(d.expiryDate);
      const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24;
    }).length;

    // Calculate average response time
    const responseTimes = reservedDonations
      .filter(d => d.reservedAt && d.createdAt)
      .map(d => {
        const created = new Date(d.createdAt).getTime();
        const reserved = new Date(d.reservedAt!).getTime();
        return (reserved - created) / (1000 * 60 * 60); // hours
      });

    const avgResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;

    // Calculate completion rate
    const totalProcessed = completedDonations.length + reservedDonations.length;
    const completionRate = totalProcessed > 0 ? 
      (completedDonations.length / totalProcessed) * 100 : 0;

    // Get unique users
    const uniqueDonors = new Set(donations.map(d => d.donorId)).size;
    const uniqueRecipients = new Set(donations.filter(d => d.reservedBy).map(d => d.reservedBy)).size;
    const totalUsers = uniqueDonors + uniqueRecipients;

    return {
      activeDonations: activeDonations.length,
      totalUsers,
      avgResponseTime,
      completionRate,
      urgentDonations
    };
  }, []);

  // Update metrics with trend calculation
  const updateMetrics = useCallback((newDonations: Donation[]) => {
    const newMetrics = calculateMetrics(newDonations);
    
    setData(prevData => {
      // Calculate trends
      const activeTrend = newMetrics.activeDonations > prevData.activeDonations.value ? 'up' : 
                         newMetrics.activeDonations < prevData.activeDonations.value ? 'down' : 'stable';
      
      const usersTrend = newMetrics.totalUsers > prevData.totalUsers.value ? 'up' : 
                        newMetrics.totalUsers < prevData.totalUsers.value ? 'down' : 'stable';
      
      const responseTrend = newMetrics.avgResponseTime < prevData.avgResponseTime.value ? 'up' : 
                           newMetrics.avgResponseTime > prevData.avgResponseTime.value ? 'down' : 'stable';
      
      const completionTrend = newMetrics.completionRate > prevData.completionRate.value ? 'up' : 
                             newMetrics.completionRate < prevData.completionRate.value ? 'down' : 'stable';

      return {
        activeDonations: {
          value: newMetrics.activeDonations,
          change: newMetrics.activeDonations - prevData.activeDonations.value,
          trend: activeTrend
        },
        totalUsers: {
          value: newMetrics.totalUsers,
          change: newMetrics.totalUsers - prevData.totalUsers.value,
          trend: usersTrend
        },
        avgResponseTime: {
          value: newMetrics.avgResponseTime,
          change: newMetrics.avgResponseTime - prevData.avgResponseTime.value,
          trend: responseTrend
        },
        completionRate: {
          value: newMetrics.completionRate,
          change: newMetrics.completionRate - prevData.completionRate.value,
          trend: completionTrend
        },
        urgentDonations: newMetrics.urgentDonations,
        recentActivity: prevData.recentActivity // This would be updated from real-time events
      };
    });

    setLastUpdate(new Date());
  }, [calculateMetrics]);

  // Subscribe to real-time updates
  useEffect(() => {
    setIsConnected(true);
    
    const unsubscribe = subscribeToAvailableDonations((newDonations) => {
      setDonations(newDonations);
      updateMetrics(newDonations);
    });

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [updateMetrics]);

  // Simulate recent activity updates
  useEffect(() => {
    const interval = setInterval(() => {
      // This would normally come from real-time events
      const activities = [
        'New donation: Fresh vegetables posted',
        'Donation reserved: Prepared meals',
        'Donation completed: Bakery items',
        'New user registered as donor',
        'Urgent donation: Expires in 2 hours'
      ];

      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      
      setData(prev => ({
        ...prev,
        recentActivity: [
          {
            id: Date.now().toString(),
            type: 'donation_created',
            message: randomActivity,
            timestamp: new Date()
          },
          ...prev.recentActivity.slice(0, 4)
        ]
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Real-Time Metrics</span>
              <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center space-x-1">
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                <span>{isConnected ? 'Live' : 'Disconnected'}</span>
              </Badge>
            </div>
            
            {lastUpdate && (
              <p className="text-xs text-gray-500">
                Updated {formatDistanceToNow(lastUpdate)} ago
              </p>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Real-Time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Donations */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Donations</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{data.activeDonations.value}</p>
                  {getTrendIcon(data.activeDonations.trend)}
                </div>
                <p className={`text-xs ${getTrendColor(data.activeDonations.trend)}`}>
                  {data.activeDonations.change > 0 ? '+' : ''}{data.activeDonations.change} from last update
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{data.totalUsers.value}</p>
                  {getTrendIcon(data.totalUsers.trend)}
                </div>
                <p className={`text-xs ${getTrendColor(data.totalUsers.trend)}`}>
                  {data.totalUsers.change > 0 ? '+' : ''}{data.totalUsers.change} from last update
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Average Response Time */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{data.avgResponseTime.value.toFixed(1)}h</p>
                  {getTrendIcon(data.avgResponseTime.trend)}
                </div>
                <p className={`text-xs ${getTrendColor(data.avgResponseTime.trend)}`}>
                  {data.avgResponseTime.change > 0 ? '+' : ''}{data.avgResponseTime.change.toFixed(1)}h change
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">{data.completionRate.value.toFixed(1)}%</p>
                  {getTrendIcon(data.completionRate.trend)}
                </div>
                <p className={`text-xs ${getTrendColor(data.completionRate.trend)}`}>
                  {data.completionRate.change > 0 ? '+' : ''}{data.completionRate.change.toFixed(1)}% change
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Donations Alert */}
      {data.urgentDonations > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Zap className="h-6 w-6 text-orange-500" />
              <div>
                <p className="font-semibold text-orange-800">Urgent Donations</p>
                <p className="text-sm text-orange-700">
                  {data.urgentDonations} donations expiring within 24 hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(activity.timestamp)} ago
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
