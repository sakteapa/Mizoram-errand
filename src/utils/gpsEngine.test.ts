import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHaversineDistance,
  calculateHillRoadDistance,
  calculateElevationDelta,
  calculateSlopeGradient,
  estimateHillTransitMinutes,
  findNearestLocality,
  computePointToPointRoute,
  generateRouteWaypoints,
} from './gpsEngine.ts';
import type { GpsCoordinate, MizoramLocality } from '../types/platform.ts';

test('calculateHaversineDistance computes accurate GPS distance', () => {
  // Bara Bazar (23.7335, 92.7176) to Zarkawt (23.7381, 92.7188)
  const distKm = calculateHaversineDistance(23.7335, 92.7176, 23.7381, 92.7188);
  assert.ok(distKm > 0.4 && distKm < 0.7, `Expected ~0.53km, got ${distKm}`);

  // Same coordinates should be 0
  assert.equal(calculateHaversineDistance(23.7335, 92.7176, 23.7335, 92.7176), 0);
});

test('calculateHillRoadDistance accounts for winding switchbacks and hill steepness', () => {
  const straight = 1.0;
  const roadDist = calculateHillRoadDistance(straight, 150, 4);
  // Should be greater than straight line due to hill winding
  assert.ok(roadDist > 1.4 && roadDist < 1.7, `Expected road dist > 1.4km, got ${roadDist}`);
});

test('calculateElevationDelta detects uphill, downhill, and ridge level', () => {
  const uphill = calculateElevationDelta(850, 1150);
  assert.equal(uphill.delta, 300);
  assert.equal(uphill.direction, 'uphill');

  const downhill = calculateElevationDelta(1150, 850);
  assert.equal(downhill.delta, -300);
  assert.equal(downhill.direction, 'downhill');

  const level = calculateElevationDelta(940, 950);
  assert.equal(level.direction, 'ridge_level');
});

test('calculateSlopeGradient calculates percentage grade correctly', () => {
  // 100m rise over 1km (1000m) road = 10%
  const grad = calculateSlopeGradient(1.0, 100);
  assert.equal(grad, 10.0);
});

test('findNearestLocality identifies closest Aizawl landmark', () => {
  const dummyLocalities: MizoramLocality[] = [
    {
      id: 'aiz_bara_bazar',
      name: 'Bara Bazar',
      district: 'Aizawl',
      elevationMeters: 920,
      steepnessRating: 4,
      popularLandmarks: [],
      latitude: 23.7335,
      longitude: 92.7176,
    },
    {
      id: 'aiz_durtlang',
      name: 'Durtlang',
      district: 'Aizawl',
      elevationMeters: 1150,
      steepnessRating: 5,
      popularLandmarks: [],
      latitude: 23.7820,
      longitude: 92.7410,
    },
  ];

  // Coordinates very close to Bara Bazar
  const result = findNearestLocality(23.7340, 92.7180, dummyLocalities);
  assert.equal(result.locality.id, 'aiz_bara_bazar');
  assert.ok(result.distanceKm < 0.2);
});

test('computePointToPointRoute returns a complete route specification', () => {
  const origin: GpsCoordinate = { lat: 23.7335, lng: 92.7176, elevationMeters: 920, name: 'Bara Bazar' };
  const destination: GpsCoordinate = { lat: 23.7820, lng: 92.7410, elevationMeters: 1150, name: 'Durtlang' };

  const route = computePointToPointRoute(origin, destination, 5);
  assert.ok(route.straightDistanceKm > 4 && route.straightDistanceKm < 7);
  assert.ok(route.roadDistanceKm > route.straightDistanceKm);
  assert.equal(route.elevationChangeMeters, 230);
  assert.equal(route.climbDirection, 'uphill');
  assert.ok(route.estimatedTransitMinutes >= 15);
});

test('generateRouteWaypoints creates interpolated coordinates with progress', () => {
  const origin: GpsCoordinate = { lat: 23.7335, lng: 92.7176, elevationMeters: 920 };
  const destination: GpsCoordinate = { lat: 23.7820, lng: 92.7410, elevationMeters: 1150 };

  const waypoints = generateRouteWaypoints(origin, destination, 6);
  assert.equal(waypoints.length, 7);
  assert.equal(waypoints[0].progressPercent, 0);
  assert.equal(waypoints[6].progressPercent, 100);
});
