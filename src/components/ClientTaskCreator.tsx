import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  MapPin, 
  TrendingUp, 
  Footprints, 
  ArrowRight, 
  CheckCircle, 
  Info, 
  Bike, 
  Star, 
  ShieldCheck,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Navigation,
  Zap,
  Clock,
  ShoppingBag,
  CreditCard,
  UserCheck,
  Calendar,
  Radio
} from 'lucide-react';
import { MIZORAM_LOCALITIES } from '../utils/mizoramData.ts';
import { calculateHillTerrainFare } from '../utils/pricingEngine.ts';
import { findNearestLocality } from '../utils/gpsEngine.ts';
import { PointToPointGpsMap } from './PointToPointGpsMap.tsx';
import { Rupee } from './CurrencySymbol.tsx';
import type { 
  PlatformModule, 
  ServiceCategory, 
  TaskRecord, 
  WorkerProfile,
  GpsCoordinate,
  PointToPointRoute,
  TaskUrgency,
  PaymentMode,
  DispatchMode
} from '../types/platform.ts';

interface ClientTaskCreatorProps {
  activeModule: PlatformModule;
  availableModules: PlatformModule[];
  workers: WorkerProfile[];
  language: 'en' | 'mizo';
  clientPhone: string;
  clientName: string;
  onTaskCreated: (task: TaskRecord) => void;
  onSelectCategory: (cat: ServiceCategory) => void;
}

export const ClientTaskCreator: React.FC<ClientTaskCreatorProps> = ({
  activeModule,
  availableModules,
  workers,
  language,
  clientPhone,
  clientName,
  onTaskCreated,
  onSelectCategory,
}) => {
  const isMizo = language === 'mizo';

  // AI Prompt Supervisor
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  // Form Fields
  const [pickupLocalityId, setPickupLocalityId] = useState('aiz_bara_bazar');
  const [dropLocalityId, setDropLocalityId] = useState('aiz_zarkawt');
  const [stairSteps, setStairSteps] = useState(30);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTitleMizo, setTaskTitleMizo] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showAdvancedNotes, setShowAdvancedNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Item Budget & Payment Mode
  const [hasItemToBuy, setHasItemToBuy] = useState(false);
  const [estimatedItemCost, setEstimatedItemCost] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cod');

  // Urgency & Scheduling
  const [urgency, setUrgency] = useState<TaskUrgency>('standard');
  const [scheduledTime, setScheduledTime] = useState('');

  // Dispatch Mode & Preferred Worker
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>('broadcast');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  // GPS Point-to-Point State
  const [showGpsMap, setShowGpsMap] = useState(false);
  const [pickupGps, setPickupGps] = useState<GpsCoordinate>(() => {
    const loc = MIZORAM_LOCALITIES[0];
    return { lat: loc.latitude, lng: loc.longitude, name: loc.name, elevationMeters: loc.elevationMeters };
  });
  const [dropGps, setDropGps] = useState<GpsCoordinate>(() => {
    const loc = MIZORAM_LOCALITIES[1];
    return { lat: loc.latitude, lng: loc.longitude, name: loc.name, elevationMeters: loc.elevationMeters };
  });
  const [gpsRoute, setGpsRoute] = useState<PointToPointRoute | null>(null);

  const pickupLocality = useMemo(() => {
    return MIZORAM_LOCALITIES.find(l => l.id === pickupLocalityId) || MIZORAM_LOCALITIES[0];
  }, [pickupLocalityId]);

  const dropLocality = useMemo(() => {
    return MIZORAM_LOCALITIES.find(l => l.id === dropLocalityId) || MIZORAM_LOCALITIES[1];
  }, [dropLocalityId]);

  const [isLocatingDevice, setIsLocatingDevice] = useState(false);

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg(isMizo ? 'I browser hian GPS a support lo.' : 'GPS not supported by browser.');
      return;
    }
    setIsLocatingDevice(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingDevice(false);
        const { latitude, longitude, altitude, accuracy } = pos.coords;
        const nearest = findNearestLocality(latitude, longitude, MIZORAM_LOCALITIES);
        const coord: GpsCoordinate = {
          lat: Math.round(latitude * 10000) / 10000,
          lng: Math.round(longitude * 10000) / 10000,
          name: `${nearest.locality.name} (${isMizo ? 'Ka Awmna GPS' : 'My GPS'})`,
          elevationMeters: altitude ? Math.round(altitude) : nearest.locality.elevationMeters,
          accuracyMeters: Math.round(accuracy),
        };
        setPickupGps(coord);
        setPickupLocalityId(nearest.locality.id);
      },
      () => {
        setIsLocatingDevice(false);
        const def = MIZORAM_LOCALITIES[0];
        setPickupGps({ lat: def.latitude, lng: def.longitude, name: `${def.name} (GPS Default)`, elevationMeters: def.elevationMeters });
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handlePickupChange = (locId: string) => {
    setPickupLocalityId(locId);
    const loc = MIZORAM_LOCALITIES.find(l => l.id === locId);
    if (loc) {
      setPickupGps({ lat: loc.latitude, lng: loc.longitude, name: loc.name, elevationMeters: loc.elevationMeters });
    }
  };

  const handleDropChange = (locId: string) => {
    setDropLocalityId(locId);
    const loc = MIZORAM_LOCALITIES.find(l => l.id === locId);
    if (loc) {
      setDropGps({ lat: loc.latitude, lng: loc.longitude, name: loc.name, elevationMeters: loc.elevationMeters });
    }
  };

  const handleGpsRouteSelected = (route: PointToPointRoute) => {
    setGpsRoute(route);
    setPickupGps(route.origin);
    setDropGps(route.destination);
    
    // Find closest locality to keep select dropdowns synced
    const nearestP = findNearestLocality(route.origin.lat, route.origin.lng, MIZORAM_LOCALITIES);
    const nearestD = findNearestLocality(route.destination.lat, route.destination.lng, MIZORAM_LOCALITIES);
    if (nearestP.locality.id !== pickupLocalityId) {
      setPickupLocalityId(nearestP.locality.id);
    }
    if (nearestD.locality.id !== dropLocalityId) {
      setDropLocalityId(nearestD.locality.id);
    }
  };

  // Real-time pure hill pricing breakdown
  const fareBreakdown = useMemo(() => {
    return calculateHillTerrainFare(activeModule, pickupLocality, dropLocality, stairSteps, urgency);
  }, [activeModule, pickupLocality, dropLocality, stairSteps, urgency]);

  // Filter matching online workers
  const eligibleWorkers = useMemo(() => {
    return workers
      .filter(w => w.isOnline && w.verified && w.activeCategories.includes(activeModule.category))
      .sort((a, b) => {
        const aBoost = a.currentLocalityId === pickupLocalityId ? 10 : 0;
        const bBoost = b.currentLocalityId === pickupLocalityId ? 10 : 0;
        return (b.rating + bBoost) - (a.rating + aBoost);
      });
  }, [workers, activeModule.category, pickupLocalityId]);

  // Handle AI analysis
  const handleAnalyzePrompt = async () => {
    if (!aiPromptInput.trim()) return;
    setIsAiAnalyzing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText: aiPromptInput }),
      });
      const data = await res.json();

      if (data.success && data.analysis) {
        const a = data.analysis;
        setAiAnalysisResult(a);
        if (a.titleEn) setTaskTitle(a.titleEn);
        if (a.titleMizo) setTaskTitleMizo(a.titleMizo);
        if (a.pickupLocalityId && MIZORAM_LOCALITIES.some(l => l.id === a.pickupLocalityId)) {
          setPickupLocalityId(a.pickupLocalityId);
        }
        if (a.dropLocalityId && MIZORAM_LOCALITIES.some(l => l.id === a.dropLocalityId)) {
          setDropLocalityId(a.dropLocalityId);
        }
        if (a.category && a.category !== activeModule.category) {
          onSelectCategory(a.category);
        }
      }
    } catch (err: any) {
      setErrorMsg('AI Supervisor analysis failed. Please specify manually.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const title = taskTitle || `${activeModule.name} from ${pickupLocality.name} to ${dropLocality.name}`;
      const titleMizo = taskTitleMizo || `${activeModule.nameMizo} (${pickupLocality.name} aṭanga ${dropLocality.name})`;

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          titleMizo,
          category: activeModule.category,
          clientPhone,
          clientName,
          pickupLocalityId,
          dropLocalityId,
          pickupGps,
          dropGps,
          gpsRoute,
          stairStepsCount: stairSteps,
          notes: specialInstructions,
          estimatedItemCost: hasItemToBuy ? (Number(estimatedItemCost) || 0) : 0,
          paymentMode,
          urgency,
          scheduledTime: urgency === 'scheduled' ? scheduledTime : undefined,
          dispatchMode,
          preferredWorkerId: dispatchMode === 'direct_worker' ? (selectedWorkerId || undefined) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create task');
      }

      onTaskCreated(data.task);
      setTaskTitle('');
      setTaskTitleMizo('');
      setSpecialInstructions('');
      setAiPromptInput('');
      setAiAnalysisResult(null);
      setHasItemToBuy(false);
      setEstimatedItemCost(0);
      setUrgency('standard');
      setScheduledTime('');
      setDispatchMode('broadcast');
      setSelectedWorkerId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs mb-4">
      {/* Header with Title & Calculated Fare */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {isMizo ? activeModule.nameMizo : activeModule.name}
          </h2>
          <span className="text-[11px] text-emerald-700 font-medium">
            {isMizo ? 'Tlangram kalkawng & kailawn hisap tel a ni' : 'Hill dispatch with terrace stair fee'}
          </span>
        </div>

        <div className="text-right bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
          <span className="text-[10px] text-emerald-800 uppercase font-semibold block leading-none">
            {isMizo ? 'Aman' : 'Fare'}
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono leading-tight flex items-center justify-end">
            <Rupee className="w-5 h-5 text-emerald-700 mr-0.5" />
            <span>{fareBreakdown.totalFee}</span>
          </span>
        </div>
      </div>

      {/* AI Prompt Auto-fill Bar (Compact) */}
      <div className="mb-3 bg-slate-50 border border-indigo-100 rounded-xl p-2.5">
        <div className="flex items-center gap-1.5 text-indigo-900 text-xs font-bold mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>{isMizo ? 'AI Logic Supervisor (Tawngkam hmangin hrilh rawh)' : 'AI Auto-Fill (Voice / Mizo Text):'}</span>
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={aiPromptInput}
            onChange={(e) => setAiPromptInput(e.target.value)}
            placeholder={
              isMizo
                ? 'Eg: Durtlang Synod atangin damdawi Zarkawt-ah min laksak rawh...'
                : 'Eg: Pickup medicine from Synod Durtlang to Zarkawt church...'
            }
            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="button"
            onClick={handleAnalyzePrompt}
            disabled={isAiAnalyzing || !aiPromptInput.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 shrink-0 shadow-2xs"
          >
            {isAiAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isMizo ? 'AI Hisap' : 'AI Fill'}</span>
          </button>
        </div>

        {aiAnalysisResult && (
          <div className="mt-2 p-2 bg-indigo-50/80 border border-indigo-100 rounded-lg text-xs text-indigo-950 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-snug">
              <span className="font-semibold">{isMizo ? aiAnalysisResult.explanationMizo : aiAnalysisResult.explanationEn}</span>
              <span className="text-indigo-700 block mt-0.5">
                ⏱ ~{aiAnalysisResult.estimatedMinutes} mins • Hill: {aiAnalysisResult.hillDifficultyIndex}/5
              </span>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Task Form */}
      <form onSubmit={handleCreateTask} className="space-y-3">
        {/* Point-to-Point GPS Routing Toolbar */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2 sm:p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-700" />
              <div>
                <span className="font-bold text-slate-900 text-xs">
                  {isMizo ? 'Point-to-Point GPS Hman' : 'Point-to-Point GPS Routing'}
                </span>
                <span className="text-[10px] text-emerald-800 ml-1.5 hidden sm:inline font-mono">
                  {gpsRoute ? `${gpsRoute.roadDistanceKm} km • ${gpsRoute.elevationChangeMeters > 0 ? '+' : ''}${gpsRoute.elevationChangeMeters}m` : 'Live Coordinates'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGpsMap(!showGpsMap)}
              className="bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-emerald-300 transition flex items-center gap-1 shadow-2xs"
            >
              <Navigation className="w-3 h-3 text-emerald-600" />
              <span>{showGpsMap ? (isMizo ? 'Map Thup' : 'Hide Map') : (isMizo ? 'Point A & B Map-ah Thlang Rawh' : 'Select on GPS Map')}</span>
              {showGpsMap ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Embedded Point-to-Point GPS Map */}
          {showGpsMap && (
            <div className="mt-2.5 pt-2 border-t border-emerald-200/60 animate-fadeIn">
              <PointToPointGpsMap
                language={language}
                originGps={pickupGps}
                destGps={dropGps}
                onSelectRoute={handleGpsRouteSelected}
                compact={true}
              />
            </div>
          )}
        </div>

        {/* Pickup & Drop Localities in 2 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>{isMizo ? 'Lakna (Pickup)' : 'Pickup Locality'}</span>
              </span>
              <span className="font-mono text-slate-500 font-normal">{pickupLocality.elevationMeters}m • {pickupGps.lat.toFixed(3)}°N</span>
            </label>
            <select
              value={pickupLocalityId}
              onChange={(e) => handlePickupChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {MIZORAM_LOCALITIES.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.district}) • {loc.elevationMeters}m
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-600" />
                <span>{isMizo ? 'Dahna (Destination)' : 'Drop Locality'}</span>
              </span>
              <span className="font-mono text-slate-500 font-normal">{dropLocality.elevationMeters}m • {dropGps.lat.toFixed(3)}°N</span>
            </label>
            <select
              value={dropLocalityId}
              onChange={(e) => handleDropChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {MIZORAM_LOCALITIES.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.district}) • {loc.elevationMeters}m
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Task Urgency & Scheduling */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] sm:text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{isMizo ? 'Hmanhmawh Dan (Urgency)' : 'Delivery Urgency'}</span>
            </span>
            {urgency === 'urgent' && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                +₹{fareBreakdown.urgencySurcharge} Priority Dispatch
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setUrgency('standard')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition text-center ${
                urgency === 'standard'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isMizo ? 'Standard' : 'Standard'}
            </button>
            <button
              type="button"
              onClick={() => setUrgency('urgent')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition text-center flex items-center justify-center gap-1 ${
                urgency === 'urgent'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                  : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>{isMizo ? '⚡ Hmanhmawh' : '⚡ Urgent'}</span>
            </button>
            <button
              type="button"
              onClick={() => setUrgency('scheduled')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition text-center flex items-center justify-center gap-1 ${
                urgency === 'scheduled'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{isMizo ? '📅 Hun Ruat' : '📅 Scheduled'}</span>
            </button>
          </div>

          {urgency === 'scheduled' && (
            <div className="pt-1">
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder={isMizo ? 'Entirnan: Naktuk zing dar 8:00 ah / Tlai dar 4:30 ah' : 'e.g. Tomorrow 8:00 AM / Today 4:30 PM'}
                className="w-full bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          )}
        </div>

        {/* Item Purchase Budget & Payment Mode */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] sm:text-xs">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isMizo ? 'Thil Lei Ngai A Awm Em? (Item Budget)' : 'Worker Purchases Items for You?'}</span>
            </span>
            <button
              type="button"
              onClick={() => setHasItemToBuy(!hasItemToBuy)}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
                hasItemToBuy ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-xs"></div>
            </button>
          </div>

          {hasItemToBuy && (
            <div className="space-y-2 pt-1 border-t border-slate-200 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    {isMizo ? 'Thil Lei Man Tur Zat (₹ Estimate)' : 'Estimated Item Cost (₹)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-500 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={estimatedItemCost || ''}
                      onChange={(e) => setEstimatedItemCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="e.g. 250"
                      className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    {isMizo ? 'Sum Inpek Dan (Payment Mode)' : 'Payment Method'}
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="cod">{isMizo ? 'Cash on Delivery (In pek chawp)' : 'Cash on Delivery'}</option>
                    <option value="upi_online">{isMizo ? 'UPI QR on Delivery (GPay / PhonePe)' : 'UPI QR at Delivery'}</option>
                    <option value="pay_on_pickup">{isMizo ? 'Dawrah pek sa (Pre-paid at store)' : 'Pre-paid at Store'}</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                {isMizo 
                  ? '💡 Thawktuin dawr aṭanga receipt / bill a rawn thawn dawn che nia.' 
                  : '💡 Worker will present store bill/receipt upon arrival.'}
              </p>
            </div>
          )}
        </div>

        {/* Dispatch Mode: Broadcast vs Preferred Worker */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] sm:text-xs">
              <Radio className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isMizo ? 'Hna Inpek Dan (Dispatching)' : 'Dispatching Mode'}</span>
            </span>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => { setDispatchMode('broadcast'); setSelectedWorkerId(null); }}
                className={`px-2 py-0.5 rounded transition ${dispatchMode === 'broadcast' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
              >
                {isMizo ? 'Broadcast' : 'Broadcast'}
              </button>
              <button
                type="button"
                onClick={() => setDispatchMode('direct_worker')}
                className={`px-2 py-0.5 rounded transition ${dispatchMode === 'direct_worker' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
              >
                {isMizo ? 'Thawktu Thlang' : 'Select Worker'}
              </button>
            </div>
          </div>

          {dispatchMode === 'direct_worker' && (
            <div className="space-y-1.5 pt-1 border-t border-slate-200 animate-fadeIn">
              <div className="text-[10px] text-slate-600 font-semibold mb-1">
                {isMizo ? 'He rawngbawlna tana thawktu awm mek te:' : 'Online verified workers available:'}
              </div>
              {eligibleWorkers.length === 0 ? (
                <div className="text-center p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-500">
                  {isMizo ? 'Tunah hian thawktu awm hnai an awm rih lo. Broadcast hmang rawh le.' : 'No active workers in this exact locality. Use broadcast.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  {eligibleWorkers.map((w) => {
                    const isSelected = selectedWorkerId === w.id;
                    return (
                      <div
                        key={w.id}
                        onClick={() => setSelectedWorkerId(isSelected ? null : w.id)}
                        className={`p-2 rounded-lg border cursor-pointer transition flex items-center justify-between text-xs ${
                          isSelected ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="truncate">
                          <div className="font-bold text-slate-900 truncate">{w.name}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                            <span className="text-amber-600 font-bold">★ {w.rating}</span>
                            <span>• {w.completedTasks} jobs</span>
                            <span className="capitalize">• {w.vehicleType.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Compact Stair Steps Slider */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3">
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] sm:text-xs">
              <Footprints className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isMizo ? 'Kailawn Step Zat (Stairs)' : 'Cliff / Terrace Stairs to House'}</span>
            </span>
            <span className="font-mono text-emerald-800 font-bold text-xs bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200 flex items-center">
              <span>{stairSteps} steps (+</span><Rupee className="w-2.5 h-2.5 mx-0.5 text-emerald-800" /><span>{fareBreakdown.stairFee})</span>
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="180"
            step="10"
            value={stairSteps}
            onChange={(e) => setStairSteps(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
        </div>

        {/* Transparent Fare Summary Pills (Compact) */}
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] sm:text-xs">
          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">{isMizo ? 'Bultanna' : 'Base'}</div>
            <div className="font-mono font-bold text-slate-900 flex items-center justify-center">
              <Rupee className="w-2.5 h-2.5 text-slate-800" />
              <span>{fareBreakdown.baseFee}</span>
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">{isMizo ? 'Kawng' : 'Dist'}</div>
            <div className="font-mono font-bold text-slate-900 flex items-center justify-center">
              <Rupee className="w-2.5 h-2.5 text-slate-800" />
              <span>{fareBreakdown.distanceFee}</span>
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">{isMizo ? 'Tlangram' : 'Hill'}</div>
            <div className="font-mono font-bold text-amber-700 flex items-center justify-center">
              <span>+</span><Rupee className="w-2.5 h-2.5 text-amber-700" />
              <span>{fareBreakdown.hillSurcharge}</span>
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">{isMizo ? 'Kailawn' : 'Stairs'}</div>
            <div className="font-mono font-bold text-emerald-700 flex items-center justify-center">
              <span>+</span><Rupee className="w-2.5 h-2.5 text-emerald-700" />
              <span>{fareBreakdown.stairFee}</span>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Landmark / Notes option */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvancedNotes(!showAdvancedNotes)}
            className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 transition"
          >
            <span>{showAdvancedNotes ? (isMizo ? 'Note khar rawh' : 'Hide Notes') : (isMizo ? '+ Note / Landmark dahna' : '+ Add Special Landmark Notes')}</span>
            {showAdvancedNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showAdvancedNotes && (
            <div className="mt-2 space-y-2 animate-fadeIn">
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder={isMizo ? 'Biak in bul, gate pawl kawtah...' : 'Presbyterian church gate, blue gate...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}
        </div>

        {/* Total Estimated Payable Banner if Item Cost exists or Urgent */}
        {((hasItemToBuy && estimatedItemCost > 0) || fareBreakdown.urgencySurcharge > 0) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-emerald-950 block">
                {isMizo ? 'Sum Pek Chhuah Tur Zawng Zawng:' : 'Total Payable Estimate:'}
              </span>
              <span className="text-[10px] text-emerald-800">
                Delivery: ₹{fareBreakdown.totalFee} {hasItemToBuy && estimatedItemCost > 0 && `+ Thil man: ₹${estimatedItemCost}`}
              </span>
            </div>
            <span className="font-mono text-base font-black text-emerald-900 flex items-center">
              <Rupee className="w-4 h-4 text-emerald-900" />
              <span>{fareBreakdown.totalFee + (hasItemToBuy ? (Number(estimatedItemCost) || 0) : 0)}</span>
            </span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isMizo ? 'Hna siam mek...' : 'Broadcasting...'}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="flex items-center gap-1">
                {isMizo ? (
                  <>Hna Siam Fel Rawh (<Rupee className="w-3 h-3 text-white" />{fareBreakdown.totalFee + (hasItemToBuy ? (Number(estimatedItemCost) || 0) : 0)})</>
                ) : (
                  <>Confirm &amp; Broadcast Errand (<Rupee className="w-3 h-3 text-white" />{fareBreakdown.totalFee + (hasItemToBuy ? (Number(estimatedItemCost) || 0) : 0)})</>
                )}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
