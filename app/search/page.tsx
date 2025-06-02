'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  MapPin, 
  Lightbulb,
  History,
  TrendingUp
} from 'lucide-react';
import { useLocationContext } from '@/contexts/location-context';
import { AdvancedSearch } from '@/components/donations/AdvancedSearch';
import { SearchSuggestions } from '@/components/donations/SearchSuggestions';
import { SearchResults } from '@/components/donations/SearchResults';
import { advancedSearchDonations, AdvancedSearchFilters } from '@/lib/donation-service';
import { Donation } from '@/lib/types';
import { toast } from 'sonner';

export default function SearchPage() {
  const { location, getUserLocation } = useLocationContext();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<AdvancedSearchFilters | null>(null);
  const [searchHistory, setSearchHistory] = useState<AdvancedSearchFilters[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'suggestions' | 'results'>('suggestions');

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fdms_search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }, []);

  // Save search to history
  const saveToHistory = (filters: AdvancedSearchFilters) => {
    const updated = [
      filters,
      ...searchHistory.filter(h => JSON.stringify(h) !== JSON.stringify(filters))
    ].slice(0, 10); // Keep only 10 recent searches

    setSearchHistory(updated);
    localStorage.setItem('fdms_search_history', JSON.stringify(updated));
  };

  // Handle search execution
  const handleSearch = async (filters: AdvancedSearchFilters) => {
    setIsLoading(true);
    setCurrentFilters(filters);
    
    try {
      const results = await advancedSearchDonations(filters);
      setDonations(results);
      saveToHistory(filters);
      setActiveTab('results');
      
      toast.success(`Found ${results.length} donations`);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (filters: AdvancedSearchFilters) => {
    handleSearch(filters);
  };

  // Handle donation selection
  const handleDonationSelect = (donation: Donation) => {
    // Navigate to donation details or open modal
    console.log('Selected donation:', donation);
  };

  // Handle donation reservation
  const handleDonationReserve = async (donationId: string) => {
    try {
      // Implement reservation logic
      toast.success('Donation reserved successfully!');
    } catch (error) {
      toast.error('Failed to reserve donation');
    }
  };

  // Get current location
  const handleGetLocation = async () => {
    try {
      await getUserLocation();
      toast.success('Location updated');
    } catch (error) {
      toast.error('Failed to get location');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Find Food Donations</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Search for available food donations in your area using our advanced search and filtering tools.
        </p>
        
        {/* Location Status */}
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              {location ? 'Location enabled' : 'Location not set'}
            </span>
          </div>
          {!location && (
            <Button variant="outline" size="sm" onClick={handleGetLocation}>
              Enable Location
            </Button>
          )}
        </div>
      </div>

      {/* Search Interface */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suggestions" className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>Suggestions</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Advanced Search</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Results</span>
            {donations.length > 0 && (
              <Badge variant="outline" className="ml-1">
                {donations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Search Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          <SearchSuggestions
            onSuggestionSelect={handleSuggestionSelect}
            userLocation={location}
          />
        </TabsContent>

        {/* Advanced Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AdvancedSearch
                onResults={setDonations}
                onFiltersChange={setCurrentFilters}
              />
            </div>
            
            {/* Search History Sidebar */}
            <div className="space-y-4">
              {searchHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <History className="h-5 w-5" />
                      <span>Recent Searches</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {searchHistory.slice(0, 5).map((filters, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => handleSearch(filters)}
                      >
                        <div className="space-y-1">
                          <div className="font-medium">
                            {filters.query || 'Advanced Search'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {filters.categories?.length ? `${filters.categories.length} categories` : ''}
                            {filters.location ? ` • ${filters.location.radius}km radius` : ''}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Search Tips */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-700 flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5" />
                    <span>Search Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-blue-600">
                  <p>• Use specific keywords like "bread", "vegetables", or "prepared meals"</p>
                  <p>• Enable location to find donations near you</p>
                  <p>• Filter by expiry date to find urgent donations</p>
                  <p>• Sort by distance to find the closest options</p>
                  <p>• Check multiple categories for broader results</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Search Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {currentFilters && (
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Active Filters:</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('search')}
                  >
                    Modify Search
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentFilters.query && (
                    <Badge variant="outline">
                      Query: "{currentFilters.query}"
                    </Badge>
                  )}
                  {currentFilters.categories && currentFilters.categories.length > 0 && (
                    <Badge variant="outline">
                      {currentFilters.categories.length} categories
                    </Badge>
                  )}
                  {currentFilters.location && (
                    <Badge variant="outline">
                      Within {currentFilters.location.radius}km
                    </Badge>
                  )}
                  {currentFilters.quantityRange && (
                    <Badge variant="outline">
                      Quantity: {currentFilters.quantityRange.min || 0}+
                    </Badge>
                  )}
                  {currentFilters.includeExpired && (
                    <Badge variant="outline">
                      Including expired
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <SearchResults
            donations={donations}
            isLoading={isLoading}
            searchQuery={currentFilters?.query}
            onDonationSelect={handleDonationSelect}
            onDonationReserve={handleDonationReserve}
            userLocation={location}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
