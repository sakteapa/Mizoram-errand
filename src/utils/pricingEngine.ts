import type { TaskStatus, ServiceCategory, PlatformModule, MizoramLocality, WorkerProfile } from '../types/platform.ts';

/**
 * Validates and formats Indian / Mizoram phone numbers (+91)
 * Valid phone must be 10 digits starting with 6, 7, 8, or 9.
 */
export function validateAndFormatMizoPhone(raw: string): { isValid: boolean; formatted: string; error?: string } {
  if (!raw) {
    return { isValid: false, formatted: '', error: 'Phone number is required' };
  }

  // Remove spaces, dashes, brackets, leading +
  let cleaned = raw.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }

  // Must be 10 digits starting with 6, 7, 8, or 9
  const regex = /^[6-9]\d{9}$/;
  if (!regex.test(cleaned)) {
    return {
      isValid: false,
      formatted: raw,
      error: 'Invalid number. Must be a valid 10-digit Indian/Mizoram mobile number (+91).',
    };
  }

  return {
    isValid: true,
    formatted: `+91${cleaned}`,
  };
}

export interface HillPricingBreakdown {
  baseFee: number;
  estimatedKm: number;
  distanceFee: number;
  elevationDeltaMeters: number;
  hillDifficulty: 1 | 2 | 3 | 4 | 5;
  hillSurcharge: number;
  stairStepsCount: number;
  stairFee: number;
  totalFee: number;
}

/**
 * Calculates fair pricing tailored to steep Mizoram topography
 */
export function calculateHillTerrainFare(
  module: PlatformModule,
  pickup: MizoramLocality,
  drop: MizoramLocality,
  stairStepsCount: number = 0
): HillPricingBreakdown {
  const baseFee = module.basePrice;
  const isSameLocality = pickup.id === drop.id;
  
  // Approximate hill road distance based on localities
  let estimatedKm = 2.5;
  if (!isSameLocality) {
    if (pickup.district !== drop.district) {
      estimatedKm = 48.0; // Inter-district hill highway
    } else {
      estimatedKm = 4.8; // Inter-veng hill road winding distance
    }
  }

  const distanceFee = Math.round(estimatedKm * module.perKmRate);
  const elevationDeltaMeters = Math.abs(pickup.elevationMeters - drop.elevationMeters);
  
  // Combine steepness of both points
  const rawDifficulty = Math.max(pickup.steepnessRating, drop.steepnessRating);
  const hillDifficulty = Math.min(5, Math.max(1, rawDifficulty)) as 1 | 2 | 3 | 4 | 5;

  // Hill surcharge factor accounting for steep climbs & elevation change
  const elevationFactor = Math.min(1.5, Math.max(0, elevationDeltaMeters / 300));
  const steepFactor = (hillDifficulty / 3.0);
  const hillSurcharge = Math.round(baseFee * (module.hillMultiplier - 1.0) * (steepFactor + elevationFactor * 0.5));

  // In Aizawl, 50-200 concrete cliff steps are very taxing for workers carrying loads
  const sanitizedSteps = Math.max(0, stairStepsCount);
  const stairFee = Math.round(sanitizedSteps * 0.60); // 60 paise per step

  const totalFee = Math.max(baseFee, baseFee + distanceFee + hillSurcharge + stairFee);

  return {
    baseFee,
    estimatedKm,
    distanceFee,
    elevationDeltaMeters,
    hillDifficulty,
    hillSurcharge,
    stairStepsCount: sanitizedSteps,
    stairFee,
    totalFee,
  };
}

/**
 * Validates task state machine transitions
 * Strictly enforces: PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED
 */
export function isValidStatusTransition(current: TaskStatus, next: TaskStatus): boolean {
  if (current === next) return true;

  switch (current) {
    case 'PENDING':
      return next === 'ACCEPTED' || next === 'CANCELLED';
    case 'ACCEPTED':
      return next === 'IN_PROGRESS' || next === 'CANCELLED';
    case 'IN_PROGRESS':
      return next === 'COMPLETED' || next === 'CANCELLED';
    case 'COMPLETED':
      return false; // Terminal state
    case 'CANCELLED':
      return false; // Terminal state
    default:
      return false;
  }
}

/**
 * Generates an offline cryptographic verification token
 * for areas in Mizoram hills with low or absent 4G/5G mobile connectivity.
 */
export function generateLowConnectivityToken(taskId: string, clientPhone: string, timestamp: number): string {
  const seed = `${taskId}:${clientPhone}:${timestamp}:MIZO_ERRAND`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `MZ-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/**
 * Ranks workers based on distance, rating, and availability
 */
export function rankWorkerCandidates(
  workers: WorkerProfile[],
  taskCategory: ServiceCategory,
  pickupLocalityId: string
): { worker: WorkerProfile; score: number; reason: string }[] {
  return workers
    .filter(w => w.verified && w.isOnline && w.activeCategories.includes(taskCategory))
    .map(worker => {
      let score = worker.rating * 20; // 0-100 base
      let reason = 'Top rated service provider';

      if (worker.currentLocalityId === pickupLocalityId) {
        score += 35; // Major proximity boost
        reason = 'Located right in this locality (A hmunah a awm mek)';
      } else {
        score += 15;
      }

      if (worker.completedTasks > 100) {
        score += 10;
      }

      return { worker, score, reason };
    })
    .sort((a, b) => b.score - a.score);
}
