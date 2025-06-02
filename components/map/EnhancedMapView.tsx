'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Route, 
  Clock, 
  Fuel, 
  DollarSign, 
  Leaf,
  Navigation,
  Target,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useLocationContext } from '@/contexts/location-context';
import { 
  getProximitySearchResults, 
  optimizeAdvancedRoute,
  ProximitySearchOptions,
  AdvancedRouteOptions,
  RouteOptimizationResult,
  LocationCoordinates
} from '@/lib/map-service';
import { Donation } from '@/lib/types';
import { MapFilters } from './MapFilters';
import { toast } from 'sonner';

interface EnhancedMapViewProps {
  donations: Donation[];
  onDonationSelect?: (donation: Donation) => void;
  showRouteOptimization?: boolean;
  className?: string;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const defaultContainerStyle = {
  width: '100%',
  height: '600px',
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060,
};

export const EnhancedMapView: React.FC<EnhancedMapViewProps> = ({
  donations,
  onDonationSelect,
  showRouteOptimization = true,
  className = ''
}) => {
  const { location, getUserLocation } = useLocationContext();
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>(donations);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<RouteOptimizationResult | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [searchOptions, setSearchOptions] = useState<ProximitySearchOptions>({
    maxDistance: 10,
    sortBy: 'distance',
    includeExpired: false,
    maxResults: 50
  });
  const [routeOptions, setRouteOptions] = useState<AdvancedRouteOptions>({
    travelMode: google.maps.TravelMode.DRIVING,
    optimizeFor: 'time',
    vehicleType: 'car',
    maxStops: 10
  });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'geometry']
  });

  // Update filtered donations when search options change
  useEffect(() => {
    if (location) {
      const results = getProximitySearchResults(donations, location, searchOptions);
      setFilteredDonations(results);
    } else {
      setFilteredDonations(donations);
    }
  }, [donations, location, searchOptions]);

  // Handle donation marker click
  const handleDonationClick = useCallback((donation: Donation) => {
    setSelectedDonation(donation);
    if (onDonationSelect) {
      onDonationSelect(donation);
    }
  }, [onDonationSelect]);

  // Optimize route for selected donations
  const handleOptimizeRoute = useCallback(async () => {
    if (!location || filteredDonations.length === 0) {
      toast.error('Location required for route optimization');
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await optimizeAdvancedRoute(location, filteredDonations, routeOptions);
      setOptimizedRoute(result);
      
      // Generate directions for the optimized route
      if (result.optimizedOrder.length > 0 && isLoaded) {
        const directionsService = new google.maps.DirectionsService();
        
        const waypoints = result.waypoints.slice(1, -1).map(point => ({
          location: new google.maps.LatLng(point.lat, point.lng),
          stopover: true
        }));

        const destination = result.waypoints[result.waypoints.length - 1];

        directionsService.route({
          origin: location,
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          waypoints,
          travelMode: routeOptions.travelMode,
          optimizeWaypoints: false // We've already optimized
        }, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
          }
        });
      }

      toast.success(`Route optimized! ${result.optimizedOrder.length} stops, ${result.totalDistance.toFixed(1)}km`);
    } catch (error) {
      console.error('Route optimization failed:', error);
      toast.error('Failed to optimize route');
    } finally {
      setIsOptimizing(false);
    }
  }, [location, filteredDonations, routeOptions, isLoaded]);

  // Clear route optimization
  const handleClearRoute = useCallback(() => {
    setOptimizedRoute(null);
    setDirections(null);
  }, []);

  // Get current location
  const handleGetLocation = useCallback(async () => {
    try {
      await getUserLocation();
      toast.success('Location updated');
    } catch (error) {
      toast.error('Failed to get location');
    }
  }, [getUserLocation]);

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'demo_google_maps_api_key') {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center h-96">
          <MapPin className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-amber-600">Google Maps API Key Required</h3>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable enhanced map features.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading enhanced map...</span>
        </CardContent>
      </Card>
    );
  }

  const mapCenter = location || defaultCenter;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Enhanced Map View</span>
            <Badge variant="outline">{filteredDonations.length} donations</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              className="flex items-center space-x-1"
            >
              <Target className="h-4 w-4" />
              <span>Get Location</span>
            </Button>

            {showRouteOptimization && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOptimizeRoute}
                  disabled={isOptimizing || filteredDonations.length === 0}
                  className="flex items-center space-x-1"
                >
                  <Route className="h-4 w-4" />
                  <span>{isOptimizing ? 'Optimizing...' : 'Optimize Route'}</span>
                </Button>

                {optimizedRoute && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearRoute}
                    className="flex items-center space-x-1"
                  >
                    <span>Clear Route</span>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Route Optimization Results */}
          {optimizedRoute && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Route className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">{optimizedRoute.totalDistance.toFixed(1)} km</p>
                      <p className="text-gray-600">Distance</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">{Math.round(optimizedRoute.totalDuration / 60)} min</p>
                      <p className="text-gray-600">Duration</p>
                    </div>
                  </div>

                  {optimizedRoute.estimatedCost && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="font-medium">${optimizedRoute.estimatedCost.toFixed(2)}</p>
                        <p className="text-gray-600">Est. Cost</p>
                      </div>
                    </div>
                  )}

                  {optimizedRoute.carbonFootprint && (
                    <div className="flex items-center space-x-2">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">{optimizedRoute.carbonFootprint.toFixed(1)} kg</p>
                        <p className="text-gray-600">CO₂</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <GoogleMap
            mapContainerStyle={defaultContainerStyle}
            center={mapCenter}
            zoom={12}
            options={{
              fullscreenControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              zoomControl: true,
              gestureHandling: 'cooperative'
            }}
          >
            {/* User location marker */}
            {location && (
              <Marker
                position={location}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#FFFFFF',
                  scale: 8,
                }}
                title="Your Location"
              />
            )}

            {/* Donation markers */}
            {filteredDonations.map((donation) => (
              donation.pickupAddress?.latitude && donation.pickupAddress?.longitude && (
                <Marker
                  key={donation.id}
                  position={{
                    lat: donation.pickupAddress.latitude,
                    lng: donation.pickupAddress.longitude
                  }}
                  onClick={() => handleDonationClick(donation)}
                  icon={{
                    path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    fillColor: donation.status === 'active' ? '#10B981' : '#F59E0B',
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: '#FFFFFF',
                    scale: 6,
                  }}
                />
              )
            ))}

            {/* Info window for selected donation */}
            {selectedDonation && selectedDonation.pickupAddress?.latitude && (
              <InfoWindow
                position={{
                  lat: selectedDonation.pickupAddress.latitude,
                  lng: selectedDonation.pickupAddress.longitude || 0
                }}
                onCloseClick={() => setSelectedDonation(null)}
              >
                <div className="p-2 max-w-xs">
                  <h3 className="font-semibold">{selectedDonation.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedDonation.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline">{selectedDonation.category}</Badge>
                    <Badge variant={selectedDonation.status === 'active' ? 'default' : 'secondary'}>
                      {selectedDonation.status}
                    </Badge>
                  </div>
                  {selectedDonation.quantity && (
                    <p className="text-sm mt-1">Quantity: {selectedDonation.quantity}</p>
                  )}
                </div>
              </InfoWindow>
            )}

            {/* Optimized route directions */}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#10B981',
                    strokeWeight: 4,
                    strokeOpacity: 0.8
                  }
                }}
              />
            )}
          </GoogleMap>
        </CardContent>
      </Card>
    </div>
  );
};
