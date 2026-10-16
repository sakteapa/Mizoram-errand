export type UserRole = 
  | 'client' 
  | 'worker' 
  | 'staff' 
  | 'moderator' 
  | 'system_admin' 
  | 'super_admin';

export type TaskStatus = 
  | 'PENDING' 
  | 'ACCEPTED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type ServiceCategory = 
  | 'errand' 
  | 'delivery' 
  | 'cab_two_wheeler' 
  | 'skilled_electrician' 
  | 'skilled_plumber' 
  | 'skilled_carpenter' 
  | 'lpg_gas' 
  | 'market_groceries' 
  | 'pharmacy';

export interface MizoramLocality {
  id: string;
  name: string;
  district: string;
  subdivision?: string;
  elevationMeters: number;
  steepnessRating: 1 | 2 | 3 | 4 | 5; // 1 = flat ridge, 5 = extreme hill stair climb
  popularLandmarks: string[];
}

export interface PlatformModule {
  id: string;
  name: string;
  nameMizo: string;
  category: ServiceCategory;
  description: string;
  descriptionMizo: string;
  iconName: string;
  enabled: boolean;
  basePrice: number;
  perKmRate: number;
  hillMultiplier: number;
  requiredKyc: boolean;
  minWorkerRating: number;
  version: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  phone: string;
  role: 'worker';
  district: string;
  currentLocalityId: string;
  isOnline: boolean;
  verified: boolean;
  rating: number;
  ratingCount: number;
  completedTasks: number;
  activeCategories: ServiceCategory[];
  vehicleType: 'foot_steps' | 'two_wheeler' | 'taxi_car' | 'pickup_truck';
  kycDocType: 'voter_id' | 'driving_license' | 'aadhaar';
  kycDocNumber: string;
  earningsBalance: number;
}

export interface TaskRecord {
  id: string;
  title: string;
  titleMizo: string;
  category: ServiceCategory;
  clientPhone: string;
  clientName: string;
  pickupLocalityId: string;
  dropLocalityId: string;
  hillDifficulty: 1 | 2 | 3 | 4 | 5;
  stairStepsCount: number;
  baseFee: number;
  hillSurcharge: number;
  stairFee: number;
  totalFee: number;
  notes?: string;
  status: TaskStatus;
  workerId?: string;
  workerName?: string;
  workerPhone?: string;
  completionOtp: string;
  lowConnectivityToken: string;
  createdAt: string;
  acceptedAt?: string;
  inProgressAt?: string;
  completedAt?: string;
  proofNote?: string;
  proofImageUrl?: string;
  timeline: {
    status: TaskStatus;
    timestamp: string;
    note: string;
    noteMizo: string;
  }[];
}

export interface AuthSession {
  phone: string;
  role: UserRole;
  name: string;
  token: string;
  expiresAt: number;
}

export interface AiTaskAnalysis {
  category: ServiceCategory;
  titleEn: string;
  titleMizo: string;
  pickupLocality: string;
  dropLocality: string;
  estimatedMinutes: number;
  hillDifficultyIndex: number;
  estimatedFeeInr: number;
  explanationMizo: string;
  explanationEn: string;
  suggestedWorkerType: string;
  safetyCheckPassed: boolean;
}
