import type { GpsCoordinate, PointToPointRoute, MizoramLocality } from '../types/platform.ts';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates straight line distance between two GPS coordinates using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = EARTH_RADIUS_KM * c;
  return Math.round(d * 100) / 100;
}

/**
 * In Mizoram's steep hill terrain (e.g. Aizawl ridge roads), actual road transit is 
 * 1.35x to 1.55x the straight displacement due to switchbacks and winding valley routes.
 */
export function calculateHillRoadDistance(
  straightDistanceKm: number,
  elevationDeltaMeters: number = 0,
  steepnessRating: number = 3
): number {
  if (straightDistanceKm <= 0) return 0.2; // minimum local transit
  
  // Winding multiplier based on hill steepness (1.30 to 1.55)
  const windingMultiplier = 1.25 + (steepnessRating * 0.06);
  
  // Additional distance from vertical slope switchbacks
  const slopeAdditionKm = (Math.abs(elevationDeltaMeters) / 1000) * 0.45;
  
  const total = (straightDistanceKm * windingMultiplier) + slopeAdditionKm;
  return Math.round(total * 10) / 10;
}

/**
 * Computes elevation change and travel direction
 */
export function calculateElevationDelta(
  originElevationMeters: number = 900,
  destElevationMeters: number = 900
): { delta: number; direction: 'uphill' | 'downhill' | 'ridge_level' } {
  const diff = destElevationMeters - originElevationMeters;
  if (Math.abs(diff) < 25) {
    return { delta: diff, direction: 'ridge_level' };
  }
  return {
    delta: diff,
    direction: diff > 0 ? 'uphill' : 'downhill',
  };
}

/**
 * Slope gradient percentage
 */
export function calculateSlopeGradient(
  roadDistanceKm: number,
  elevationDeltaMeters: number
): number {
  if (roadDistanceKm <= 0) return 0;
  const distanceMeters = roadDistanceKm * 1000;
  const gradient = (Math.abs(elevationDeltaMeters) / distanceMeters) * 100;
  return Math.round(gradient * 10) / 10;
}

/**
 * Estimates courier transit time in Mizoram hills
 */
export function estimateHillTransitMinutes(
  roadDistanceKm: number,
  elevationDeltaMeters: number,
  vehicleType: 'two_wheeler' | 'foot_steps' | 'taxi_car' = 'two_wheeler'
): number {
  let baseSpeedKmH = 20; // Average hill speed in Aizawl traffic
  if (vehicleType === 'foot_steps') baseSpeedKmH = 4.5;
  if (vehicleType === 'taxi_car') baseSpeedKmH = 16;

  // Climbing uphill slows transit by up to 25%
  const hillClimbPenalty = elevationDeltaMeters > 50 ? 1.25 : 1.0;
  const hours = (roadDistanceKm / baseSpeedKmH) * hillClimbPenalty;
  const minutes = Math.round(hours * 60) + 6; // +6 mins for pickup/parking in steep kawn
  return Math.max(10, minutes);
}

/**
 * Finds the nearest Mizoram locality from any GPS coordinate
 */
export function findNearestLocality(
  lat: number,
  lng: number,
  localities: MizoramLocality[]
): { locality: MizoramLocality; distanceKm: number } {
  let nearest = localities[0];
  let minDistance = calculateHaversineDistance(lat, lng, nearest.latitude, nearest.longitude);

  for (let i = 1; i < localities.length; i++) {
    const loc = localities[i];
    const dist = calculateHaversineDistance(lat, lng, loc.latitude, loc.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = loc;
    }
  }

  return { locality: nearest, distanceKm: minDistance };
}

/**
 * Generates a full PointToPointRoute object from two GPS points
 */
export function computePointToPointRoute(
  origin: GpsCoordinate,
  destination: GpsCoordinate,
  steepnessRating: number = 3
): PointToPointRoute {
  const straightDistanceKm = calculateHaversineDistance(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );

  const origAlt = origin.elevationMeters ?? 920;
  const destAlt = destination.elevationMeters ?? 920;
  const { delta, direction } = calculateElevationDelta(origAlt, destAlt);

  const roadDistanceKm = calculateHillRoadDistance(
    straightDistanceKm,
    delta,
    steepnessRating
  );

  const averageGradientPercent = calculateSlopeGradient(roadDistanceKm, delta);
  const estimatedTransitMinutes = estimateHillTransitMinutes(
    roadDistanceKm,
    delta,
    'two_wheeler'
  );

  return {
    origin,
    destination,
    straightDistanceKm,
    roadDistanceKm,
    elevationChangeMeters: delta,
    climbDirection: direction,
    averageGradientPercent,
    estimatedTransitMinutes,
    hillSteepnessFactor: 1.0 + (steepnessRating * 0.08) + (Math.abs(delta) / 1000 * 0.15),
  };
}

/**
 * Generates waypoints along the point-to-point route with elevation interpolation
 * Used for route visualization and simulated courier tracking
 */
export function generateRouteWaypoints(
  origin: GpsCoordinate,
  destination: GpsCoordinate,
  steps: number = 12
): Array<GpsCoordinate & { stepIndex: number; progressPercent: number }> {
  const points: Array<GpsCoordinate & { stepIndex: number; progressPercent: number }> = [];
  const startAlt = origin.elevationMeters ?? 920;
  const endAlt = destination.elevationMeters ?? 920;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Add realistic hill switchback curve jitter
    const curveOffset = Math.sin(t * Math.PI) * 0.0028;
    const lat = origin.lat + (destination.lat - origin.lat) * t + curveOffset * 0.5;
    const lng = origin.lng + (destination.lng - origin.lng) * t - curveOffset * 0.8;
    const elevationMeters = Math.round(startAlt + (endAlt - startAlt) * t);

    points.push({
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      elevationMeters,
      stepIndex: i,
      progressPercent: Math.round(t * 100),
    });
  }

  return points;
}
