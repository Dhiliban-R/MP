'use client';

import React, { useState, useEffect } from 'react';
import { MapView } from '@/components/ui/map-view';
import { MapFilters } from '@/components/map/MapFilters';
import { RouteOptimizer } from '@/components/map/RouteOptimizer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Map, 
  Filter, 
  Route, 
  MapPin, 
  Layers,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Donation } from '@/lib/types';
import { 
  MapFilter, 
  LocationCoordinates, 
  RouteOptimizationResult,
  filterDonationsByLocation,
  sortDonationsByDistance,
  getNearbyDonations
} from '@/lib/map-service';
import { useDonations } from '@/hooks/use-donations';

export default function EnhancedMapPage() {
  const { user, loading } = useAuth();
  const { donations, loading: donationsLoading } = useDonations();
  
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [filters, setFilters] = useState<MapFilter>({ maxDistance: 10 });
  const [selectedDonations, setSelectedDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<RouteOptimizationResult | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
  const [mapView, setMapView] = useState<'standard' | 'satellite' | 'hybrid'>('standard');

  // Get unique categories for filter
  const donationCategories = Array.from(
    new Set(donations.map(d => d.category).filter(Boolean))
  );

  // Update filtered donations when filters or donations change
  useEffect(() => {
    if (!userLocation) {
      setFilteredDonations(donations);
      return;
    }

    let filtered = filterDonationsByLocation(donations, userLocation, filters);
    
    // Sort by distance if user location is available
    filtered = sortDonationsByDistance(filtered, userLocation);
    
    setFilteredDonations(filtered);
  }, [donations, userLocation, filters]);

  // Handle donation selection for route optimization
  const handleDonationSelect = (donation: Donation) => {
    setSelectedDonations(prev => {
      const isSelected = prev.some(d => d.id === donation.id);
      if (isSelected) {
        return prev.filter(d => d.id !== donation.id);
      } else {
        return [...prev, donation];
      }
    });
  };

  const handleRouteOptimized = (result: RouteOptimizationResult) => {
    setOptimizedRoute(result);
    setShowRouteOptimizer(true);
  };

  const clearSelection = () => {
    setSelectedDonations([]);
    setOptimizedRoute(null);
    setShowRouteOptimizer(false);
  };

  if (loading || donationsLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading map...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Map className="h-6 w-6" />
              <span>Interactive Map</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <Map className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground">
                Please log in to access the interactive map features
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Map className="h-8 w-8" />
          <span>Interactive Map</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Discover nearby food donations and optimize your pickup routes
        </p>
      </div>

      {/* Map Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>{filteredDonations.length} donations found</span>
          </Badge>
          {selectedDonations.length > 0 && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Route className="h-3 w-3" />
              <span>{selectedDonations.length} selected</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? (
              <ToggleRight className="h-4 w-4 ml-2" />
            ) : (
              <ToggleLeft className="h-4 w-4 ml-2" />
            )}
          </Button>

          {selectedDonations.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRouteOptimizer(!showRouteOptimizer)}
              >
                <Route className="h-4 w-4 mr-2" />
                Route Optimizer
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filters */}
          {showFilters && (
            <MapFilters
              filters={filters}
              onFiltersChange={setFilters}
              donationCategories={donationCategories}
            />
          )}

          {/* Route Optimizer */}
          {showRouteOptimizer && (
            <RouteOptimizer
              donations={selectedDonations}
              onRouteOptimized={handleRouteOptimized}
              onRouteCleared={() => setSelectedDonations([])}
            />
          )}

          {/* Map Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Layers className="h-5 w-5" />
                <span>Map Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Donations</span>
                <Badge variant="outline">{donations.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Filtered Results</span>
                <Badge variant="outline">{filteredDonations.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Categories</span>
                <Badge variant="outline">{donationCategories.length}</Badge>
              </div>
              {selectedDonations.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Selected</span>
                  <Badge variant="secondary">{selectedDonations.length}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <MapView
                donations={filteredDonations}
                height="600px"
                showUserLocation={true}
                onMarkerClick={handleDonationSelect}
                markerType={user.role === 'donor' ? 'donor' : 'recipient'}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
