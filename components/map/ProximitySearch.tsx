'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  MapPin, 
  Clock, 
  Package, 
  Filter,
  Target,
  RefreshCw,
  TrendingUp,
  Calendar,
  Hash
} from 'lucide-react';
import { useLocationContext } from '@/contexts/location-context';
import { 
  getProximitySearchResults, 
  ProximitySearchOptions,
  LocationCoordinates
} from '@/lib/map-service';
import { Donation } from '@/lib/types';
import { toast } from 'sonner';

interface ProximitySearchProps {
  donations: Donation[];
  onResultsChange: (results: Donation[]) => void;
  className?: string;
}

const DONATION_CATEGORIES = [
  'Fresh Produce',
  'Prepared Meals',
  'Packaged Foods',
  'Dairy Products',
  'Baked Goods',
  'Beverages',
  'Other'
];

export const ProximitySearch: React.FC<ProximitySearchProps> = ({
  donations,
  onResultsChange,
  className = ''
}) => {
  const { location, getUserLocation, isLoading } = useLocationContext();
  const [searchOptions, setSearchOptions] = useState<ProximitySearchOptions>({
    maxDistance: 10,
    sortBy: 'distance',
    includeExpired: false,
    maxResults: 50
  });
  const [searchResults, setSearchResults] = useState<Donation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Perform search when options or location change
  useEffect(() => {
    if (location) {
      performSearch();
    }
  }, [location, searchOptions, donations]);

  const performSearch = async () => {
    if (!location) {
      toast.error('Location required for proximity search');
      return;
    }

    setIsSearching(true);
    try {
      const results = getProximitySearchResults(donations, location, searchOptions);
      setSearchResults(results);
      onResultsChange(results);
      
      toast.success(`Found ${results.length} donations within ${searchOptions.maxDistance}km`);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDistanceChange = (value: number[]) => {
    setSearchOptions(prev => ({
      ...prev,
      maxDistance: value[0]
    }));
  };

  const handleSortByChange = (sortBy: string) => {
    setSearchOptions(prev => ({
      ...prev,
      sortBy: sortBy as ProximitySearchOptions['sortBy']
    }));
  };

  const handleCategoryChange = (categories: string[]) => {
    setSearchOptions(prev => ({
      ...prev,
      categories: categories.length > 0 ? categories : undefined
    }));
  };

  const handleMinQuantityChange = (value: string) => {
    const minQuantity = parseInt(value) || undefined;
    setSearchOptions(prev => ({
      ...prev,
      minQuantity
    }));
  };

  const handleMaxResultsChange = (value: string) => {
    const maxResults = parseInt(value) || 50;
    setSearchOptions(prev => ({
      ...prev,
      maxResults
    }));
  };

  const handleIncludeExpiredChange = (checked: boolean) => {
    setSearchOptions(prev => ({
      ...prev,
      includeExpired: checked
    }));
  };

  const handleGetLocation = async () => {
    try {
      await getUserLocation();
      toast.success('Location updated');
    } catch (error) {
      toast.error('Failed to get location');
    }
  };

  const resetFilters = () => {
    setSearchOptions({
      maxDistance: 10,
      sortBy: 'distance',
      includeExpired: false,
      maxResults: 50
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Proximity Search</span>
          {searchResults.length > 0 && (
            <Badge variant="outline">{searchResults.length} results</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              {location ? 'Location set' : 'Location required'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGetLocation}
            disabled={isLoading}
            className="flex items-center space-x-1"
          >
            <Target className="h-4 w-4" />
            <span>{isLoading ? 'Getting...' : 'Get Location'}</span>
          </Button>
        </div>

        <Separator />

        {/* Search Distance */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Search Radius: {searchOptions.maxDistance} km</span>
          </Label>
          <Slider
            value={[searchOptions.maxDistance]}
            onValueChange={handleDistanceChange}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 km</span>
            <span>50 km</span>
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Sort By</span>
          </Label>
          <Select value={searchOptions.sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Distance (Nearest First)</SelectItem>
              <SelectItem value="urgency">Urgency (Most Urgent First)</SelectItem>
              <SelectItem value="quantity">Quantity (Largest First)</SelectItem>
              <SelectItem value="expiry">Expiry Date (Soonest First)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Categories</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {DONATION_CATEGORIES.map(category => {
              const isSelected = searchOptions.categories?.includes(category);
              return (
                <Badge
                  key={category}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const currentCategories = searchOptions.categories || [];
                    const newCategories = isSelected
                      ? currentCategories.filter(c => c !== category)
                      : [...currentCategories, category];
                    handleCategoryChange(newCategories);
                  }}
                >
                  {category}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Hash className="h-4 w-4" />
              <span>Min Quantity</span>
            </Label>
            <Input
              type="number"
              placeholder="Any quantity"
              value={searchOptions.minQuantity || ''}
              onChange={(e) => handleMinQuantityChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Max Results</span>
            </Label>
            <Input
              type="number"
              placeholder="50"
              value={searchOptions.maxResults || 50}
              onChange={(e) => handleMaxResultsChange(e.target.value)}
            />
          </div>
        </div>

        {/* Include Expired Toggle */}
        <div className="flex items-center justify-between">
          <Label className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Include Expired Donations</span>
          </Label>
          <Switch
            checked={searchOptions.includeExpired}
            onCheckedChange={handleIncludeExpiredChange}
          />
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={performSearch}
            disabled={!location || isSearching}
            className="flex-1 flex items-center space-x-2"
          >
            {isSearching ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span>{isSearching ? 'Searching...' : 'Search'}</span>
          </Button>

          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>

        {/* Search Summary */}
        {searchResults.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-sm space-y-1">
                <p><strong>{searchResults.length}</strong> donations found</p>
                <p>Within <strong>{searchOptions.maxDistance} km</strong> of your location</p>
                <p>Sorted by <strong>{searchOptions.sortBy}</strong></p>
                {searchOptions.categories && searchOptions.categories.length > 0 && (
                  <p>Categories: <strong>{searchOptions.categories.join(', ')}</strong></p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
