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
  Bike
} from 'lucide-react';
import { MIZORAM_LOCALITIES } from '../utils/mizoramData.ts';
import type { TaskRecord, WorkerProfile } from '../types/platform.ts';

interface WorkerPortalProps {
  tasks: TaskRecord[];
  currentWorker: WorkerProfile | null;
  language: 'en' | 'mizo';
  onUpdateTaskStatus: (taskId: string, nextStatus: 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED', payload?: any) => Promise<void>;
  onToggleOnline: (isOnline: boolean) => void;
}

export const WorkerPortal: React.FC<WorkerPortalProps> = ({
  tasks,
  currentWorker,
  language,
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
    <div className="space-y-6">
      {/* Worker Status & Wallet Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl">
              {currentWorker ? currentWorker.name.charAt(0) : 'T'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {currentWorker ? currentWorker.name : 'Lalrinsanga (Rina)'}
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> KYC Verified
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center text-amber-400 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                  {currentWorker ? currentWorker.rating : 4.88}★
                </span>
                <span>• {currentWorker ? currentWorker.completedTasks : 387} {isMizo ? 'Hna zo tawh' : 'jobs'}</span>
                <span className="font-mono text-slate-500">
                  {currentWorker ? currentWorker.phone : '+919862345123'}
                </span>
              </div>
            </div>
          </div>

          {/* Online Toggle & Earnings */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px] text-slate-400">{isMizo ? 'Hlawh Khawl' : 'Earnings Wallet'}</div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                <span className="currency-symbol">₹</span>{currentWorker ? currentWorker.earningsBalance : 4250}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <span className={`text-xs font-semibold ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isOnline ? (isMizo ? 'Inpeih' : 'Online') : (isMizo ? 'Chawl Mek' : 'Offline')}
              </span>
              <button
                type="button"
                onClick={() => onToggleOnline(!isOnline)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                  isOnline ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: My Active Working Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>{isMizo ? 'I Hna Chelh Mek (My Active Deliveries)' : 'My Active Working Tasks'}</span>
            <span className="text-xs bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full border border-purple-800">
              {myActiveTasks.length}
            </span>
          </h3>
        </div>

        {myActiveTasks.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
            {isMizo
              ? 'Tunah hian i hna chelh lai a awm lo. A hnuaia hna awm te khian lo thlang rawh le.'
              : 'You have no active tasks currently in progress. Claim available tasks below.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myActiveTasks.map((t) => (
              <div
                key={t.id}
                className="bg-slate-900 border border-purple-900/50 rounded-2xl p-5 shadow-lg space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950 px-2 py-1 rounded border border-purple-800">
                    {t.id}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30 font-semibold">
                      {t.status}
                    </span>
                    <span className="font-mono text-base font-bold text-emerald-400">
                      <span className="currency-symbol">₹</span>{Math.round(t.totalFee * 0.85)} <span className="text-[10px] text-slate-400">payout</span>
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">
                    {isMizo ? t.titleMizo : t.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Client: <strong className="text-slate-200">{t.clientName}</strong> ({t.clientPhone})
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Pickup:</span>
                    <div className="font-medium text-slate-200">{getLocalityName(t.pickupLocalityId)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Destination:</span>
                    <div className="font-medium text-slate-200">{getLocalityName(t.dropLocalityId)}</div>
                  </div>
                </div>

                {/* Worker actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {t.status === 'ACCEPTED' && (
                    <button
                      onClick={() => onUpdateTaskStatus(t.id, 'IN_PROGRESS')}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isMizo ? 'Chhuak Mek / Ṭan Rawh (Start Route)' : 'Start En Route (In Progress)'}</span>
                    </button>
                  )}

                  {t.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => {
                        setActiveCompletingTask(t);
                        setCompletionError(null);
                        setInputOtp(t.completionOtp); // Dev assist
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isMizo ? 'Hna Zo Fel Rawh (Complete with OTP)' : 'Complete Task with Client OTP'}</span>
                    </button>
                  )}

                  <a
                    href={`tel:${t.clientPhone}`}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2.5 rounded-xl border border-slate-700 text-xs flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call Client</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Available Pending Jobs Broadcast */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span>{isMizo ? 'Hna Awm Te (Available Broadcast Feed)' : 'Available Broadcast Feed'}</span>
            <span className="text-xs bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-800">
              {pendingTasks.length}
            </span>
          </h3>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
            {isMizo
              ? 'Tun dinhmunah hna thar a la awm lo. Chhawrtu ten an rawn post hunah hetah a lang nghal ang.'
              : 'No pending broadcast tasks right now. Live jobs will appear here in real time.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg space-y-3 transition"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono text-xs font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {task.id}
                  </span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 text-base">
                      <span className="currency-symbol">₹</span>{Math.round(task.totalFee * 0.85)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">worker net</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">
                    {isMizo ? task.titleMizo : task.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {task.notes || 'No special notes'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">From:</span>
                    <div className="font-medium text-slate-200">{getLocalityName(task.pickupLocalityId)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">To:</span>
                    <div className="font-medium text-slate-200">{getLocalityName(task.dropLocalityId)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                    {task.stairStepsCount} steps
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    Difficulty {task.hillDifficulty}/5
                  </span>
                </div>

                <button
                  onClick={() => onUpdateTaskStatus(task.id, 'ACCEPTED', { workerId: currentWorker?.id || 'wrk_mizo_01' })}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isMizo ? 'Hna Pawm Rawh (Claim Task)' : 'Accept Task'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completion Modal requiring OTP or Low-Connectivity Token */}
      {activeCompletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isMizo ? 'Hna Zawh Finfiahna' : 'Verify Task Completion'}
                  </h3>
                  <p className="text-[11px] text-slate-400">{activeCompletingTask.id}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveCompletingTask(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            {completionError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{completionError}</span>
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isMizo ? 'Chhawrtu OTP (6 Digits)' : 'Client Delivery OTP Code:'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={inputOtp}
                  onChange={(e) => setInputOtp(e.target.value)}
                  placeholder="e.g. 482910"
                  className="w-full text-center tracking-widest font-mono text-xl font-bold bg-slate-950 border border-slate-800 rounded-xl py-2.5 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {isMizo ? 'Chhawrtu hnen aṭangin he code hi dil rawh' : 'Ask the client for this code upon delivery.'}
                </p>
              </div>

              {/* Or Low Connectivity Token fallback */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isMizo ? 'Signal a awm lohva Offline Token:' : 'Or Offline Hill Fallback Token:'}</span>
                </label>
                <input
                  type="text"
                  value={inputOfflineToken}
                  onChange={(e) => setInputOfflineToken(e.target.value)}
                  placeholder="e.g. MZ-8A4F-29BC"
                  className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isMizo ? 'Hna zawh dan chianna (Proof Note)' : 'Completion Note / Proof'}
                </label>
                <input
                  type="text"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="e.g. Delivered medicine packet directly to client gate"
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-950"
              >
                {isVerifying ? (
                  <span>{isMizo ? 'Finfiah mek...' : 'Verifying OTP...'}</span>
                ) : (
                  <span>{isMizo ? 'Hna Zo Fel Rawh & Hlawh La Rawh' : 'Confirm Completion & Credit Wallet'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
