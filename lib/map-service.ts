import { Donation } from './types';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distance: number; // in meters
  duration: number; // in seconds
  distanceText: string;
  durationText: string;
}

export interface RouteOptimizationResult {
  optimizedOrder: Donation[];
  totalDistance: number;
  totalDuration: number;
  waypoints: LocationCoordinates[];
  estimatedCost?: number;
  fuelConsumption?: number;
  carbonFootprint?: number;
}

export interface ProximitySearchOptions {
  maxDistance: number; // in kilometers
  sortBy: 'distance' | 'urgency' | 'quantity' | 'expiry';
  includeExpired?: boolean;
  categories?: string[];
  minQuantity?: number;
  maxResults?: number;
}

export interface AdvancedRouteOptions {
  travelMode: google.maps.TravelMode;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  optimizeFor: 'time' | 'distance' | 'fuel';
  vehicleType?: 'car' | 'truck' | 'bike' | 'walking';
  maxStops?: number;
  timeWindows?: { start: Date; end: Date }[];
}

export interface MapFilter {
  maxDistance?: number; // in kilometers
  category?: string;
  status?: string;
  expiryWithin?: number; // hours
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateHaversineDistance(
  point1: LocationCoordinates,
  point2: LocationCoordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Filter donations based on distance and other criteria
 */
export function filterDonationsByLocation(
  donations: Donation[],
  userLocation: LocationCoordinates,
  filters: MapFilter
): Donation[] {
  return donations.filter(donation => {
    // Check if donation has valid coordinates
    if (!donation.pickupAddress?.latitude || !donation.pickupAddress?.longitude) {
      return false;
    }

    const donationLocation = {
      lat: donation.pickupAddress.latitude,
      lng: donation.pickupAddress.longitude
    };

    // Distance filter
    if (filters.maxDistance) {
      const distance = calculateHaversineDistance(userLocation, donationLocation);
      if (distance > filters.maxDistance) {
        return false;
      }
    }

    // Category filter
    if (filters.category && donation.category !== filters.category) {
      return false;
    }

    // Status filter
    if (filters.status && donation.status !== filters.status) {
      return false;
    }

    // Expiry filter
    if (filters.expiryWithin) {
      const now = new Date();
      const expiryDate = new Date(donation.expiryDate);
      const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilExpiry > filters.expiryWithin) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort donations by distance from user location
 */
export function sortDonationsByDistance(
  donations: Donation[],
  userLocation: LocationCoordinates
): Donation[] {
  return donations
    .filter(donation => donation.pickupAddress?.latitude && donation.pickupAddress?.longitude)
    .map(donation => ({
      ...donation,
      distance: calculateHaversineDistance(userLocation, {
        lat: donation.pickupAddress!.latitude!,
        lng: donation.pickupAddress!.longitude!
      })
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Get distance matrix using Google Maps API
 */
export async function getDistanceMatrix(
  origins: LocationCoordinates[],
  destinations: LocationCoordinates[],
  travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
): Promise<DistanceResult[][]> {
  return new Promise((resolve, reject) => {
    if (typeof google === 'undefined') {
      reject(new Error('Google Maps API not loaded'));
      return;
    }

    const service = new google.maps.DistanceMatrixService();
    
    service.getDistanceMatrix({
      origins: origins,
      destinations: destinations,
      travelMode: travelMode,
      unitSystem: google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    }, (response, status) => {
      if (status === google.maps.DistanceMatrixStatus.OK && response) {
        const results: DistanceResult[][] = [];
        
        response.rows.forEach((row, i) => {
          results[i] = [];
          row.elements.forEach((element, j) => {
            if (element.status === 'OK') {
              results[i][j] = {
                distance: element.distance.value,
                duration: element.duration.value,
                distanceText: element.distance.text,
                durationText: element.duration.text
              };
            } else {
              results[i][j] = {
                distance: 0,
                duration: 0,
                distanceText: 'N/A',
                durationText: 'N/A'
              };
            }
          });
        });
        
        resolve(results);
      } else {
        reject(new Error(`Distance Matrix request failed: ${status}`));
      }
    });
  });
}

/**
 * Advanced route optimization with multiple algorithms and options
 */
export async function optimizeAdvancedRoute(
  startLocation: LocationCoordinates,
  donations: Donation[],
  options: AdvancedRouteOptions
): Promise<RouteOptimizationResult> {
  if (donations.length === 0) {
    return {
      optimizedOrder: [],
      totalDistance: 0,
      totalDuration: 0,
      waypoints: [],
      estimatedCost: 0,
      fuelConsumption: 0,
      carbonFootprint: 0
    };
  }

  // Filter donations with valid coordinates
  const validDonations = donations.filter(
    d => d.pickupAddress?.latitude && d.pickupAddress?.longitude
  );

  if (validDonations.length === 0) {
    return {
      optimizedOrder: [],
      totalDistance: 0,
      totalDuration: 0,
      waypoints: [],
      estimatedCost: 0,
      fuelConsumption: 0,
      carbonFootprint: 0
    };
  }

  // Limit stops if specified
  const donationsToOptimize = options.maxStops
    ? validDonations.slice(0, options.maxStops)
    : validDonations;

  let optimizedOrder: Donation[];
  let totalDistance = 0;
  let totalDuration = 0;

  // Choose optimization algorithm based on number of stops
  if (donationsToOptimize.length <= 3) {
    // Use brute force for small sets
    const result = optimizeBruteForce(startLocation, donationsToOptimize);
    optimizedOrder = result.optimizedOrder;
    totalDistance = result.totalDistance;
  } else if (donationsToOptimize.length <= 10) {
    // Use genetic algorithm for medium sets
    const result = optimizeGeneticAlgorithm(startLocation, donationsToOptimize, options);
    optimizedOrder = result.optimizedOrder;
    totalDistance = result.totalDistance;
  } else {
    // Use nearest neighbor with 2-opt improvement for large sets
    const result = optimizeNearestNeighborWith2Opt(startLocation, donationsToOptimize, options);
    optimizedOrder = result.optimizedOrder;
    totalDistance = result.totalDistance;
  }

  // Calculate additional metrics
  const estimatedCost = calculateEstimatedCost(totalDistance, options.vehicleType);
  const fuelConsumption = calculateFuelConsumption(totalDistance, options.vehicleType);
  const carbonFootprint = calculateCarbonFootprint(totalDistance, options.vehicleType);

  // Generate waypoints
  const waypoints = optimizedOrder.map(donation => ({
    lat: donation.pickupAddress!.latitude!,
    lng: donation.pickupAddress!.longitude!
  }));

  return {
    optimizedOrder,
    totalDistance,
    totalDuration,
    waypoints,
    estimatedCost,
    fuelConsumption,
    carbonFootprint
  };
}

/**
 * Optimize route for multiple donations using nearest neighbor algorithm (legacy)
 */
export function optimizeRoute(
  startLocation: LocationCoordinates,
  donations: Donation[]
): RouteOptimizationResult {
  if (donations.length === 0) {
    return {
      optimizedOrder: [],
      totalDistance: 0,
      totalDuration: 0,
      waypoints: []
    };
  }

  // Filter donations with valid coordinates
  const validDonations = donations.filter(
    d => d.pickupAddress?.latitude && d.pickupAddress?.longitude
  );

  if (validDonations.length === 0) {
    return {
      optimizedOrder: [],
      totalDistance: 0,
      totalDuration: 0,
      waypoints: []
    };
  }

  // Simple nearest neighbor algorithm
  const optimizedOrder: Donation[] = [];
  const remaining = [...validDonations];
  let currentLocation = startLocation;
  let totalDistance = 0;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    // Find nearest donation
    remaining.forEach((donation, index) => {
      const donationLocation = {
        lat: donation.pickupAddress!.latitude!,
        lng: donation.pickupAddress!.longitude!
      };
      
      const distance = calculateHaversineDistance(currentLocation, donationLocation);
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    // Add nearest donation to optimized order
    const nearestDonation = remaining[nearestIndex];
    optimizedOrder.push(nearestDonation);
    totalDistance += nearestDistance;

    // Update current location
    currentLocation = {
      lat: nearestDonation.pickupAddress!.latitude!,
      lng: nearestDonation.pickupAddress!.longitude!
    };

    // Remove from remaining
    remaining.splice(nearestIndex, 1);
  }

  // Create waypoints array
  const waypoints = optimizedOrder.map(donation => ({
    lat: donation.pickupAddress!.latitude!,
    lng: donation.pickupAddress!.longitude!
  }));

  return {
    optimizedOrder,
    totalDistance: totalDistance * 1000, // Convert to meters
    totalDuration: totalDistance * 60, // Rough estimate: 1km = 1 minute
    waypoints
  };
}

/**
 * Enhanced proximity search with advanced filtering and sorting
 */
export function getProximitySearchResults(
  donations: Donation[],
  centerLocation: LocationCoordinates,
  options: ProximitySearchOptions
): Donation[] {
  // Filter donations based on criteria
  let filteredDonations = donations.filter(donation => {
    // Check if donation has valid coordinates
    if (!donation.pickupAddress?.latitude || !donation.pickupAddress?.longitude) {
      return false;
    }

    // Calculate distance
    const donationLocation = {
      lat: donation.pickupAddress.latitude,
      lng: donation.pickupAddress.longitude
    };
    const distance = calculateHaversineDistance(centerLocation, donationLocation);

    // Distance filter
    if (distance > options.maxDistance) {
      return false;
    }

    // Category filter
    if (options.categories && options.categories.length > 0) {
      if (!options.categories.includes(donation.category)) {
        return false;
      }
    }

    // Quantity filter
    if (options.minQuantity && donation.quantity < options.minQuantity) {
      return false;
    }

    // Expiry filter
    if (!options.includeExpired && donation.expiryDate) {
      const now = new Date();
      const expiryDate = new Date(donation.expiryDate);
      if (expiryDate < now) {
        return false;
      }
    }

    return true;
  });

  // Add distance information to donations for sorting
  const donationsWithDistance = filteredDonations.map(donation => {
    const donationLocation = {
      lat: donation.pickupAddress!.latitude!,
      lng: donation.pickupAddress!.longitude!
    };
    const distance = calculateHaversineDistance(centerLocation, donationLocation);

    return {
      ...donation,
      _distance: distance,
      _urgencyScore: calculateUrgencyScore(donation),
      _quantityScore: calculateQuantityScore(donation)
    };
  });

  // Sort based on criteria
  donationsWithDistance.sort((a, b) => {
    switch (options.sortBy) {
      case 'distance':
        return a._distance - b._distance;
      case 'urgency':
        return b._urgencyScore - a._urgencyScore;
      case 'quantity':
        return b._quantityScore - a._quantityScore;
      case 'expiry':
        return getExpiryTimestamp(a) - getExpiryTimestamp(b);
      default:
        return a._distance - b._distance;
    }
  });

  // Limit results
  const maxResults = options.maxResults || 50;
  return donationsWithDistance.slice(0, maxResults);
}

/**
 * Calculate urgency score based on expiry date and status
 */
function calculateUrgencyScore(donation: Donation): number {
  let score = 0;

  // Base score from status
  if (donation.status === 'active') score += 100;
  else if (donation.status === 'pending') score += 50;

  // Expiry urgency
  if (donation.expiryDate) {
    const now = new Date();
    const expiry = new Date(donation.expiryDate);
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilExpiry < 0) score -= 200; // Expired
    else if (hoursUntilExpiry < 6) score += 200; // Very urgent
    else if (hoursUntilExpiry < 24) score += 100; // Urgent
    else if (hoursUntilExpiry < 72) score += 50; // Moderately urgent
  }

  return score;
}

/**
 * Calculate quantity score for prioritization
 */
function calculateQuantityScore(donation: Donation): number {
  return donation.quantity || 0;
}

/**
 * Get expiry timestamp for sorting
 */
function getExpiryTimestamp(donation: Donation): number {
  if (!donation.expiryDate) return Infinity;
  return new Date(donation.expiryDate).getTime();
}

/**
 * Get nearby donations within a radius (legacy function for backward compatibility)
 */
export function getNearbyDonations(
  donations: Donation[],
  centerLocation: LocationCoordinates,
  radiusKm: number
): Donation[] {
  return getProximitySearchResults(donations, centerLocation, {
    maxDistance: radiusKm,
    sortBy: 'distance',
    includeExpired: false
  });
}

/**
 * Brute force optimization for small sets (≤3 donations)
 */
function optimizeBruteForce(
  startLocation: LocationCoordinates,
  donations: Donation[]
): { optimizedOrder: Donation[]; totalDistance: number } {
  if (donations.length === 0) {
    return { optimizedOrder: [], totalDistance: 0 };
  }

  if (donations.length === 1) {
    const distance = calculateHaversineDistance(startLocation, {
      lat: donations[0].pickupAddress!.latitude!,
      lng: donations[0].pickupAddress!.longitude!
    });
    return { optimizedOrder: donations, totalDistance: distance };
  }

  // Generate all permutations
  const permutations = generatePermutations(donations);
  let bestOrder = donations;
  let bestDistance = Infinity;

  for (const permutation of permutations) {
    const distance = calculateTotalRouteDistance(startLocation, permutation);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestOrder = permutation;
    }
  }

  return { optimizedOrder: bestOrder, totalDistance: bestDistance };
}

/**
 * Genetic algorithm optimization for medium sets (4-10 donations)
 */
function optimizeGeneticAlgorithm(
  startLocation: LocationCoordinates,
  donations: Donation[],
  options: AdvancedRouteOptions
): { optimizedOrder: Donation[]; totalDistance: number } {
  const populationSize = Math.min(50, donations.length * 4);
  const generations = 100;
  const mutationRate = 0.1;
  const eliteSize = Math.floor(populationSize * 0.2);

  // Initialize population
  let population = Array.from({ length: populationSize }, () =>
    shuffleArray([...donations])
  );

  for (let generation = 0; generation < generations; generation++) {
    // Evaluate fitness (lower distance = higher fitness)
    const fitness = population.map(individual => {
      const distance = calculateTotalRouteDistance(startLocation, individual);
      return 1 / (1 + distance); // Convert distance to fitness
    });

    // Selection and reproduction
    const newPopulation: Donation[][] = [];

    // Keep elite individuals
    const sortedIndices = fitness
      .map((fit, index) => ({ fitness: fit, index }))
      .sort((a, b) => b.fitness - a.fitness)
      .map(item => item.index);

    for (let i = 0; i < eliteSize; i++) {
      newPopulation.push([...population[sortedIndices[i]]]);
    }

    // Generate offspring
    while (newPopulation.length < populationSize) {
      const parent1 = tournamentSelection(population, fitness);
      const parent2 = tournamentSelection(population, fitness);
      const offspring = crossover(parent1, parent2);

      if (Math.random() < mutationRate) {
        mutate(offspring);
      }

      newPopulation.push(offspring);
    }

    population = newPopulation;
  }

  // Return best solution
  const finalFitness = population.map(individual =>
    calculateTotalRouteDistance(startLocation, individual)
  );
  const bestIndex = finalFitness.indexOf(Math.min(...finalFitness));

  return {
    optimizedOrder: population[bestIndex],
    totalDistance: finalFitness[bestIndex]
  };
}

/**
 * Nearest neighbor with 2-opt improvement for large sets (>10 donations)
 */
function optimizeNearestNeighborWith2Opt(
  startLocation: LocationCoordinates,
  donations: Donation[],
  options: AdvancedRouteOptions
): { optimizedOrder: Donation[]; totalDistance: number } {
  // Start with nearest neighbor
  const nnResult = optimizeNearestNeighbor(startLocation, donations);
  let currentOrder = nnResult.optimizedOrder;
  let currentDistance = nnResult.totalDistance;

  // Apply 2-opt improvement
  let improved = true;
  let iterations = 0;
  const maxIterations = donations.length * 2;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 1; i < currentOrder.length - 1; i++) {
      for (let j = i + 1; j < currentOrder.length; j++) {
        // Try 2-opt swap
        const newOrder = twoOptSwap(currentOrder, i, j);
        const newDistance = calculateTotalRouteDistance(startLocation, newOrder);

        if (newDistance < currentDistance) {
          currentOrder = newOrder;
          currentDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return { optimizedOrder: currentOrder, totalDistance: currentDistance };
}

/**
 * Simple nearest neighbor algorithm
 */
function optimizeNearestNeighbor(
  startLocation: LocationCoordinates,
  donations: Donation[]
): { optimizedOrder: Donation[]; totalDistance: number } {
  const optimizedOrder: Donation[] = [];
  const remaining = [...donations];
  let currentLocation = startLocation;
  let totalDistance = 0;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((donation, index) => {
      const donationLocation = {
        lat: donation.pickupAddress!.latitude!,
        lng: donation.pickupAddress!.longitude!
      };

      const distance = calculateHaversineDistance(currentLocation, donationLocation);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const nearestDonation = remaining[nearestIndex];
    optimizedOrder.push(nearestDonation);
    totalDistance += nearestDistance;

    currentLocation = {
      lat: nearestDonation.pickupAddress!.latitude!,
      lng: nearestDonation.pickupAddress!.longitude!
    };

    remaining.splice(nearestIndex, 1);
  }

  return { optimizedOrder, totalDistance };
}

/**
 * Utility functions for optimization algorithms
 */

// Generate all permutations of an array
function generatePermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];

  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = generatePermutations(rest);
    for (const perm of perms) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Calculate total route distance
function calculateTotalRouteDistance(
  startLocation: LocationCoordinates,
  donations: Donation[]
): number {
  if (donations.length === 0) return 0;

  let totalDistance = 0;
  let currentLocation = startLocation;

  for (const donation of donations) {
    const donationLocation = {
      lat: donation.pickupAddress!.latitude!,
      lng: donation.pickupAddress!.longitude!
    };

    totalDistance += calculateHaversineDistance(currentLocation, donationLocation);
    currentLocation = donationLocation;
  }

  return totalDistance;
}

// Tournament selection for genetic algorithm
function tournamentSelection(population: Donation[][], fitness: number[]): Donation[] {
  const tournamentSize = 3;
  let bestIndex = Math.floor(Math.random() * population.length);
  let bestFitness = fitness[bestIndex];

  for (let i = 1; i < tournamentSize; i++) {
    const index = Math.floor(Math.random() * population.length);
    if (fitness[index] > bestFitness) {
      bestIndex = index;
      bestFitness = fitness[index];
    }
  }

  return [...population[bestIndex]];
}

// Crossover operation for genetic algorithm
function crossover(parent1: Donation[], parent2: Donation[]): Donation[] {
  const length = parent1.length;
  const start = Math.floor(Math.random() * length);
  const end = Math.floor(Math.random() * (length - start)) + start;

  const offspring: Donation[] = new Array(length);
  const selected = new Set<string>();

  // Copy segment from parent1
  for (let i = start; i <= end; i++) {
    offspring[i] = parent1[i];
    selected.add(parent1[i].id);
  }

  // Fill remaining positions with parent2
  let parent2Index = 0;
  for (let i = 0; i < length; i++) {
    if (offspring[i] === undefined) {
      while (selected.has(parent2[parent2Index].id)) {
        parent2Index++;
      }
      offspring[i] = parent2[parent2Index];
      selected.add(parent2[parent2Index].id);
      parent2Index++;
    }
  }

  return offspring;
}

// Mutation operation for genetic algorithm
function mutate(individual: Donation[]): void {
  if (individual.length < 2) return;

  const i = Math.floor(Math.random() * individual.length);
  const j = Math.floor(Math.random() * individual.length);

  [individual[i], individual[j]] = [individual[j], individual[i]];
}

// 2-opt swap operation
function twoOptSwap(route: Donation[], i: number, j: number): Donation[] {
  const newRoute = [...route];

  // Reverse the segment between i and j
  while (i < j) {
    [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
    i++;
    j--;
  }

  return newRoute;
}

// Calculate estimated cost based on distance and vehicle type
function calculateEstimatedCost(distanceKm: number, vehicleType?: string): number {
  const costPerKm = {
    car: 0.5,      // $0.50 per km
    truck: 1.2,    // $1.20 per km
    bike: 0.1,     // $0.10 per km
    walking: 0     // Free
  };

  const rate = costPerKm[vehicleType as keyof typeof costPerKm] || costPerKm.car;
  return distanceKm * rate;
}

// Calculate fuel consumption based on distance and vehicle type
function calculateFuelConsumption(distanceKm: number, vehicleType?: string): number {
  const fuelPerKm = {
    car: 0.08,     // 8L per 100km
    truck: 0.25,   // 25L per 100km
    bike: 0,       // No fuel
    walking: 0     // No fuel
  };

  const rate = fuelPerKm[vehicleType as keyof typeof fuelPerKm] || fuelPerKm.car;
  return distanceKm * rate;
}

// Calculate carbon footprint based on distance and vehicle type
function calculateCarbonFootprint(distanceKm: number, vehicleType?: string): number {
  const co2PerKm = {
    car: 0.12,     // 120g CO2 per km
    truck: 0.35,   // 350g CO2 per km
    bike: 0,       // No emissions
    walking: 0     // No emissions
  };

  const rate = co2PerKm[vehicleType as keyof typeof co2PerKm] || co2PerKm.car;
  return distanceKm * rate; // Returns kg of CO2
}

/**
 * Calculate bounds for a set of locations
 */
export function calculateBounds(locations: LocationCoordinates[]): google.maps.LatLngBounds | null {
  if (typeof google === 'undefined' || locations.length === 0) {
    return null;
  }

  const bounds = new google.maps.LatLngBounds();
  
  locations.forEach(location => {
    bounds.extend(new google.maps.LatLng(location.lat, location.lng));
  });

  return bounds;
}

/**
 * Format distance for display
 */
export function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} m`;
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)} km`;
  }
}

/**
 * Format duration for display
 */
export function formatDuration(durationInSeconds: number): string {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
