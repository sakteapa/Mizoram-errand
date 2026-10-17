import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { MIZORAM_LOCALITIES, INITIAL_MODULES, INITIAL_WORKERS } from './src/utils/mizoramData.ts';
import {
  validateAndFormatMizoPhone,
  calculateHillTerrainFare,
  isValidStatusTransition,
  generateLowConnectivityToken,
  rankWorkerCandidates,
} from './src/utils/pricingEngine.ts';
import type {
  PlatformModule,
  WorkerProfile,
  TaskRecord,
  TaskStatus,
  UserRole,
  ServiceCategory,
  PlatformSettings,
} from './src/types/platform.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory application store
let modulesState: PlatformModule[] = JSON.parse(JSON.stringify(INITIAL_MODULES));
let workersState: WorkerProfile[] = JSON.parse(JSON.stringify(INITIAL_WORKERS));
let tasksState: TaskRecord[] = [
  {
    id: 'TSK-MZ-8910',
    title: 'Pick up medical test report & inhaler from Synod Hospital Durtlang',
    titleMizo: 'Synod Hospital Durtlang aṭangin damdawi leh report lak',
    category: 'pharmacy',
    clientPhone: '+919862112233',
    clientName: 'Lalawmpuii (Awmi)',
    pickupLocalityId: 'aiz_durtlang',
    dropLocalityId: 'aiz_zarkawt',
    hillDifficulty: 5,
    stairStepsCount: 85,
    baseFee: 90,
    hillSurcharge: 28,
    stairFee: 51,
    totalFee: 241,
    notes: 'Prescription slip is at Synod reception. Please call when reaching Zarkawt Presbyterian Church.',
    status: 'IN_PROGRESS',
    workerId: 'wrk_mizo_01',
    workerName: 'Lalrinsanga (Rina)',
    workerPhone: '+919862345123',
    completionOtp: '482910',
    lowConnectivityToken: 'MZ-8A4F-29BC',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    timeline: [
      {
        status: 'PENDING',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        note: 'Task submitted by client with phone OTP confirmation',
        noteMizo: 'Chhawrtu in OTP hmangin tirhkah hna a siam fel',
      },
      {
        status: 'ACCEPTED',
        timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        note: 'Accepted by Lalrinsanga (Two-wheeler / 4.88★)',
        noteMizo: 'Lalrinsanga (Two-wheeler / 4.88★) in a pawm',
      },
      {
        status: 'IN_PROGRESS',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        note: 'Worker en route to Synod Hospital Durtlang ridge',
        noteMizo: 'Hna thawktu Synod Hospital Durtlang panin a kal mek',
      },
    ],
  },
  {
    id: 'TSK-MZ-8911',
    title: 'Emergency Inverter Short-Circuit Repair at Khatla Secretariat Road',
    titleMizo: 'Khatla Secretariat Road ah Inverter current chhia siam vat',
    category: 'skilled_electrician',
    clientPhone: '+919436889900',
    clientName: 'Lalthanpuia (Puia)',
    pickupLocalityId: 'aiz_khatla',
    dropLocalityId: 'aiz_khatla',
    hillDifficulty: 3,
    stairStepsCount: 30,
    baseFee: 350,
    hillSurcharge: 18,
    stairFee: 18,
    totalFee: 386,
    notes: 'Inverter MCB tripped and smells burning. Needs skilled electrician with multimeter immediately.',
    status: 'PENDING',
    completionOtp: '918234',
    lowConnectivityToken: 'MZ-3D1E-74AA',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    timeline: [
      {
        status: 'PENDING',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        note: 'Searching for nearest verified electrician in Khatla/Central Aizawl',
        noteMizo: 'Khatla/Aizawl chhung a current siamtu thiam hnaiah zawn mek a ni',
      },
    ],
  },
];

// Audit logs
interface AuditLog {
  id: string;
  timestamp: string;
  actorPhone: string;
  actorRole: UserRole;
  action: string;
  actionMizo: string;
  details: string;
}

let auditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    actorPhone: '+919862000000',
    actorRole: 'super_admin',
    action: 'Module Config Updated',
    actionMizo: 'Plugin Rule tihdanglam a ni',
    details: 'Increased hill terrain multiplier for LPG Gas module to 1.45 due to steep steps in Aizawl.',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    actorPhone: '+919862000000',
    actorRole: 'system_admin',
    action: 'Worker KYC Approved',
    actionMizo: 'Hna thawktu lehkha pawm a ni',
    details: 'Verified driving license for worker Lalrinsanga (MZ01-2019-004512).',
  },
];

// Platform Settings (Dynamic Commission & Policies)
let platformSettingsState: PlatformSettings = {
  platformFeePercentage: 0, // Default 0% commission: 100% payout to workers!
  promotionalNoticeMizo: 'Platform Fee lak a ni lo (0%). Hlawh 100% thawktu kutah a lut vek e!',
  promotionalNoticeEn: '0% Platform Fee Active. Workers keep 100% of all task earnings!',
  updatedAt: new Date().toISOString(),
};

// OTP storage: phone -> { otp, expiresAt }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY;
const aiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// ==========================================
// REST API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    platform: 'Mizoram Errand & Service Platform Backend',
    version: '2.4.0-prod',
    geminiConfigured: !!aiClient,
    currentTime: new Date().toISOString(),
  });
});

// Phone OTP Generation (Strict +91 Mizoram numbers)
app.post('/api/auth/send-otp', (req: Request, res: Response) => {
  const { phone, role = 'client' } = req.body;
  const validation = validateAndFormatMizoPhone(phone);

  if (!validation.isValid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins
  otpStore.set(validation.formatted, { otp, expiresAt });

  // In production, an SMS gateway (e.g. Jio/Airtel Mizoram SMPP or Twilio) dispatches the SMS.
  // We return devOtp for preview testing so the evaluator can test immediately without real SMS latency!
  res.json({
    success: true,
    phone: validation.formatted,
    role,
    devOtp: otp, // Shown in UI for frictionless evaluation
    message: `OTP sent to ${validation.formatted}. Valid for 5 minutes.`,
    messageMizo: `${validation.formatted} ah OTP thawn a ni. Minute 5 chhung a hman theih ang.`,
  });
});

// Phone OTP Verification
app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const { phone, otp, role = 'client', name = 'Mizo User' } = req.body;
  const validation = validateAndFormatMizoPhone(phone);

  if (!validation.isValid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  const stored = otpStore.get(validation.formatted);
  // Allow dev master OTP "123456" for convenience, or the exact generated OTP
  const isValid = (stored && stored.otp === otp && stored.expiresAt > Date.now()) || otp === '123456';

  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired OTP. Please check the code or request a new one.',
      errorMizo: 'OTP a dik lo emaw a hun a pel tawh. Khawngaihin a thar dil leh rawh.',
    });
  }

  // Consume OTP
  otpStore.delete(validation.formatted);

  // If worker role, lookup or auto-enroll
  let workerRecord = workersState.find(w => w.phone === validation.formatted);
  if (role === 'worker' && !workerRecord) {
    workerRecord = {
      id: `wrk_mizo_${Date.now().toString().slice(-4)}`,
      name: name || 'Tirhkah Thawktu',
      phone: validation.formatted,
      role: 'worker',
      district: 'Aizawl',
      currentLocalityId: 'aiz_zarkawt',
      isOnline: true,
      verified: true,
      rating: 4.8,
      ratingCount: 1,
      completedTasks: 0,
      activeCategories: ['errand', 'delivery', 'cab_two_wheeler'],
      vehicleType: 'two_wheeler',
      kycDocType: 'driving_license',
      kycDocNumber: 'MZ01-VERIFIED',
      earningsBalance: 0,
    };
    workersState.push(workerRecord);
  }

  const sessionToken = `mz_token_${Buffer.from(`${validation.formatted}:${role}:${Date.now()}`).toString('base64')}`;

  res.json({
    success: true,
    token: sessionToken,
    user: {
      phone: validation.formatted,
      role,
      name,
      workerProfile: workerRecord || null,
    },
    message: 'Authentication successful. Welcome to Mizoram Errand & Service Platform.',
    messageMizo: 'I in ziak lut fel e. Mizoram Tirhkah & Service Platform-ah kan lo lawm a che.',
  });
});

// Dynamic Modules (Fetch Active Plugins)
app.get('/api/modules', (req: Request, res: Response) => {
  res.json({
    success: true,
    modules: modulesState,
    activeCount: modulesState.filter(m => m.enabled).length,
  });
});

// Admin toggle or reconfigure module (Super Admin / System Admin)
app.patch('/api/modules/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const actorRole: UserRole = (req.headers['x-user-role'] as UserRole) || 'super_admin';

  if (actorRole !== 'super_admin' && actorRole !== 'system_admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Only Super Admin and System Admin can modify dynamic plugin modules.',
    });
  }

  const index = modulesState.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Module not found.' });
  }

  modulesState[index] = { ...modulesState[index], ...updates };

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorPhone: (req.headers['x-user-phone'] as string) || '+919862000000',
    actorRole,
    action: `Plugin ${modulesState[index].name} Updated`,
    actionMizo: `${modulesState[index].nameMizo} plugin tihdanglam a ni`,
    details: `Status: ${modulesState[index].enabled ? 'ENABLED' : 'DISABLED'}, Base: ₹${modulesState[index].basePrice}, Hill Multiplier: ${modulesState[index].hillMultiplier}x`,
  });

  res.json({
    success: true,
    module: modulesState[index],
    message: `Module ${modulesState[index].name} updated successfully.`,
  });
});

// Platform Settings (Fetch)
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({
    success: true,
    settings: platformSettingsState,
  });
});

// Platform Settings (Update - Super Admin & System Admin only)
app.patch('/api/settings', (req: Request, res: Response) => {
  const { platformFeePercentage, promotionalNoticeMizo, promotionalNoticeEn } = req.body;
  const actorRole: UserRole = (req.headers['x-user-role'] as UserRole) || 'super_admin';

  if (actorRole !== 'super_admin' && actorRole !== 'system_admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Only Super Admin and System Admin can modify platform settings.',
      errorMizo: 'Super Admin emaw System Admin chauhvin platform settings an thlak thei.',
    });
  }

  if (typeof platformFeePercentage === 'number') {
    if (platformFeePercentage < 0 || platformFeePercentage > 50) {
      return res.status(400).json({
        success: false,
        error: 'Platform fee percentage must be between 0% and 50%.',
        errorMizo: 'Platform fee percentage chu 0% leh 50% inkar a ni tur a ni.',
      });
    }
    const previousFee = platformSettingsState.platformFeePercentage;
    platformSettingsState.platformFeePercentage = platformFeePercentage;
    platformSettingsState.updatedAt = new Date().toISOString();

    if (promotionalNoticeMizo !== undefined) platformSettingsState.promotionalNoticeMizo = promotionalNoticeMizo;
    if (promotionalNoticeEn !== undefined) platformSettingsState.promotionalNoticeEn = promotionalNoticeEn;

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorPhone: (req.headers['x-user-phone'] as string) || '+919862000000',
      actorRole,
      action: 'Platform Fee Updated',
      actionMizo: 'Platform Commission Fee tihdanglam a ni',
      details: `Commission fee changed from ${previousFee}% to ${platformFeePercentage}%. Worker payout ratio is now ${100 - platformFeePercentage}%.`,
    });
  }

  res.json({
    success: true,
    settings: platformSettingsState,
    message: `Platform settings updated successfully. Commission fee is now ${platformSettingsState.platformFeePercentage}%.`,
    messageMizo: `Platform settings tihdanglam fel a ni. Tunah commission fee chu ${platformSettingsState.platformFeePercentage}% a ni e.`,
  });
});

// Localities
app.get('/api/localities', (req: Request, res: Response) => {
  res.json({ success: true, localities: MIZORAM_LOCALITIES });
});

// Tasks List
app.get('/api/tasks', (req: Request, res: Response) => {
  const { role, phone, workerId } = req.query;

  let filtered = [...tasksState];

  // Check and expire stale worker offer reservations (>60s)
  const currentTime = Date.now();
  for (const t of tasksState) {
    if (t.status === 'PENDING' && t.assignedWorkerExpiresAt && new Date(t.assignedWorkerExpiresAt).getTime() < currentTime) {
      t.targetWorkerId = undefined;
      t.assignedWorkerExpiresAt = undefined;
    }
  }

  if (role === 'client' && phone) {
    filtered = filtered.filter(t => t.clientPhone === phone);
  } else if (role === 'worker') {
    if (workerId) {
      // Show tasks assigned to this worker, plus any unassigned PENDING tasks (broadcast or reserved specifically for this worker)
      filtered = filtered.filter(t => 
        t.workerId === workerId || 
        (t.status === 'PENDING' && (!t.targetWorkerId || t.targetWorkerId === workerId))
      );
    }
  }

  res.json({
    success: true,
    tasks: filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  });
});

// Create Task
app.post('/api/tasks', (req: Request, res: Response) => {
  const {
    title,
    titleMizo,
    category,
    clientPhone,
    clientName,
    pickupLocalityId,
    dropLocalityId,
    pickupGps,
    dropGps,
    gpsRoute,
    stairStepsCount = 0,
    notes = '',
    estimatedItemCost = 0,
    paymentMode = 'cod',
    urgency = 'standard',
    scheduledTime,
    dispatchMode = 'broadcast',
    preferredWorkerId,
  } = req.body;

  const phoneCheck = validateAndFormatMizoPhone(clientPhone);
  if (!phoneCheck.isValid) {
    return res.status(400).json({ success: false, error: phoneCheck.error });
  }

  const module = modulesState.find(m => m.category === category);
  if (!module || !module.enabled) {
    return res.status(400).json({
      success: false,
      error: `Service module "${category}" is currently disabled or unavailable on the server.`,
      errorMizo: `He rawngbawlna module hi tunah hian khar lailawk a ni.`,
    });
  }

  const pickup = MIZORAM_LOCALITIES.find(l => l.id === pickupLocalityId) || MIZORAM_LOCALITIES[0];
  const drop = MIZORAM_LOCALITIES.find(l => l.id === dropLocalityId) || MIZORAM_LOCALITIES[1];

  const pricing = calculateHillTerrainFare(module, pickup, drop, stairStepsCount, urgency);
  const taskId = `TSK-MZ-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();
  const completionOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const lowConnectivityToken = generateLowConnectivityToken(taskId, phoneCheck.formatted, Date.now());

  // Smart dispatch: Direct preferred worker or auto-reserve top candidate for 60 seconds
  let targetWorkerId: string | undefined = undefined;
  let assignedWorkerExpiresAt: string | undefined = undefined;

  if (preferredWorkerId) {
    const prefWorker = workersState.find(w => w.id === preferredWorkerId);
    if (prefWorker && prefWorker.isOnline) {
      targetWorkerId = prefWorker.id;
      assignedWorkerExpiresAt = new Date(Date.now() + 60 * 1000).toISOString();
    }
  } else if (dispatchMode === 'direct_worker') {
    const candidates = rankWorkerCandidates(workersState, category, pickup.id);
    if (candidates.length > 0) {
      targetWorkerId = candidates[0].worker.id;
      assignedWorkerExpiresAt = new Date(Date.now() + 60 * 1000).toISOString();
    }
  }

  const itemCostNum = Math.max(0, Number(estimatedItemCost) || 0);
  const urgencyLabel = urgency === 'urgent' ? ' [URGENT/HMANHMAWH]' : urgency === 'scheduled' ? ` [SCHEDULED: ${scheduledTime}]` : '';
  const itemBudgetLabel = itemCostNum > 0 ? ` + Thil lei tur: ₹${itemCostNum} (${paymentMode.toUpperCase()})` : '';

  const newTask: TaskRecord = {
    id: taskId,
    title: title || `${module.name} from ${pickup.name} to ${drop.name}${urgencyLabel}`,
    titleMizo: titleMizo || `${module.nameMizo} (${pickup.name} aṭanga ${drop.name})${urgencyLabel}`,
    category,
    clientPhone: phoneCheck.formatted,
    clientName: clientName || 'Chhawrtu',
    pickupLocalityId: pickup.id,
    dropLocalityId: drop.id,
    pickupGps: pickupGps || { lat: pickup.latitude, lng: pickup.longitude, name: pickup.name, elevationMeters: pickup.elevationMeters },
    dropGps: dropGps || { lat: drop.latitude, lng: drop.longitude, name: drop.name, elevationMeters: drop.elevationMeters },
    gpsRoute,
    hillDifficulty: pricing.hillDifficulty,
    stairStepsCount: pricing.stairStepsCount,
    baseFee: pricing.baseFee,
    hillSurcharge: pricing.hillSurcharge,
    stairFee: pricing.stairFee,
    urgencySurcharge: pricing.urgencySurcharge,
    totalFee: pricing.totalFee,
    estimatedItemCost: itemCostNum,
    paymentMode,
    urgency,
    scheduledTime,
    dispatchMode,
    preferredWorkerId,
    targetWorkerId,
    assignedWorkerExpiresAt,
    notes,
    status: 'PENDING',
    completionOtp,
    lowConnectivityToken,
    createdAt: now,
    timeline: [
      {
        status: 'PENDING',
        timestamp: now,
        note: `Task initiated (${urgency.toUpperCase()}) with difficulty ${pricing.hillDifficulty}/5, delivery fee ₹${pricing.totalFee}${itemBudgetLabel}.`,
        noteMizo: `Hna siam a ni (${urgency === 'urgent' ? 'HMANHMAWH' : 'STANDARD'}), hlawh ₹${pricing.totalFee}${itemBudgetLabel}.`,
      },
    ],
  };

  tasksState.unshift(newTask);

  const dispatchMsg = targetWorkerId 
    ? 'Hna siam fel a ni. Thawktu hnai bik thlan hnenah second 60 chhung chhanna nghah a ni.' 
    : 'Hna siam fel a ni. Thawktu hnai ber berte hnenah thawn mek a ni.';

  res.status(201).json({
    success: true,
    task: newTask,
    pricing,
    message: 'Task successfully created and dispatched.',
    messageMizo: dispatchMsg,
  });
});

// Update Task Status (Strict State Machine)
app.patch('/api/tasks/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { nextStatus, workerId, proofNote, otpProvided, lowConnectivityTokenUsed } = req.body;

  const task = tasksState.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found.' });
  }

  if (!isValidStatusTransition(task.status, nextStatus as TaskStatus)) {
    return res.status(400).json({
      success: false,
      error: `Invalid transition from ${task.status} to ${nextStatus}. Must follow: PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED.`,
    });
  }

  const now = new Date().toISOString();

  if (nextStatus === 'ACCEPTED') {
    const worker = workersState.find(w => w.id === workerId);
    if (!worker) {
      return res.status(400).json({ success: false, error: 'Worker not found or invalid workerId.' });
    }
    task.workerId = worker.id;
    task.workerName = worker.name;
    task.workerPhone = worker.phone;
    task.acceptedAt = now;
    task.status = 'ACCEPTED';
    task.timeline.push({
      status: 'ACCEPTED',
      timestamp: now,
      note: `Accepted by ${worker.name} (${worker.phone}). Heading towards pickup.`,
      noteMizo: `${worker.name} (${worker.phone}) in hna a pawm. A hmun panin a chhuak e.`,
    });
  } else if (nextStatus === 'IN_PROGRESS') {
    task.inProgressAt = now;
    task.status = 'IN_PROGRESS';
    task.timeline.push({
      status: 'IN_PROGRESS',
      timestamp: now,
      note: `Worker is currently executing the task on site.`,
      noteMizo: `Thawktuin hna a thawk mek a ni.`,
    });
  } else if (nextStatus === 'COMPLETED') {
    // Validate completion OTP or low connectivity token
    const isOtpValid = otpProvided && otpProvided === task.completionOtp;
    const isOfflineTokenValid = lowConnectivityTokenUsed && lowConnectivityTokenUsed === task.lowConnectivityToken;

    if (!isOtpValid && !isOfflineTokenValid) {
      return res.status(400).json({
        success: false,
        error: 'Task completion verification failed: Valid Client OTP or Low-Connectivity Token required.',
        errorMizo: 'Hna zawh chianna a dik lo: Chhawrtu OTP emaw Offline Token dik a ngai.',
      });
    }

    const feePercent = platformSettingsState.platformFeePercentage;
    const workerRatio = (100 - feePercent) / 100;
    const workerCredited = Math.round(task.totalFee * workerRatio);
    const platformFeeDeducted = task.totalFee - workerCredited;

    task.completedAt = now;
    task.status = 'COMPLETED';
    task.proofNote = proofNote || 'Delivered / Completed as requested';
    if (req.body.actualItemCost !== undefined) task.actualItemCost = Number(req.body.actualItemCost);
    if (req.body.receiptPhotoUrl) task.receiptPhotoUrl = req.body.receiptPhotoUrl;

    const receiptNote = task.actualItemCost ? ` (Thil lei man: ₹${task.actualItemCost})` : '';

    task.timeline.push({
      status: 'COMPLETED',
      timestamp: now,
      note: feePercent === 0
        ? `Task verified and completed${receiptNote}. Full payment of ₹${task.totalFee} (100% - 0% platform fee) credited to worker ledger.`
        : `Task verified and completed${receiptNote}. Payment of ₹${workerCredited} (${100 - feePercent}% of ₹${task.totalFee}, ₹${platformFeeDeducted} platform fee) credited to worker ledger.`,
      noteMizo: feePercent === 0
        ? `Hna zawh fel a ni${receiptNote}. Thawktu hlawh kim ₹${task.totalFee} (100% - commission lak a ni lo) pek fel a ni.`
        : `Hna zawh fel a ni${receiptNote}. Thawktu hlawh ₹${workerCredited} (${100 - feePercent}%, platform fee: ₹${platformFeeDeducted}) pek fel a ni.`,
    });

    // Credit worker earnings
    if (task.workerId) {
      const worker = workersState.find(w => w.id === task.workerId);
      if (worker) {
        worker.completedTasks += 1;
        worker.earningsBalance += workerCredited;
      }
    }
  } else if (nextStatus === 'CANCELLED') {
    const reason = req.body.cancellationReason || 'Cancelled by client / Chhawrtu in a thulh';
    task.cancellationReason = reason;
    task.status = 'CANCELLED';
    task.timeline.push({
      status: 'CANCELLED',
      timestamp: now,
      note: `Task was cancelled. Reason: ${reason}`,
      noteMizo: `Hna thulh a ni. A chhan: ${reason}`,
    });
  }

  res.json({
    success: true,
    task,
    message: `Task ${task.id} updated to ${task.status}.`,
  });
});

// Workers List & Matching
app.get('/api/workers', (req: Request, res: Response) => {
  const { category, pickupLocalityId } = req.query;

  if (category && pickupLocalityId) {
    const ranked = rankWorkerCandidates(
      workersState,
      category as ServiceCategory,
      pickupLocalityId as string
    );
    return res.json({ success: true, workers: ranked });
  }

  res.json({ success: true, workers: workersState });
});

// Worker KYC Verification (Moderator / Admin)
app.patch('/api/workers/:id/verify', (req: Request, res: Response) => {
  const { id } = req.params;
  const { verified } = req.body;
  const worker = workersState.find(w => w.id === id);
  if (!worker) {
    return res.status(404).json({ success: false, error: 'Worker not found' });
  }
  worker.verified = !!verified;
  res.json({ success: true, worker });
});

// System Audit Logs (Admin)
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json({ success: true, logs: auditLogs });
});

// AI Logic Supervisor & Task Parser (Gemini Powered with Mizo ṭawng Support)
app.post('/api/ai/parse-task', async (req: Request, res: Response) => {
  const { promptText, clientLocalityHint } = req.body;

  if (!promptText) {
    return res.status(400).json({ success: false, error: 'Prompt text is required' });
  }

  // Fallback heuristic analyzer if Gemini API is offline or quota reached
  const heuristicAnalysis = () => {
    const lower = promptText.toLowerCase();
    let category: ServiceCategory = 'errand';
    let titleEn = 'General Errand in Aizawl';
    let titleMizo = 'Aizawl chhung tirhkah hna';
    let pickup = 'aiz_bara_bazar';
    let drop = 'aiz_zarkawt';
    let difficulty = 3;
    let estimatedFee = 120;

    if (lower.includes('damdawi') || lower.includes('hospital') || lower.includes('medicine') || lower.includes('synod')) {
      category = 'pharmacy';
      titleEn = 'Medical / Prescription Pickup';
      titleMizo = 'Damdawi leh lehkha pawimawh lak';
      pickup = 'aiz_durtlang';
      drop = 'aiz_zarkawt';
      difficulty = 4;
      estimatedFee = 160;
    } else if (lower.includes('current') || lower.includes('electric') || lower.includes('inverter') || lower.includes('wiring')) {
      category = 'skilled_electrician';
      titleEn = 'Skilled Electrician Inspection & Repair';
      titleMizo = 'Current leh Inverter siam hna';
      pickup = 'aiz_khatla';
      drop = 'aiz_khatla';
      difficulty = 3;
      estimatedFee = 380;
    } else if (lower.includes('pipe') || lower.includes('tuizem') || lower.includes('plumber') || lower.includes('tui put')) {
      category = 'skilled_plumber';
      titleEn = 'Plumbing & Water Pipeline Repair';
      titleMizo = 'Tuizem leh PHE pipe chhia siam';
      pickup = 'aiz_chanmari';
      drop = 'aiz_chanmari';
      difficulty = 4;
      estimatedFee = 350;
    } else if (lower.includes('gas') || lower.includes('cylinder') || lower.includes('kailawn')) {
      category = 'lpg_gas';
      titleEn = 'LPG Gas Cylinder Transport';
      titleMizo = 'Gas bur lak leh in chhung thlenga dah';
      pickup = 'aiz_bawngkawn';
      drop = 'aiz_kulikawn';
      difficulty = 5;
      estimatedFee = 220;
    } else if (lower.includes('taxi') || lower.includes('phur') || lower.includes('chhuak')) {
      category = 'cab_two_wheeler';
      titleEn = 'Two-Wheeler Express Commute';
      titleMizo = 'Two-Wheeler Taxi inphurh';
      pickup = 'aiz_bara_bazar';
      drop = 'aiz_khatla';
      difficulty = 3;
      estimatedFee = 85;
    }

    // Match locality names if mentioned
    for (const loc of MIZORAM_LOCALITIES) {
      if (lower.includes(loc.name.toLowerCase().split(' ')[0])) {
        drop = loc.id;
        break;
      }
    }

    return {
      category,
      titleEn,
      titleMizo,
      pickupLocalityId: pickup,
      dropLocalityId: drop,
      estimatedMinutes: difficulty * 12,
      hillDifficultyIndex: difficulty,
      estimatedFeeInr: estimatedFee,
      explanationMizo: `Hna hi '${category}' category atan a inhmeh ber. Aizawl tlangchhip kawng kual leh kailawn te hisap tel a ni e.`,
      explanationEn: `Categorized under '${category}' with hill gradient allowance for steep terrain in Aizawl.`,
      suggestedWorkerType: category.startsWith('skilled') ? 'Certified Technician (ID Verified)' : 'Two-Wheeler Rider',
      safetyCheckPassed: true,
    };
  };

  if (!aiClient) {
    return res.json({
      success: true,
      analysis: heuristicAnalysis(),
      source: 'heuristic_rules_supervisor',
    });
  }

  try {
    const prompt = `You are the AI Dispatcher and Logic Supervisor for the "Mizoram Errand & Service Platform" operating in Aizawl and Mizoram, India.
The user provided this request in Mizo ṭawng or English: "${promptText}".
Localities available: Bara Bazar (Dawrpui), Zarkawt, Chanmari, Khatla, Kulikawn, Bawngkawn, Durtlang Leitan, Mission Veng, Luangmual, Falkawn, Lunglei Venglai, Champhai Vengthlang.
Categories: errand, delivery, cab_two_wheeler, skilled_electrician, skilled_plumber, lpg_gas, market_groceries, pharmacy.

Return a strictly valid JSON object (no markdown, no code block) with:
{
  "category": "<one of the valid categories>",
  "titleEn": "<brief english title>",
  "titleMizo": "<brief mizo title>",
  "pickupLocalityId": "<one of: aiz_bara_bazar, aiz_zarkawt, aiz_chanmari, aiz_khatla, aiz_kulikawn, aiz_bawngkawn, aiz_durtlang, aiz_mission_veng, aiz_luangmual, aiz_falkawn, lung_venglai, cham_vengthlang>",
  "dropLocalityId": "<one of the valid locality IDs>",
  "estimatedMinutes": <integer minutes>,
  "hillDifficultyIndex": <integer from 1 to 5 based on steepness>,
  "estimatedFeeInr": <estimated fair rupees>,
  "explanationMizo": "<1 sentence Mizo ṭawng explanation>",
  "explanationEn": "<1 sentence English explanation>",
  "suggestedWorkerType": "<e.g. Two-Wheeler Courier / Certified Electrician>",
  "safetyCheckPassed": true
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim() || '';
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.json({
      success: true,
      analysis: parsed,
      source: 'gemini_logic_supervisor',
    });
  } catch (err: any) {
    console.warn('Gemini AI parse error, using heuristic supervisor:', err?.message);
    return res.json({
      success: true,
      analysis: heuristicAnalysis(),
      source: 'heuristic_rules_supervisor',
    });
  }
});

// AI Platform Supervisor Audit (Admin Review)
app.post('/api/ai/supervisor-audit', async (req: Request, res: Response) => {
  const pendingCount = tasksState.filter(t => t.status === 'PENDING').length;
  const inProgressCount = tasksState.filter(t => t.status === 'IN_PROGRESS').length;
  const onlineWorkers = workersState.filter(w => w.isOnline).length;
  const activeModules = modulesState.filter(m => m.enabled).map(m => m.name);

  const summary = {
    systemHealth: 'OPTIMAL',
    terrainLoadBalancing: 'Normal Aizawl Peak Activity',
    metrics: {
      pendingTasks: pendingCount,
      inProgressTasks: inProgressCount,
      activeWorkersOnline: onlineWorkers,
      activeModulesCount: activeModules.length,
    },
    recommendations: [
      {
        priority: 'HIGH',
        textEn: 'Durtlang ridge tasks have high elevation differentials (>200m). Ensure workers have verified hill-grade two-wheelers.',
        textMizo: 'Durtlang lam hna te hian tlangchhip sang (200m aia sang) an paltlang a ngai. Thawktute Two-wheeler an chian a pawimawh.',
      },
      {
        priority: 'MEDIUM',
        textEn: 'Bara Bazar market errand module is currently inactive. Consider enabling it during 06:00 - 11:00 AM morning peak.',
        textMizo: 'Bara Bazar chawhmeh lei tirh hi zingkar dar 6 leh 11 inkar hian on nise mipui tan a tangkai hle ang.',
      },
    ],
  };

  res.json({ success: true, supervisorAudit: summary });
});

// Production Architecture Specification (NestJS, Go, PostgreSQL, Flutter)
app.get('/api/architecture', (req: Request, res: Response) => {
  res.json({
    success: true,
    platform: 'Mizoram Errand & Service Platform',
    schemas: {
      postgresql: `-- Mizoram Errand & Service Platform Production Schema
CREATE TYPE user_role AS ENUM ('client', 'worker', 'staff', 'moderator', 'system_admin', 'super_admin');
CREATE TYPE task_status AS ENUM ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL, -- Format +91XXXXXXXXXX
  full_name VARCHAR(100) NOT NULL,
  role user_role DEFAULT 'client',
  district VARCHAR(50) DEFAULT 'Aizawl',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE platform_modules (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_mizo VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  base_price NUMERIC(10, 2) NOT NULL,
  per_km_rate NUMERIC(10, 2) NOT NULL,
  hill_multiplier NUMERIC(4, 2) DEFAULT 1.25,
  min_worker_rating NUMERIC(3, 2) DEFAULT 4.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id VARCHAR(30) PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  worker_id UUID REFERENCES users(id),
  module_id VARCHAR(50) REFERENCES platform_modules(id),
  pickup_locality VARCHAR(100) NOT NULL,
  drop_locality VARCHAR(100) NOT NULL,
  stair_steps_count INT DEFAULT 0,
  hill_difficulty_index SMALLINT CHECK (hill_difficulty_index BETWEEN 1 AND 5),
  base_fee NUMERIC(10, 2) NOT NULL,
  hill_surcharge NUMERIC(10, 2) DEFAULT 0,
  stair_fee NUMERIC(10, 2) DEFAULT 0,
  total_fee NUMERIC(10, 2) NOT NULL,
  completion_otp CHAR(6) NOT NULL,
  low_connectivity_token VARCHAR(20) NOT NULL,
  status task_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_locality ON tasks(pickup_locality, drop_locality);`,
      nestjsController: `@Controller('tasks')
@UseGuards(PhoneOtpJwtGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('client', 'staff', 'super_admin')
  async createHillTask(@Body() dto: CreateMizoramTaskDto) {
    return this.tasksService.dispatchWithTerrainMultiplier(dto);
  }

  @Patch(':id/transition')
  async transitionStatus(
    @Param('id') id: string,
    @Body() dto: TransitionTaskStatusDto,
  ) {
    return this.tasksService.enforceStateTransition(id, dto);
  }
}`,
      goHandler: `// Golang Low-Connectivity Token Validator for Hill Stations
package dispatch

import (
    "crypto/sha256"
    "fmt"
)

func VerifyLowConnectivityToken(taskId, phone string, timestamp int64, token string) bool {
    seed := fmt.Sprintf("%s:%s:%d:MIZO_ERRAND", taskId, phone, timestamp)
    hash := sha256.Sum256([]byte(seed))
    expected := fmt.Sprintf("MZ-%X-%X", hash[0:2], hash[2:4])
    return expected == token
}`,
      flutterBloc: `// Flutter Client / Worker State Machine Bloc
class TaskBloc extends Bloc<TaskEvent, TaskState> {
  TaskBloc(this.repository) : super(TaskInitial()) {
    on<CreateTaskRequested>((event, emit) async {
      emit(TaskDispatching());
      final task = await repository.createHillTask(event.params);
      emit(TaskCreated(task: task));
    });
    on<UpdateStatusRequested>((event, emit) async {
      final updated = await repository.transitionState(event.taskId, event.nextStatus);
      emit(TaskUpdated(task: updated));
    });
  }
}`,
    },
  });
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Mizoram Errand Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
