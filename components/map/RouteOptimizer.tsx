'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Route, 
  Clock, 
  DollarSign, 
  Fuel, 
  Leaf,
  Car,
  Truck,
  Bike,
  MapPin,
  RefreshCw,
  Target,
  Navigation,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useLocationContext } from '@/contexts/location-context';
import { 
  optimizeAdvancedRoute,
  AdvancedRouteOptions,
  RouteOptimizationResult
} from '@/lib/map-service';
import { Donation } from '@/lib/types';
import { toast } from 'sonner';

interface RouteOptimizerProps {
  donations: Donation[];
  onRouteOptimized: (result: RouteOptimizationResult) => void;
  onRouteCleared: () => void;
  className?: string;
}

const VEHICLE_ICONS = {
  car: Car,
  truck: Truck,
  bike: Bike,
  walking: MapPin
};

export const RouteOptimizer: React.FC<RouteOptimizerProps> = ({
  donations,
  onRouteOptimized,
  onRouteCleared,
  className = ''
}) => {
  const { location, getUserLocation } = useLocationContext();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RouteOptimizationResult | null>(null);
  const [routeOptions, setRouteOptions] = useState<AdvancedRouteOptions>({
    travelMode: google.maps.TravelMode.DRIVING,
    optimizeFor: 'time',
    vehicleType: 'car',
    maxStops: 10,
    avoidHighways: false,
    avoidTolls: false
  });

  const handleOptimizeRoute = useCallback(async () => {
    if (!location) {
      toast.error('Location required for route optimization');
      return;
    }

    if (donations.length === 0) {
      toast.error('No donations available for optimization');
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await optimizeAdvancedRoute(location, donations, routeOptions);
      setCurrentRoute(result);
      onRouteOptimized(result);
      
      const metrics = [
        `${result.optimizedOrder.length} stops`,
        `${result.totalDistance.toFixed(1)}km`,
        result.estimatedCost ? `$${result.estimatedCost.toFixed(2)}` : null,
        result.carbonFootprint ? `${result.carbonFootprint.toFixed(1)}kg CO₂` : null
      ].filter(Boolean).join(', ');

      toast.success(`Route optimized! ${metrics}`);
    } catch (error) {
      console.error('Route optimization failed:', error);
      toast.error('Failed to optimize route');
    } finally {
      setIsOptimizing(false);
    }
  }, [location, donations, routeOptions, onRouteOptimized]);

  const handleClearRoute = useCallback(() => {
    setCurrentRoute(null);
    onRouteCleared();
    toast.success('Route cleared');
  }, [onRouteCleared]);

  const handleGetLocation = useCallback(async () => {
    try {
      await getUserLocation();
      toast.success('Location updated');
    } catch (error) {
      toast.error('Failed to get location');
    }
  }, [getUserLocation]);

  const updateRouteOption = <K extends keyof AdvancedRouteOptions>(
    key: K,
    value: AdvancedRouteOptions[K]
  ) => {
    setRouteOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleMaxStopsChange = (value: number[]) => {
    updateRouteOption('maxStops', value[0]);
  };

  const VehicleIcon = VEHICLE_ICONS[routeOptions.vehicleType as keyof typeof VEHICLE_ICONS] || Car;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Route className="h-5 w-5" />
          <span>Route Optimizer</span>
          {currentRoute && (
            <Badge variant="outline">{currentRoute.optimizedOrder.length} stops</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              {location ? 'Starting location set' : 'Starting location required'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGetLocation}
            className="flex items-center space-x-1"
          >
            <Target className="h-4 w-4" />
            <span>Get Location</span>
          </Button>
        </div>

        <Separator />

        {/* Vehicle Type */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <VehicleIcon className="h-4 w-4" />
            <span>Vehicle Type</span>
          </Label>
          <Select 
            value={routeOptions.vehicleType} 
            onValueChange={(value) => updateRouteOption('vehicleType', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="car">
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4" />
                  <span>Car</span>
                </div>
              </SelectItem>
              <SelectItem value="truck">
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4" />
                  <span>Truck</span>
                </div>
              </SelectItem>
              <SelectItem value="bike">
                <div className="flex items-center space-x-2">
                  <Bike className="h-4 w-4" />
                  <span>Bike</span>
                </div>
              </SelectItem>
              <SelectItem value="walking">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Walking</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Travel Mode */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Navigation className="h-4 w-4" />
            <span>Travel Mode</span>
          </Label>
          <Select 
            value={routeOptions.travelMode} 
            onValueChange={(value) => updateRouteOption('travelMode', value as google.maps.TravelMode)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={google.maps.TravelMode.DRIVING}>Driving</SelectItem>
              <SelectItem value={google.maps.TravelMode.WALKING}>Walking</SelectItem>
              <SelectItem value={google.maps.TravelMode.BICYCLING}>Bicycling</SelectItem>
              <SelectItem value={google.maps.TravelMode.TRANSIT}>Transit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Optimization Goal */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Optimize For</span>
          </Label>
          <Select 
            value={routeOptions.optimizeFor} 
            onValueChange={(value) => updateRouteOption('optimizeFor', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Shortest Time</span>
                </div>
              </SelectItem>
              <SelectItem value="distance">
                <div className="flex items-center space-x-2">
                  <Route className="h-4 w-4" />
                  <span>Shortest Distance</span>
                </div>
              </SelectItem>
              <SelectItem value="fuel">
                <div className="flex items-center space-x-2">
                  <Fuel className="h-4 w-4" />
                  <span>Fuel Efficiency</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Stops */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Max Stops: {routeOptions.maxStops}</span>
          </Label>
          <Slider
            value={[routeOptions.maxStops || 10]}
            onValueChange={handleMaxStopsChange}
            max={Math.min(20, donations.length)}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 stop</span>
            <span>{Math.min(20, donations.length)} stops</span>
          </div>
        </div>

        {/* Route Preferences */}
        <div className="space-y-4">
          <Label className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Route Preferences</span>
          </Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="avoid-highways">Avoid Highways</Label>
            <Switch
              id="avoid-highways"
              checked={routeOptions.avoidHighways}
              onCheckedChange={(checked) => updateRouteOption('avoidHighways', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="avoid-tolls">Avoid Tolls</Label>
            <Switch
              id="avoid-tolls"
              checked={routeOptions.avoidTolls}
              onCheckedChange={(checked) => updateRouteOption('avoidTolls', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleOptimizeRoute}
            disabled={!location || donations.length === 0 || isOptimizing}
            className="flex-1 flex items-center space-x-2"
          >
            {isOptimizing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Route className="h-4 w-4" />
            )}
            <span>{isOptimizing ? 'Optimizing...' : 'Optimize Route'}</span>
          </Button>

          {currentRoute && (
            <Button
              variant="outline"
              onClick={handleClearRoute}
              className="flex items-center space-x-2"
            >
              <span>Clear</span>
            </Button>
          )}
        </div>

        {/* Route Results */}
        {currentRoute && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg">Optimized Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Route className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">{currentRoute.totalDistance.toFixed(1)} km</p>
                    <p className="text-sm text-gray-600">Total Distance</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">{Math.round(currentRoute.totalDuration / 60)} min</p>
                    <p className="text-sm text-gray-600">Est. Duration</p>
                  </div>
                </div>

                {currentRoute.estimatedCost && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="font-medium">${currentRoute.estimatedCost.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Est. Cost</p>
                    </div>
                  </div>
                )}

                {currentRoute.fuelConsumption && (
                  <div className="flex items-center space-x-2">
                    <Fuel className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="font-medium">{currentRoute.fuelConsumption.toFixed(1)} L</p>
                      <p className="text-sm text-gray-600">Fuel</p>
                    </div>
                  </div>
                )}

                {currentRoute.carbonFootprint && (
                  <div className="flex items-center space-x-2">
                    <Leaf className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">{currentRoute.carbonFootprint.toFixed(1)} kg</p>
                      <p className="text-sm text-gray-600">CO₂ Emissions</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Route Order:</p>
                <div className="space-y-1">
                  {currentRoute.optimizedOrder.slice(0, 5).map((donation, index) => (
                    <div key={donation.id} className="flex items-center space-x-2 text-sm">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="truncate">{donation.title}</span>
                    </div>
                  ))}
                  {currentRoute.optimizedOrder.length > 5 && (
                    <p className="text-xs text-gray-500">
                      +{currentRoute.optimizedOrder.length - 5} more stops
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
