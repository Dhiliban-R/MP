'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Package,
  Star,
  History,
  Zap
} from 'lucide-react';
import { AdvancedSearchFilters } from '@/lib/donation-service';
import { DonationStatus } from '@/lib/types';

interface SearchSuggestionsProps {
  onSuggestionSelect: (filters: AdvancedSearchFilters) => void;
  userLocation?: { lat: number; lng: number };
  className?: string;
}

interface SearchSuggestion {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  filters: AdvancedSearchFilters;
  category: 'quick' | 'popular' | 'recent' | 'location';
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  onSuggestionSelect,
  userLocation,
  className = ''
}) => {
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fdms_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = useCallback((suggestion: SearchSuggestion) => {
    const updated = [
      suggestion,
      ...recentSearches.filter(s => s.id !== suggestion.id)
    ].slice(0, 5); // Keep only 5 recent searches

    setRecentSearches(updated);
    localStorage.setItem('fdms_recent_searches', JSON.stringify(updated));
  }, [recentSearches]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSuggestionSelect(suggestion.filters);
    saveRecentSearch(suggestion);
  };

  // Quick search suggestions
  const quickSuggestions: SearchSuggestion[] = [
    {
      id: 'urgent-expiring',
      title: 'Expiring Soon',
      description: 'Donations expiring in the next 24 hours',
      icon: Clock,
      category: 'quick',
      filters: {
        status: [DonationStatus.ACTIVE],
        expiryRange: {
          start: new Date(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        sortBy: 'expiryDate',
        sortOrder: 'asc',
        limit: 50
      }
    },
    {
      id: 'fresh-produce',
      title: 'Fresh Produce',
      description: 'Fresh fruits and vegetables',
      icon: Package,
      category: 'quick',
      filters: {
        categories: ['Fresh Produce'],
        status: [DonationStatus.ACTIVE],
        sortBy: 'expiryDate',
        sortOrder: 'asc',
        limit: 50
      }
    },
    {
      id: 'prepared-meals',
      title: 'Ready to Eat',
      description: 'Prepared meals and cooked food',
      icon: Package,
      category: 'quick',
      filters: {
        categories: ['Prepared Meals'],
        status: [DonationStatus.ACTIVE],
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 50
      }
    },
    {
      id: 'large-quantities',
      title: 'Large Quantities',
      description: 'Donations with 10+ servings',
      icon: TrendingUp,
      category: 'quick',
      filters: {
        quantityRange: { min: 10 },
        status: [DonationStatus.ACTIVE],
        sortBy: 'quantity',
        sortOrder: 'desc',
        limit: 50
      }
    }
  ];

  // Location-based suggestions
  const locationSuggestions: SearchSuggestion[] = userLocation ? [
    {
      id: 'nearby-1km',
      title: 'Very Close (1km)',
      description: 'Donations within 1km of your location',
      icon: MapPin,
      category: 'location',
      filters: {
        location: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radius: 1
        },
        status: [DonationStatus.ACTIVE],
        sortBy: 'distance',
        sortOrder: 'asc',
        limit: 50
      }
    },
    {
      id: 'nearby-5km',
      title: 'Nearby (5km)',
      description: 'Donations within 5km of your location',
      icon: MapPin,
      category: 'location',
      filters: {
        location: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radius: 5
        },
        status: [DonationStatus.ACTIVE],
        sortBy: 'distance',
        sortOrder: 'asc',
        limit: 50
      }
    },
    {
      id: 'urgent-nearby',
      title: 'Urgent & Nearby',
      description: 'Expiring donations within 10km',
      icon: Zap,
      category: 'location',
      filters: {
        location: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radius: 10
        },
        expiryRange: {
          start: new Date(),
          end: new Date(Date.now() + 48 * 60 * 60 * 1000)
        },
        status: [DonationStatus.ACTIVE],
        sortBy: 'urgency',
        sortOrder: 'desc',
        limit: 50
      }
    }
  ] : [];

  // Popular search suggestions (could be fetched from analytics)
  const popularSuggestions: SearchSuggestion[] = [
    {
      id: 'bakery-items',
      title: 'Bakery Items',
      description: 'Bread, pastries, and baked goods',
      icon: Star,
      category: 'popular',
      filters: {
        categories: ['Baked Goods'],
        status: [DonationStatus.ACTIVE],
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 50
      }
    },
    {
      id: 'dairy-products',
      title: 'Dairy Products',
      description: 'Milk, cheese, yogurt, and dairy',
      icon: Star,
      category: 'popular',
      filters: {
        categories: ['Dairy Products'],
        status: [DonationStatus.ACTIVE],
        sortBy: 'expiryDate',
        sortOrder: 'asc',
        limit: 50
      }
    },
    {
      id: 'canned-goods',
      title: 'Canned Goods',
      description: 'Non-perishable canned items',
      icon: Star,
      category: 'popular',
      filters: {
        categories: ['Canned Goods'],
        status: [DonationStatus.ACTIVE],
        sortBy: 'quantity',
        sortOrder: 'desc',
        limit: 50
      }
    }
  ];

  const SuggestionCard: React.FC<{ suggestion: SearchSuggestion }> = ({ suggestion }) => {
    const IconComponent = suggestion.icon;
    
    return (
      <Button
        variant="outline"
        className="h-auto p-4 flex flex-col items-start space-y-2 hover:bg-gray-50"
        onClick={() => handleSuggestionClick(suggestion)}
      >
        <div className="flex items-center space-x-2 w-full">
          <IconComponent className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-left">{suggestion.title}</span>
        </div>
        <p className="text-sm text-gray-600 text-left">{suggestion.description}</p>
      </Button>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Searches */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Quick Searches</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickSuggestions.map(suggestion => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location-based Searches */}
      {locationSuggestions.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Near You</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {locationSuggestions.map(suggestion => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Searches */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Popular Categories</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {popularSuggestions.map(suggestion => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <History className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold">Recent Searches</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentSearches.map(suggestion => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-blue-700">Search Tips</h3>
          </div>
          <div className="space-y-2 text-sm text-blue-600">
            <p>• Use multiple keywords to narrow down results</p>
            <p>• Filter by location to find donations near you</p>
            <p>• Sort by expiry date to find urgent donations</p>
            <p>• Check "Include Expired" to see all donations</p>
            <p>• Use quantity filters to find bulk donations</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
