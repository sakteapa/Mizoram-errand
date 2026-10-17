import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAndFormatMizoPhone,
  calculateHillTerrainFare,
  isValidStatusTransition,
  generateLowConnectivityToken,
  rankWorkerCandidates,
} from './pricingEngine.ts';
import type { PlatformModule, MizoramLocality, WorkerProfile } from '../types/platform.ts';

test('validateAndFormatMizoPhone accepts valid 10-digit Indian/Mizoram numbers', () => {
  const res1 = validateAndFormatMizoPhone('9862345123');
  assert.equal(res1.isValid, true);
  assert.equal(res1.formatted, '+919862345123');

  const res2 = validateAndFormatMizoPhone('+91 9436 128 765');
  assert.equal(res2.isValid, true);
  assert.equal(res2.formatted, '+919436128765');

  const res3 = validateAndFormatMizoPhone('08794567890');
  assert.equal(res3.isValid, true);
  assert.equal(res3.formatted, '+918794567890');
});

test('validateAndFormatMizoPhone rejects invalid phone formats and non-numeric entries', () => {
  assert.equal(validateAndFormatMizoPhone('12345').isValid, false);
  assert.equal(validateAndFormatMizoPhone('abc1234567').isValid, false);
  assert.equal(validateAndFormatMizoPhone('4123456789').isValid, false); // Doesn't start with 6-9
  assert.equal(validateAndFormatMizoPhone('').isValid, false);
});

test('calculateHillTerrainFare computes steep terrain surcharge and concrete stair fees', () => {
  const dummyModule: PlatformModule = {
    id: 'mod_errands',
    name: 'General Errand',
    nameMizo: 'Tirhkah',
    category: 'errand',
    description: 'Errand',
    descriptionMizo: 'Tirhkah',
    iconName: 'Package',
    enabled: true,
    basePrice: 70,
    perKmRate: 15,
    hillMultiplier: 1.25,
    requiredKyc: true,
    minWorkerRating: 4.0,
    version: '1.0.0',
  };

  const baraBazar: MizoramLocality = {
    id: 'aiz_bara_bazar',
    name: 'Bara Bazar',
    district: 'Aizawl',
    elevationMeters: 920,
    steepnessRating: 4,
    popularLandmarks: ['Millennium Centre'],
    latitude: 23.7335,
    longitude: 92.7176,
  };

  const durtlang: MizoramLocality = {
    id: 'aiz_durtlang',
    name: 'Durtlang',
    district: 'Aizawl',
    elevationMeters: 1150,
    steepnessRating: 5,
    popularLandmarks: ['Synod Hospital'],
    latitude: 23.7845,
    longitude: 92.7342,
  };

  const resultWithSteps = calculateHillTerrainFare(dummyModule, baraBazar, durtlang, 120);

  assert.equal(resultWithSteps.baseFee, 70);
  assert.equal(resultWithSteps.elevationDeltaMeters, 230);
  assert.equal(resultWithSteps.hillDifficulty, 5);
  assert.equal(resultWithSteps.stairStepsCount, 120);
  assert.equal(resultWithSteps.stairFee, 72); // 120 * 0.60
  assert.ok(resultWithSteps.hillSurcharge > 0);
  assert.ok(resultWithSteps.totalFee > resultWithSteps.baseFee + resultWithSteps.stairFee);
});

test('isValidStatusTransition strictly enforces task lifecycle', () => {
  assert.equal(isValidStatusTransition('PENDING', 'ACCEPTED'), true);
  assert.equal(isValidStatusTransition('ACCEPTED', 'IN_PROGRESS'), true);
  assert.equal(isValidStatusTransition('IN_PROGRESS', 'COMPLETED'), true);
  assert.equal(isValidStatusTransition('PENDING', 'CANCELLED'), true);
  assert.equal(isValidStatusTransition('ACCEPTED', 'CANCELLED'), true);

  // Invalid skip transitions
  assert.equal(isValidStatusTransition('PENDING', 'COMPLETED'), false);
  assert.equal(isValidStatusTransition('COMPLETED', 'PENDING'), false);
  assert.equal(isValidStatusTransition('CANCELLED', 'IN_PROGRESS'), false);
});

test('generateLowConnectivityToken creates an 8-hex fallback verification token', () => {
  const token = generateLowConnectivityToken('task_123', '+919862345123', 1700000000000);
  assert.match(token, /^MZ-[0-9A-F]{4}-[0-9A-F]{4}$/);
});

test('rankWorkerCandidates prioritizes verified, online workers in same locality', () => {
  const workers: WorkerProfile[] = [
    {
      id: 'w1',
      name: 'Rina',
      phone: '+919862000001',
      role: 'worker',
      district: 'Aizawl',
      currentLocalityId: 'aiz_zarkawt',
      isOnline: true,
      verified: true,
      rating: 4.9,
      ratingCount: 100,
      completedTasks: 200,
      activeCategories: ['errand'],
      vehicleType: 'two_wheeler',
      kycDocType: 'driving_license',
      kycDocNumber: 'MZ01',
      earningsBalance: 100,
    },
    {
      id: 'w2',
      name: 'Zoma',
      phone: '+919862000002',
      role: 'worker',
      district: 'Aizawl',
      currentLocalityId: 'aiz_khatla',
      isOnline: true,
      verified: true,
      rating: 4.8,
      ratingCount: 80,
      completedTasks: 50,
      activeCategories: ['errand'],
      vehicleType: 'two_wheeler',
      kycDocType: 'driving_license',
      kycDocNumber: 'MZ02',
      earningsBalance: 100,
    },
    {
      id: 'w3',
      name: 'Offline Worker',
      phone: '+919862000003',
      role: 'worker',
      district: 'Aizawl',
      currentLocalityId: 'aiz_zarkawt',
      isOnline: false,
      verified: true,
      rating: 5.0,
      ratingCount: 150,
      completedTasks: 300,
      activeCategories: ['errand'],
      vehicleType: 'two_wheeler',
      kycDocType: 'driving_license',
      kycDocNumber: 'MZ03',
      earningsBalance: 0,
    }
  ];

  const ranked = rankWorkerCandidates(workers, 'errand', 'aiz_zarkawt');
  // w3 is offline so excluded
  assert.equal(ranked.length, 2);
  // w1 is in aiz_zarkawt so gets proximity boost
  assert.equal(ranked[0].worker.id, 'w1');
  assert.ok(ranked[0].score > ranked[1].score);
});
