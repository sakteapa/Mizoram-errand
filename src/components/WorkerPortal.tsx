import React, { useState } from 'react';
import { 
  Briefcase, 
  Wallet, 
  Star, 
  MapPin, 
  CheckCircle, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  Footprints, 
  TrendingUp, 
  Phone, 
  Key, 
  WifiOff,
  Bike,
  Compass,
  Navigation,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MIZORAM_LOCALITIES } from '../utils/mizoramData.ts';
import { Rupee } from './CurrencySymbol.tsx';
import { PointToPointGpsMap } from './PointToPointGpsMap.tsx';
import type { TaskRecord, WorkerProfile, PlatformSettings } from '../types/platform.ts';

interface WorkerPortalProps {
  tasks: TaskRecord[];
  currentWorker: WorkerProfile | null;
  language: 'en' | 'mizo';
  platformSettings?: PlatformSettings;
  onUpdateTaskStatus: (taskId: string, nextStatus: 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED', payload?: any) => Promise<void>;
  onToggleOnline: (isOnline: boolean) => void;
}

export const WorkerPortal: React.FC<WorkerPortalProps> = ({
  tasks,
  currentWorker,
  language,
  platformSettings,
  onUpdateTaskStatus,
  onToggleOnline,
}) => {
  const isMizo = language === 'mizo';

  // Completion modal state
  const [activeCompletingTask, setActiveCompletingTask] = useState<TaskRecord | null>(null);
  const [inputOtp, setInputOtp] = useState('');
  const [inputOfflineToken, setInputOfflineToken] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [expandedWorkerGpsTaskId, setExpandedWorkerGpsTaskId] = useState<string | null>(null);

  const isOnline = currentWorker ? currentWorker.isOnline : true;

  // Filter available pending tasks for this worker
  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  // Filter active jobs claimed by this worker
  const myActiveTasks = tasks.filter(t => 
    (t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS') && 
    (!currentWorker || t.workerId === currentWorker.id)
  );

  const getLocalityName = (id: string) => {
    const loc = MIZORAM_LOCALITIES.find(l => l.id === id);
    return loc ? `${loc.name}` : id;
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompletingTask) return;

    setIsVerifying(true);
    setCompletionError(null);

    try {
      await onUpdateTaskStatus(activeCompletingTask.id, 'COMPLETED', {
        otpProvided: inputOtp,
        lowConnectivityTokenUsed: inputOfflineToken,
        proofNote: proofNote || 'Delivered directly to client',
      });
      setActiveCompletingTask(null);
      setInputOtp('');
      setInputOfflineToken('');
      setProofNote('');
    } catch (err: any) {
      setCompletionError(err.message || 'OTP validation failed. Check with client.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Worker Status & Wallet Header (Light Theme) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg border border-amber-200">
              {currentWorker ? currentWorker.name.charAt(0) : 'T'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {currentWorker ? currentWorker.name : 'Lalrinsanga (Rina)'}
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" /> KYC
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center text-amber-700 font-bold">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
                  {currentWorker ? currentWorker.rating : 4.88}★
                </span>
                <span>• {currentWorker ? currentWorker.completedTasks : 387} jobs</span>
              </div>
            </div>
          </div>

          {/* Online Toggle & Earnings */}
          <div className="flex items-center gap-3">
            <div className="text-right bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-800 block font-semibold leading-none">{isMizo ? 'Hlawh Khawl' : 'Earnings'}</span>
              <span className="text-base sm:text-lg font-mono font-black text-emerald-800 flex items-center justify-end">
                <Rupee className="w-4 h-4 text-emerald-800" />
                <span>{currentWorker ? currentWorker.earningsBalance : 4250}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <span className={`text-[11px] font-bold ${isOnline ? 'text-emerald-700' : 'text-slate-500'}`}>
                {isOnline ? (isMizo ? 'Inpeih' : 'Online') : (isMizo ? 'Chawl' : 'Offline')}
              </span>
              <button
                type="button"
                onClick={() => onToggleOnline(!isOnline)}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
                  isOnline ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-xs"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Fee & Commission Transparency Card */}
      {(!platformSettings || platformSettings.platformFeePercentage === 0) ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              0%
            </div>
            <div>
              <span className="font-bold text-emerald-950 text-xs sm:text-sm block">
                {isMizo ? '0% Platform Commission (Hlawh 100% Thawktu Tan)' : '0% Platform Fee Active (100% Payout)'}
              </span>
              <span className="text-emerald-800 text-[11px] block mt-0.5">
                {isMizo 
                  ? 'Tun dinhmunah platform commission lak a ni lo. I hna thawh man zawng zawng 100% i chang vek e!' 
                  : 'Zero platform commission active. You receive 100% of all customer fees directly.'}
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-300 shrink-0 hidden sm:inline">
            100% Worker Payout
          </span>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              {100 - platformSettings.platformFeePercentage}%
            </div>
            <div>
              <span className="font-bold text-blue-950 text-xs sm:text-sm block">
                {isMizo 
                  ? `Thawktu Chan: ${100 - platformSettings.platformFeePercentage}% (Platform Fee: ${platformSettings.platformFeePercentage}%)` 
                  : `Courier Share: ${100 - platformSettings.platformFeePercentage}% (Platform Fee: ${platformSettings.platformFeePercentage}%)`}
              </span>
              <span className="text-blue-800 text-[11px] block mt-0.5">
                {isMizo
                  ? `Hna zawh fel a nihin total fare aṭangin ${100 - platformSettings.platformFeePercentage}% i account-ah a lut ang.`
                  : `You receive ${100 - platformSettings.platformFeePercentage}% of task fees credited immediately upon verification.`}
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full border border-blue-200 shrink-0 hidden sm:inline">
            {platformSettings.platformFeePercentage}% Platform Fee
          </span>
        </div>
      )}

      {/* Section 1: My Active Working Tasks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>{isMizo ? 'I Hna Chelh Mek' : 'My Active Deliveries'}</span>
            <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold border border-purple-200">
              {myActiveTasks.length}
            </span>
          </h3>
        </div>

        {myActiveTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500 shadow-xs">
            {isMizo
              ? 'Tunah hian i hna chelh lai a awm lo. A hnuaia hna awm te khian lo thlang rawh le.'
              : 'No tasks currently active. Claim available broadcast tasks below.'}
          </div>
        ) : (
          <div className="space-y-3">
            {myActiveTasks.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-purple-200 rounded-xl p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {t.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200 font-bold">
                      {t.status}
                    </span>
                    <span className="font-mono text-sm sm:text-base font-black text-emerald-800 flex items-center">
                      <Rupee className="w-3.5 h-3.5 text-emerald-800" />
                      <span>{Math.round(t.totalFee * 0.85)}</span>
                      <span className="text-[10px] text-slate-500 font-normal ml-1">payout</span>
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    {isMizo ? t.titleMizo : t.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Client: <strong className="text-slate-900">{t.clientName}</strong> ({t.clientPhone})
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Pickup:</span>
                    <div className="font-semibold text-slate-800">{getLocalityName(t.pickupLocalityId)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Drop:</span>
                    <div className="font-semibold text-slate-800">{getLocalityName(t.dropLocalityId)}</div>
                  </div>
                </div>

                {/* Point-to-Point GPS Route & Live Turn-by-Turn Nav for Worker */}
                {(() => {
                  const pLoc = MIZORAM_LOCALITIES.find(l => l.id === t.pickupLocalityId) || MIZORAM_LOCALITIES[0];
                  const dLoc = MIZORAM_LOCALITIES.find(l => l.id === t.dropLocalityId) || MIZORAM_LOCALITIES[1];
                  const pGps = t.pickupGps || { lat: pLoc.latitude, lng: pLoc.longitude, name: pLoc.name, elevationMeters: pLoc.elevationMeters };
                  const dGps = t.dropGps || { lat: dLoc.latitude, lng: dLoc.longitude, name: dLoc.name, elevationMeters: dLoc.elevationMeters };
                  const isGpsOpen = expandedWorkerGpsTaskId === t.id;
                  const gMapsNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${pGps.lat},${pGps.lng}&destination=${dGps.lat},${dGps.lng}`;

                  return (
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-2 text-xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                          <Compass className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-semibold text-slate-900">GPS Route:</span>
                          <span className="font-mono text-emerald-800 font-bold">
                            {pGps.lat.toFixed(3)}°N → {dGps.lat.toFixed(3)}°N
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setExpandedWorkerGpsTaskId(isGpsOpen ? null : t.id)}
                            className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-0.5"
                          >
                            <Navigation className="w-3 h-3 text-emerald-600" />
                            <span>{isGpsOpen ? 'Map Thup' : 'GPS Map'}</span>
                            {isGpsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          <a
                            href={gMapsNavUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs transition"
                            title="Start Turn-by-Turn GPS Navigation"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Nav</span>
                          </a>
                        </div>
                      </div>

                      {isGpsOpen && (
                        <div className="pt-2 border-t border-emerald-200 animate-fadeIn">
                          <PointToPointGpsMap
                            language={language}
                            originGps={pGps}
                            destGps={dGps}
                            interactive={false}
                            compact={true}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Worker actions */}
                <div className="flex gap-2 pt-1">
                  {t.status === 'ACCEPTED' && (
                    <button
                      onClick={() => onUpdateTaskStatus(t.id, 'IN_PROGRESS')}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition shadow-2xs"
                    >
                      {isMizo ? 'Chhuak Mek (Start Route)' : 'Start Route'}
                    </button>
                  )}

                  {t.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => {
                        setActiveCompletingTask(t);
                        setCompletionError(null);
                        setInputOtp(t.completionOtp); // Dev assist
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition shadow-2xs"
                    >
                      {isMizo ? 'Hna Zo Fel Rawh (Enter OTP)' : 'Complete Task with OTP'}
                    </button>
                  )}

                  <a
                    href={`tel:${t.clientPhone}`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Available Broadcast Feed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
            <span>{isMizo ? 'Hna Awm Te (Broadcast)' : 'Available Tasks Feed'}</span>
            <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold border border-amber-200">
              {pendingTasks.length}
            </span>
          </h3>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500 shadow-xs">
            {isMizo ? 'Tun dinhmunah hna thar a la awm lo.' : 'No broadcast tasks waiting at the moment.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {task.id}
                  </span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-800 text-sm flex items-center justify-end">
                      <Rupee className="w-3 h-3 text-emerald-800" />
                      <span>{Math.round(task.totalFee * 0.85)}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-none">payout</span>
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                  {isMizo ? task.titleMizo : task.title}
                </h4>

                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span>{getLocalityName(task.pickupLocalityId)} → {getLocalityName(task.dropLocalityId)}</span>
                  <span className="text-slate-500 font-mono">{task.stairStepsCount} steps</span>
                </div>

                <button
                  onClick={() => onUpdateTaskStatus(task.id, 'ACCEPTED', { workerId: currentWorker?.id || 'wrk_mizo_01' })}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg transition shadow-2xs"
                >
                  {isMizo ? 'Hna Pawm Rawh (Claim)' : 'Accept Task'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {activeCompletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-4 sm:p-5 shadow-xl relative space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Verify Task Completion</h3>
              </div>
              <button
                onClick={() => setActiveCompletingTask(null)}
                className="text-slate-400 hover:text-slate-800 text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>

            {completionError && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {completionError}
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Client Delivery OTP (6 Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={inputOtp}
                  onChange={(e) => setInputOtp(e.target.value)}
                  placeholder="482910"
                  className="w-full text-center tracking-widest font-mono text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl py-2 text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Or Offline SMS Fallback Token:
                </label>
                <input
                  type="text"
                  value={inputOfflineToken}
                  onChange={(e) => setInputOfflineToken(e.target.value)}
                  placeholder="MZ-8A4F-29BC"
                  className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm"
              >
                {isVerifying ? 'Verifying...' : 'Confirm & Credit Wallet'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
