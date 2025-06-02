'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Filter, 
  MapPin, 
  Clock, 
  Package, 
  X,
  Search,
  Route,
  Target
} from 'lucide-react';
import { MapFilter } from '@/lib/map-service';

interface MapFiltersProps {
  filters: MapFilter;
  onFiltersChange: (filters: MapFilter) => void;
  donationCategories: string[];
  className?: string;
}

export const MapFilters: React.FC<MapFiltersProps> = ({
  filters,
  onFiltersChange,
  donationCategories,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempFilters, setTempFilters] = useState<MapFilter>(filters);

  const handleDistanceChange = (value: number[]) => {
    setTempFilters(prev => ({
      ...prev,
      maxDistance: value[0]
    }));
  };

  const handleCategoryChange = (category: string) => {
    setTempFilters(prev => ({
      ...prev,
      category: category === 'all' ? undefined : category
    }));
  };

  const handleStatusChange = (status: string) => {
    setTempFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : status
    }));
  };

  const handleExpiryChange = (value: number[]) => {
    setTempFilters(prev => ({
      ...prev,
      expiryWithin: value[0]
    }));
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
    setIsExpanded(false);
  };

  const clearFilters = () => {
    const clearedFilters: MapFilter = {};
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.maxDistance) count++;
    if (filters.category) count++;
    if (filters.status) count++;
    if (filters.expiryWithin) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Map Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Distance Filter */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Max Distance: {tempFilters.maxDistance || 10} km</span>
          </Label>
          <Slider
            value={[tempFilters.maxDistance || 10]}
            onValueChange={handleDistanceChange}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 km</span>
            <span>50 km</span>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="space-y-2">
            <Label>Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filters.maxDistance && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>≤ {filters.maxDistance} km</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onFiltersChange({ ...filters, maxDistance: undefined })}
                  />
                </Badge>
              )}
              {filters.category && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Package className="h-3 w-3" />
                  <span>{filters.category}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onFiltersChange({ ...filters, category: undefined })}
                  />
                </Badge>
              )}
              {filters.status && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <span>{filters.status}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onFiltersChange({ ...filters, status: undefined })}
                  />
                </Badge>
              )}
              {filters.expiryWithin && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>≤ {filters.expiryWithin}h</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onFiltersChange({ ...filters, expiryWithin: undefined })}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Expanded Filters */}
        {isExpanded && (
          <>
            <Separator />
            
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Category</span>
                </Label>
                <Select
                  value={tempFilters.category || 'all'}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {donationCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={tempFilters.status || 'all'}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expiry Filter */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Expires Within: {tempFilters.expiryWithin || 24} hours</span>
                </Label>
                <Slider
                  value={[tempFilters.expiryWithin || 24]}
                  onValueChange={handleExpiryChange}
                  max={168} // 7 days
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 hour</span>
                  <span>7 days</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button onClick={applyFilters} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Quick Apply for Distance */}
        {!isExpanded && (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onFiltersChange({ ...filters, maxDistance: tempFilters.maxDistance })}
              className="flex-1"
            >
              Apply Distance Filter
            </Button>
            {activeFilterCount > 0 && (
              <Button size="sm" variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
