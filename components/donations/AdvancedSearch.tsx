'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  MapPin,
  Package,
  Clock,
  Hash,
  TrendingUp,
  RefreshCw,
  Target,
  Tag
} from 'lucide-react';
import { useLocationContext } from '@/contexts/location-context';
import { advancedSearchDonations, AdvancedSearchFilters } from '@/lib/donation-service';
import { Donation, DonationStatus } from '@/lib/types';
import { toast } from 'sonner';

interface AdvancedSearchProps {
  onResults: (donations: Donation[]) => void;
  onFiltersChange?: (filters: AdvancedSearchFilters) => void;
  className?: string;
}

const DONATION_CATEGORIES = [
  'Fresh Produce',
  'Prepared Meals',
  'Packaged Foods',
  'Dairy Products',
  'Baked Goods',
  'Beverages',
  'Meat & Seafood',
  'Grains & Pasta',
  'Canned Goods',
  'Snacks',
  'Baby Food',
  'Other'
];

const DONATION_STATUSES = [
  { value: DonationStatus.ACTIVE, label: 'Active' },
  { value: DonationStatus.RESERVED, label: 'Reserved' },
  { value: DonationStatus.COMPLETED, label: 'Completed' },
  { value: DonationStatus.CANCELLED, label: 'Cancelled' }
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'expiryDate', label: 'Expiry Date' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'distance', label: 'Distance' },
  { value: 'urgency', label: 'Urgency' }
];

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onResults,
  onFiltersChange,
  className = ''
}) => {
  const { location } = useLocationContext();
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    query: '',
    categories: [],
    status: [DonationStatus.ACTIVE],
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 50,
    includeExpired: false
  });

  // Update location in filters when user location changes
  useEffect(() => {
    if (location) {
      setFilters(prev => ({
        ...prev,
        location: {
          latitude: location.lat,
          longitude: location.lng,
          radius: prev.location?.radius || 10
        }
      }));
    }
  }, [location]);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const results = await advancedSearchDonations(filters);
      onResults(results);
      if (onFiltersChange) {
        onFiltersChange(filters);
      }
      toast.success(`Found ${results.length} donations`);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [filters, onResults, onFiltersChange]);

  const updateFilter = <K extends keyof AdvancedSearchFilters>(
    key: K,
    value: AdvancedSearchFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCategoryToggle = (category: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    updateFilter('categories', newCategories);
  };

  const handleStatusToggle = (status: DonationStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    updateFilter('status', newStatuses);
  };

  const resetFilters = () => {
    setFilters({
      query: '',
      categories: [],
      status: [DonationStatus.ACTIVE],
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 50,
      includeExpired: false,
      location: location ? {
        latitude: location.lat,
        longitude: location.lng,
        radius: 10
      } : undefined
    });
  };

  const activeFilterCount = [
    filters.query && filters.query.trim(),
    filters.categories && filters.categories.length > 0,
    filters.status && filters.status.length !== 1,
    filters.dateRange,
    filters.expiryRange,
    filters.quantityRange,
    filters.location && filters.location.radius !== 10,
    filters.includeExpired,
    filters.tags && filters.tags.length > 0
  ].filter(Boolean).length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Advanced Search</span>
            {activeFilterCount > 0 && (
              <Badge variant="outline">{activeFilterCount} filters</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Query */}
        <div className="space-y-2">
          <Label>Search Query</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search donations, descriptions, donors..."
              value={filters.query || ''}
              onChange={(e) => updateFilter('query', e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="flex-1 flex items-center space-x-2"
          >
            {isSearching ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span>{isSearching ? 'Searching...' : 'Search'}</span>
          </Button>
          <Button variant="outline" onClick={resetFilters}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <>
            <Separator />

            {/* Categories */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Categories</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {DONATION_CATEGORIES.map(category => {
                  const isSelected = filters.categories?.includes(category);
                  return (
                    <Badge
                      key={category}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleCategoryToggle(category)}
                    >
                      {category}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {DONATION_STATUSES.map(status => {
                  const isSelected = filters.status?.includes(status.value);
                  return (
                    <Badge
                      key={status.value}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleStatusToggle(status.value)}
                    >
                      {status.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Location Filter */}
            {location && (
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Distance: {filters.location?.radius || 10} km</span>
                </Label>
                <Slider
                  value={[filters.location?.radius || 10]}
                  onValueChange={(value) => updateFilter('location', {
                    latitude: location.lat,
                    longitude: location.lng,
                    radius: value[0]
                  })}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 km</span>
                  <span>100 km</span>
                </div>
              </div>
            )}

            {/* Quantity Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <span>Min Quantity</span>
                </Label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={filters.quantityRange?.min || ''}
                  onChange={(e) => updateFilter('quantityRange', {
                    ...filters.quantityRange,
                    min: parseInt(e.target.value) || undefined
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Quantity</Label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={filters.quantityRange?.max || ''}
                  onChange={(e) => updateFilter('quantityRange', {
                    ...filters.quantityRange,
                    max: parseInt(e.target.value) || undefined
                  })}
                />
              </div>
            </div>

            {/* Date Ranges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created After</span>
                </Label>
                <DatePicker
                  date={filters.dateRange?.start}
                  onDateChange={(date) => updateFilter('dateRange', {
                    ...filters.dateRange,
                    start: date
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Created Before</Label>
                <DatePicker
                  date={filters.dateRange?.end}
                  onDateChange={(date) => updateFilter('dateRange', {
                    ...filters.dateRange,
                    end: date
                  })}
                />
              </div>
            </div>

            {/* Sorting */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Sort By</span>
                </Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilter('sortBy', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-expired">Include Expired Donations</Label>
                <Switch
                  id="include-expired"
                  checked={filters.includeExpired}
                  onCheckedChange={(checked) => updateFilter('includeExpired', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Results Limit</Label>
                <Select
                  value={filters.limit?.toString()}
                  onValueChange={(value) => updateFilter('limit', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                    <SelectItem value="100">100 results</SelectItem>
                    <SelectItem value="200">200 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
