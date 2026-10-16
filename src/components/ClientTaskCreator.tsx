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
  Loader2
} from 'lucide-react';
import { MIZORAM_LOCALITIES } from '../utils/mizoramData.ts';
import { calculateHillTerrainFare } from '../utils/pricingEngine.ts';
import type { 
  PlatformModule, 
  ServiceCategory, 
  TaskRecord, 
  WorkerProfile 
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
  const [stairSteps, setStairSteps] = useState(40);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTitleMizo, setTaskTitleMizo] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pickupLocality = useMemo(() => {
    return MIZORAM_LOCALITIES.find(l => l.id === pickupLocalityId) || MIZORAM_LOCALITIES[0];
  }, [pickupLocalityId]);

  const dropLocality = useMemo(() => {
    return MIZORAM_LOCALITIES.find(l => l.id === dropLocalityId) || MIZORAM_LOCALITIES[1];
  }, [dropLocalityId]);

  // Real-time pure hill pricing breakdown
  const fareBreakdown = useMemo(() => {
    return calculateHillTerrainFare(activeModule, pickupLocality, dropLocality, stairSteps);
  }, [activeModule, pickupLocality, dropLocality, stairSteps]);

  // Filter matching online workers
  const eligibleWorkers = useMemo(() => {
    return workers
      .filter(w => w.isOnline && w.verified && w.activeCategories.includes(activeModule.category))
      .sort((a, b) => {
        // Boost worker in same locality
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
          stairStepsCount: stairSteps,
          notes: specialInstructions,
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
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl mb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">
              {isMizo ? `Hna Siam: ${activeModule.nameMizo}` : `Post Task: ${activeModule.name}`}
            </h2>
            <span className="text-xs bg-emerald-950 text-emerald-400 font-medium px-2 py-0.5 rounded border border-emerald-800">
              {isMizo ? 'Hnaiah Thawktu Zawnna' : 'Hill Optimized Dispatch'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isMizo ? activeModule.descriptionMizo : activeModule.description}
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">{isMizo ? 'Chhut fel aman:' : 'Calculated Fare:'}</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            <span className="currency-symbol">₹</span>{fareBreakdown.totalFee}
          </div>
        </div>
      </div>

      {/* AI Dispatcher & Logic Supervisor Prompt Box */}
      <div className="mb-6 bg-slate-950/80 border border-indigo-900/40 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-spin-slow" />
          <span>{isMizo ? 'AI Logic Supervisor: Ṭawngkam a hna hrilh (Mizo / English)' : 'AI Logic Supervisor & Prompt Auto-Fill:'}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiPromptInput}
            onChange={(e) => setAiPromptInput(e.target.value)}
            placeholder={
              isMizo
                ? 'Eg: Synod Hospital Durtlang aṭangin damdawi min va laksak la Zarkawt-ah min rawn pe rawh...'
                : 'Eg: Pick up heavy medical test report from Synod Durtlang and deliver to Zarkawt church...'
            }
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAnalyzePrompt}
            disabled={isAiAnalyzing || !aiPromptInput.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
          >
            {isAiAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isMizo ? 'Hisap mek...' : 'Analyzing...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isMizo ? 'AI hmanga hisap' : 'Auto-Fill with AI'}</span>
              </>
            )}
          </button>
        </div>

        {/* AI Explanation feedback if available */}
        {aiAnalysisResult && (
          <div className="mt-3 p-2.5 bg-indigo-950/40 border border-indigo-800/40 rounded-lg text-xs text-indigo-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">
                {isMizo ? aiAnalysisResult.explanationMizo : aiAnalysisResult.explanationEn}
              </div>
              <div className="text-[11px] text-indigo-300 mt-1 flex flex-wrap gap-2">
                <span>⏱ ~{aiAnalysisResult.estimatedMinutes} mins</span>
                <span>🏔 Hill Index: {aiAnalysisResult.hillDifficultyIndex}/5</span>
                <span>👷 Suggested: {aiAnalysisResult.suggestedWorkerType}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-xl text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Task Form */}
      <form onSubmit={handleCreateTask} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup Locality */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isMizo ? 'Lakna Hmun (Pickup Locality)' : 'Pickup Locality'}</span>
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                {pickupLocality.elevationMeters}m ASL
              </span>
            </label>
            <select
              value={pickupLocalityId}
              onChange={(e) => setPickupLocalityId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {MIZORAM_LOCALITIES.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.district}) • {loc.elevationMeters}m [Steepness {loc.steepnessRating}/5]
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Landmarks: {pickupLocality.popularLandmarks.slice(0, 2).join(', ')}
            </p>
          </div>

          {/* Drop Locality */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{isMizo ? 'Dahna Hmun (Drop / Delivery Locality)' : 'Drop / Delivery Locality'}</span>
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                {dropLocality.elevationMeters}m ASL
              </span>
            </label>
            <select
              value={dropLocalityId}
              onChange={(e) => setDropLocalityId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {MIZORAM_LOCALITIES.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.district}) • {loc.elevationMeters}m [Steepness {loc.steepnessRating}/5]
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Landmarks: {dropLocality.popularLandmarks.slice(0, 2).join(', ')}
            </p>
          </div>
        </div>

        {/* Steep Cliff Stair Climbing Slider */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Footprints className="w-4 h-4 text-emerald-400" />
              <span>
                {isMizo 
                  ? 'Kailawn / Concrete Step Chhoh / Zuk Zawh Tur Zat' 
                  : 'Cliff Stairs / Concrete Steps to House (Both Directions)'}
              </span>
            </label>
            <span className="font-mono text-emerald-400 font-bold text-xs bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              {stairSteps} steps (+<span className="currency-symbol">₹</span>{fareBreakdown.stairFee})
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="200"
            step="10"
            value={stairSteps}
            onChange={(e) => setStairSteps(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0 steps (Road level)</span>
            <span>50 steps (Average Aizawl slope)</span>
            <span>120 steps (Deep terrace cliff)</span>
            <span>200 steps (Extreme valley)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {isMizo
              ? 'Mizoram-ah chuan in tam tak hi motor kawngpui aṭanga kailawn thui tak chhuk/chhoh a ngaih avangin thawktu te tan rawngbawlna man bituk a ni.'
              : 'Fair compensation algorithm: In Aizawl hills, houses are built on steep ridges requiring steep stair climbing with loads.'}
          </p>
        </div>

        {/* Title & Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isMizo ? 'Hna Hming / Title (English)' : 'Task Description / Title'}
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Urgent prescription pickup at Synod Hospital"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {isMizo ? 'Mizo ṭawng a chianna' : 'Mizo Language Summary'}
            </label>
            <input
              type="text"
              value={taskTitleMizo}
              onChange={(e) => setTaskTitleMizo(e.target.value)}
              placeholder="e.g. Synod Hospital aṭangin damdawi lak"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {isMizo ? 'Thawktu Hriattur Pawimawh (Notes)' : 'Special Instructions & Landmark Notes'}
          </label>
          <textarea
            rows={2}
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder={
              isMizo
                ? 'Biak In kawtah min lo nghak rawh, kawng kual a step phei hmasa ber kha...'
                : 'Meet near Presbyterian church gate, blue gate with water tank...'
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Transparent Cost Breakdown Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isMizo ? 'Aman Chhutna Dik Tak (Transparent Pricing):' : 'Transparent Hill Fare Breakdown:'}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Δ {fareBreakdown.elevationDeltaMeters}m Elevation
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[11px]">{isMizo ? 'Bulṭanna' : 'Base Fare'}</div>
              <div className="font-mono font-bold text-white text-sm"><span className="currency-symbol">₹</span>{fareBreakdown.baseFee}</div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[11px]">{isMizo ? 'Hlat Zawng' : 'Distance (~' + fareBreakdown.estimatedKm + 'km)'}</div>
              <div className="font-mono font-bold text-white text-sm"><span className="currency-symbol">₹</span>{fareBreakdown.distanceFee}</div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[11px]">{isMizo ? 'Tlangram Harsa' : 'Hill Steepness Surcharge'}</div>
              <div className="font-mono font-bold text-amber-400 text-sm">+<span className="currency-symbol">₹</span>{fareBreakdown.hillSurcharge}</div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[11px]">{isMizo ? 'Kailawn Chhoh' : 'Stair Climbing Fee'}</div>
              <div className="font-mono font-bold text-emerald-400 text-sm">+<span className="currency-symbol">₹</span>{fareBreakdown.stairFee}</div>
            </div>
          </div>
        </div>

        {/* Live Eligible Workers in locality */}
        <div>
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>
              {isMizo ? 'Hnaia Thawktu Inpeih Te (Nearest Verified Workers):' : 'Available Field Workers Nearby:'}
            </span>
            <span className="text-[11px] text-emerald-400">
              {eligibleWorkers.length} {isMizo ? 'inpeih mek' : 'online now'}
            </span>
          </div>

          {eligibleWorkers.length === 0 ? (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 text-center">
              {isMizo ? 'Tunah hian he category a thawktu an la inpeih lo.' : 'No verified workers currently active in this category.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {eligibleWorkers.slice(0, 3).map((w) => (
                <div key={w.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1">
                      <span>{w.name}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                        {w.rating}
                      </span>
                      <span>• {w.completedTasks} jobs</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                    {w.currentLocalityId === pickupLocalityId ? 'Local' : 'Near'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-5 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/30"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isMizo ? 'Hna chhawr mek...' : 'Broadcasting Task...'}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>
                {isMizo 
                  ? `Hna Siam Fel Rawh (₹${fareBreakdown.totalFee})` 
                  : `Confirm & Broadcast Errand (₹${fareBreakdown.totalFee})`}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
