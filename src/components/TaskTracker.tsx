import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Key, 
  WifiOff, 
  AlertCircle, 
  ChevronRight,
  TrendingUp,
  Footprints,
  UserCheck
} from 'lucide-react';
import { MIZORAM_LOCALITIES } from '../utils/mizoramData.ts';
import type { TaskRecord, TaskStatus } from '../types/platform.ts';

interface TaskTrackerProps {
  tasks: TaskRecord[];
  language: 'en' | 'mizo';
  onRefresh: () => void;
  onCancelTask: (taskId: string) => void;
}

export const TaskTracker: React.FC<TaskTrackerProps> = ({
  tasks,
  language,
  onRefresh,
  onCancelTask,
}) => {
  const isMizo = language === 'mizo';

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            {isMizo ? 'Thawktu Zawn Mek (Pending)' : 'Searching Worker (Pending)'}
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            {isMizo ? 'Pawm a ni tawh (Accepted)' : 'Assigned (Accepted)'}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            {isMizo ? 'Kal Mek / Thawk Mek (In Progress)' : 'En Route / In Progress'}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isMizo ? 'Zawh Fel a Ni (Completed)' : 'Completed & Verified'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            {isMizo ? 'Thulh a ni (Cancelled)' : 'Cancelled'}
          </span>
        );
    }
  };

  const getLocalityName = (id: string) => {
    const loc = MIZORAM_LOCALITIES.find(l => l.id === id);
    return loc ? `${loc.name} (${loc.elevationMeters}m)` : id;
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-white font-semibold text-sm">
          {isMizo ? 'Tun dinhmunah hna chhawr lai a awm lo' : 'No active tasks yet'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          {isMizo
            ? 'A chunga form hmang khian tirhkah emaw rawngbawlna hna thar siam rawh le.'
            : 'Post a new errand or service task above to see live hill dispatch tracking.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>{isMizo ? 'I Hna Chhawr Dinhmun (Live Task Tracking)' : 'Live Errands & Service Tasks'}</span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </h2>
        <button
          onClick={onRefresh}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
        >
          {isMizo ? 'Tithar Rawh (Refresh)' : 'Refresh Feed'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => {
          const isPending = task.status === 'PENDING';
          const isAccepted = task.status === 'ACCEPTED';
          const isInProgress = task.status === 'IN_PROGRESS';
          const isCompleted = task.status === 'COMPLETED';

          return (
            <div
              key={task.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden"
            >
              {/* Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-1 rounded border border-emerald-800">
                    {task.id}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(task.status)}
                  <span className="font-mono text-base font-extrabold text-white">
                    <span className="currency-symbol">₹</span>{task.totalFee}
                  </span>
                </div>
              </div>

              {/* Title & Route */}
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  {isMizo ? task.titleMizo : task.title}
                </h3>
                {task.notes && (
                  <p className="text-xs text-slate-400 mt-1 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                    "{task.notes}"
                  </p>
                )}
              </div>

              {/* Locality route and hill stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">
                      {isMizo ? 'Lakna (Pickup)' : 'Pickup'}
                    </div>
                    <div className="font-medium text-slate-200">
                      {getLocalityName(task.pickupLocalityId)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">
                      {isMizo ? 'Dahna (Drop)' : 'Destination'}
                    </div>
                    <div className="font-medium text-slate-200">
                      {getLocalityName(task.dropLocalityId)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 col-span-1 sm:col-span-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                    Hill Difficulty: <strong className="text-slate-200">{task.hillDifficulty}/5</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                    Steps: <strong className="text-slate-200">{task.stairStepsCount} stairs</strong>
                  </span>
                  <span className="text-slate-500 ml-auto">
                    Category: <strong className="text-slate-300">{task.category}</strong>
                  </span>
                </div>
              </div>

              {/* Assigned Worker Info (if accepted or in progress) */}
              {task.workerName && (
                <div className="bg-slate-950 border border-emerald-900/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                      {task.workerName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1">
                        <span>{task.workerName}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {task.workerPhone}
                      </div>
                    </div>
                  </div>

                  <a
                    href={`tel:${task.workerPhone}`}
                    className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-700/50 flex items-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{isMizo ? 'Phone Rawh' : 'Call Worker'}</span>
                  </a>
                </div>
              )}

              {/* Completion Verification Codes (Vital for client security!) */}
              {!isCompleted && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Delivery Completion OTP */}
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isMizo ? 'Hna Zawh Finfiahna OTP:' : 'Client Delivery OTP:'}</span>
                      </div>
                      <div className="text-[10px] text-emerald-400/80 mt-0.5">
                        {isMizo ? 'Bungrua i dawn hunah thawktu hrilh rawh' : 'Give to worker upon delivery'}
                      </div>
                    </div>
                    <span className="font-mono text-lg font-black text-white bg-emerald-900 px-2.5 py-1 rounded border border-emerald-700 tracking-wider">
                      {task.completionOtp}
                    </span>
                  </div>

                  {/* Low connectivity hill fallback code */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isMizo ? 'Offline SMS Fallback:' : 'Zero-4G Fallback Code:'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {isMizo ? 'Signal a awm lohva SMS hman tur' : 'For hill pockets with no internet'}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-300 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                      {task.lowConnectivityToken}
                    </span>
                  </div>
                </div>
              )}

              {/* Stepper Timeline */}
              <div className="border-t border-slate-800/80 pt-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  {isMizo ? 'Kalphung Chianna (Workflow Stepper)' : 'Workflow Audit Trail'}
                </div>
                <div className="space-y-2">
                  {task.timeline.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                      <div className="flex-1">
                        <span className="font-medium text-slate-200">
                          {isMizo ? step.noteMizo : step.note}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">
                          {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancel Button if still Pending */}
              {(isPending || isAccepted) && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => onCancelTask(task.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium py-1 px-3 rounded-lg border border-rose-900/50 bg-rose-950/30 hover:bg-rose-950/60 transition"
                  >
                    {isMizo ? 'Hna Thulh Rawh (Cancel)' : 'Cancel Task'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
