'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  MapPin, 
  Clock, 
  Package as PackageIcon, 
  User,
  Calendar,
  TrendingUp,
  Grid,
  List,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Heart,
  Share2
} from 'lucide-react';
import { Donation, DonationStatus } from '@/lib/types';
import DonationCard from '@/components/DonationCard';
import { formatDistanceToNow } from 'date-fns';

// Define a type that extends Donation to include the optional distance property
interface SearchResultsProps {
  donations: Donation[];
  isLoading?: boolean;
  searchQuery?: string;
  totalResults?: number;
  onDonationSelect?: (donation: Donation) => void;
  onDonationReserve?: (donationId: string) => void;
  userLocation?: { lat: number; lng: number };
  className?: string;
}

// Define a type that extends Donation to include the optional distance property
interface DonationWithDistance extends Donation {
  distance?: number | null;
}
type ViewMode = 'grid' | 'list';
type SortOption = 'relevance' | 'distance' | 'expiry' | 'quantity' | 'created';

export const SearchResults: React.FC<SearchResultsProps> = ({
  donations,
  isLoading = false,
  searchQuery,
  totalResults,
  onDonationSelect,
  onDonationReserve,
  userLocation,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate distance for each donation if user location is available
  const donationsWithDistance = useMemo<DonationWithDistance[]>(() => {
    if (!userLocation) return donations;

    return donations.map(donation => {
      if (!donation.pickupAddress?.latitude || !donation.pickupAddress?.longitude) {
        return { ...donation, distance: null };
      }

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        donation.pickupAddress.latitude,
        donation.pickupAddress.longitude
      );

      return { ...donation, distance };
    });
  }, [donations, userLocation]);

  // Sort donations based on selected criteria
  const sortedDonations = useMemo<DonationWithDistance[]>(() => {
    const sorted = [...donationsWithDistance];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'distance':
          if (a.distance !== null && b.distance !== null) {
 comparison = (a.distance ?? 0) - (b.distance ?? 0);
          } else if (a.distance !== null) {
 comparison = -1; // a is closer
          } else if (b.distance !== null) {
            comparison = 1;
          }
          break;

        case 'expiry':
          const aExpiry = new Date(a.expiryDate).getTime();
          const bExpiry = new Date(b.expiryDate).getTime();
          comparison = aExpiry - bExpiry;
          break;

        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;

        case 'created':
          const aCreated = new Date(a.createdAt).getTime();
          const bCreated = new Date(b.createdAt).getTime();
          comparison = aCreated - bCreated;
          break;

        case 'relevance':
        default:
          // For relevance, prioritize active donations, then by creation date
          if (a.status !== b.status) {
            if (a.status === DonationStatus.ACTIVE) comparison = -1;
            else if (b.status === DonationStatus.ACTIVE) comparison = 1;
          } else {
            const aCreated = new Date(a.createdAt).getTime();
            const bCreated = new Date(b.createdAt).getTime();
            comparison = bCreated - aCreated; // Newer first for relevance
          }
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [donationsWithDistance, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const activeCount = donations.filter(d => d.status === DonationStatus.ACTIVE).length;
    const expiringCount = donations.filter(d => {
      const expiry = new Date(d.expiryDate);
      const now = new Date();
      const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24;
    }).length;
    const totalQuantity = donations.reduce((sum, d) => sum + d.quantity, 0);

    return { activeCount, expiringCount, totalQuantity };
  }, [donations]);

  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Search className="h-8 w-8 animate-pulse text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Searching donations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (donations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No donations found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No results for "${searchQuery}". Try adjusting your search criteria.`
                : 'No donations match your current filters.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-xl">
                <Search className="h-5 w-5" />
                <span>Search Results</span>
                <Badge variant="outline">{donations.length} found</Badge>
              </CardTitle>
              {searchQuery && (
                <p className="text-sm text-gray-600 mt-1">
                  Results for "{searchQuery}"
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort Controls */}
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="expiry">Expiry Date</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                  <SelectItem value="created">Date Created</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="flex items-center space-x-1"
              >
                {sortOrder === 'desc' ? (
                  <SortDesc className="h-4 w-4" />
                ) : (
                  <SortAsc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Statistics */}
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-1">
              <PackageIcon className="h-4 w-4 text-green-500" />
              <span>{stats.activeCount} active</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>{stats.expiringCount} expiring soon</span>
            </div>
            <div className="flex items-center space-x-1 font-medium">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span>{stats.totalQuantity} total servings</span>
            </div>
            {userLocation && (
              <div className="flex items-center space-x-1 text-muted-foreground">
                <MapPin className="h-4 w-4 text-purple-500" />
                <span>Sorted by {sortBy}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }>
        {sortedDonations.map((donation) => (
          <DonationCard
            key={donation.id}
            donation={donation}
            onSelect={onDonationSelect}
            onReserve={onDonationReserve}
            showDistance={userLocation && donation.distance !== null}
            distance={donation.distance}
            variant={viewMode === 'list' ? 'horizontal' : 'vertical'}
          />
        ))}
      </div>

      {/* Load More / Pagination could go here */}
      {totalResults && totalResults > donations.length && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Showing {donations.length} of {totalResults} results
            </p>
            <Button variant="outline">
              Load More Results
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

