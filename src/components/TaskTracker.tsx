import React, { useState } from 'react';
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
  UserCheck,
  Compass,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Navigation,
  Zap,
  ShoppingBag,
  MessageCircle
} from 'lucide-react';
import { MIZORAM_LOCALITIES } from '../utils/mizoramData.ts';
import { Rupee } from './CurrencySymbol.tsx';
import { PointToPointGpsMap } from './PointToPointGpsMap.tsx';
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
  const [expandedGpsTaskId, setExpandedGpsTaskId] = useState<string | null>(null);

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            {isMizo ? 'Thawktu Zawn Mek' : 'Searching Worker'}
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-blue-600" />
            {isMizo ? 'Pawm a ni tawh' : 'Assigned'}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-600 animate-spin" />
            {isMizo ? 'Kal Mek / Thawk Mek' : 'En Route / Active'}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {isMizo ? 'Zawh Fel a Ni' : 'Completed'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
            {isMizo ? 'Thulh a ni' : 'Cancelled'}
          </span>
        );
    }
  };

  const getLocalityName = (id: string) => {
    const loc = MIZORAM_LOCALITIES.find(l => l.id === id);
    return loc ? `${loc.name}` : id;
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-xs">
        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="text-slate-800 font-bold text-xs sm:text-sm">
          {isMizo ? 'Tun dinhmunah hna chhawr lai a awm lo' : 'No active errands yet'}
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {isMizo ? 'A chunga form hmang khian tirhkah hna thar siam rawh le.' : 'Use the form above to post a new errand or service task.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>{isMizo ? 'Hna Chhawr Dinhmun' : 'Active Errands & Tracking'}</span>
          <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
            {tasks.length}
          </span>
        </h2>
        <button
          onClick={onRefresh}
          className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
        >
          {isMizo ? 'Tithar Rawh' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const isPending = task.status === 'PENDING';
          const isAccepted = task.status === 'ACCEPTED';
          const isInProgress = task.status === 'IN_PROGRESS';
          const isCompleted = task.status === 'COMPLETED';

          return (
            <div
              key={task.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 transition hover:border-slate-300"
            >
              {/* Header line: ID, status, fee */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {task.id}
                  </span>
                  {task.urgency === 'urgent' && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded text-[10px] font-black flex items-center gap-0.5 animate-pulse">
                      <Zap className="w-2.5 h-2.5" /> URGENT
                    </span>
                  )}
                  {task.urgency === 'scheduled' && (
                    <span className="bg-purple-100 text-purple-900 border border-purple-300 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {task.scheduledTime || 'Scheduled'}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 ml-1">
                    {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(task.status)}
                  <span className="font-mono text-sm sm:text-base font-black text-slate-900 flex items-center">
                    <Rupee className="w-3.5 h-3.5 text-slate-900" />
                    <span>{task.totalFee}</span>
                  </span>
                </div>
              </div>

              {/* Title & Route */}
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                  {isMizo ? task.titleMizo : task.title}
                </h3>
                {task.notes && (
                  <p className="text-[11px] text-slate-600 mt-1 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    "{task.notes}"
                  </p>
                )}
              </div>

              {/* Route pill */}
              <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                <span className="flex items-center gap-1 font-semibold text-slate-800">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{getLocalityName(task.pickupLocalityId)}</span>
                </span>
                <span className="text-slate-400 font-bold">→</span>
                <span className="flex items-center gap-1 font-semibold text-slate-800">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>{getLocalityName(task.dropLocalityId)}</span>
                </span>
                <span className="text-slate-500 text-[11px] ml-auto">
                  {task.stairStepsCount} steps • Hill {task.hillDifficulty}/5
                </span>
              </div>

              {/* Item Purchase Budget card */}
              {task.estimatedItemCost && task.estimatedItemCost > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-700" />
                    <div>
                      <span className="font-bold block leading-tight">
                        {isMizo ? 'Thil Lei Man Tur (Budget):' : 'Item Purchase Budget:'} ₹{task.estimatedItemCost}
                      </span>
                      <span className="text-[10px] text-amber-800">
                        Payment: <strong className="uppercase">{task.paymentMode || 'COD'}</strong>
                      </span>
                    </div>
                  </div>
                  {task.actualItemCost ? (
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-800 font-bold block">{isMizo ? 'Bill Dik Tak:' : 'Actual Store Bill:'}</span>
                      <span className="font-mono font-black text-emerald-900 text-sm">₹{task.actualItemCost}</span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">{isMizo ? 'Total Payable:' : 'Total Payable:'}</span>
                      <span className="font-mono font-black text-slate-900 text-xs">
                        ₹{task.totalFee + task.estimatedItemCost}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Point-to-Point GPS Bar */}
              {(() => {
                const pLoc = MIZORAM_LOCALITIES.find(l => l.id === task.pickupLocalityId) || MIZORAM_LOCALITIES[0];
                const dLoc = MIZORAM_LOCALITIES.find(l => l.id === task.dropLocalityId) || MIZORAM_LOCALITIES[1];
                const pGps = task.pickupGps || { lat: pLoc.latitude, lng: pLoc.longitude, name: pLoc.name, elevationMeters: pLoc.elevationMeters };
                const dGps = task.dropGps || { lat: dLoc.latitude, lng: dLoc.longitude, name: dLoc.name, elevationMeters: dLoc.elevationMeters };
                const isGpsOpen = expandedGpsTaskId === task.id;
                const gMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pGps.lat},${pGps.lng}&destination=${dGps.lat},${dGps.lng}`;

                return (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                        <Compass className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-slate-800">GPS Point-to-Point:</span>
                        <span className="font-mono text-slate-500">
                          {pGps.lat.toFixed(3)}°N → {dGps.lat.toFixed(3)}°N
                        </span>
                        {task.gpsRoute && (
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-200">
                            {task.gpsRoute.roadDistanceKm} km
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedGpsTaskId(isGpsOpen ? null : task.id)}
                          className="text-[11px] text-emerald-800 font-bold hover:text-emerald-950 flex items-center gap-0.5"
                        >
                          <Navigation className="w-3 h-3 text-emerald-600" />
                          <span>{isGpsOpen ? (isMizo ? 'Map Thup' : 'Hide Map') : (isMizo ? 'GPS Map En' : 'View GPS Map')}</span>
                          {isGpsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        <a
                          href={gMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-600 hover:text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 shadow-2xs font-medium"
                          title="Open turn-by-turn navigation in Google Maps"
                        >
                          <ExternalLink className="w-3 h-3 text-emerald-600" />
                          <span className="hidden sm:inline">Google Maps</span>
                        </a>
                      </div>
                    </div>

                    {isGpsOpen && (
                      <div className="pt-2 border-t border-emerald-100 animate-fadeIn">
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

              {/* Assigned Worker (if accepted) */}
              {task.workerName && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                      {task.workerName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-slate-900 block truncate">{task.workerName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{task.workerPhone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`https://wa.me/${task.workerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        isMizo 
                          ? `Chibai ${task.workerName}, Mizoram Errand aṭangin ka hna (${task.titleMizo}) chungchangah ka rawn bia che a.` 
                          : `Hi ${task.workerName}, regarding my Mizoram Errand task (${task.title}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1 shadow-2xs transition"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`tel:${task.workerPhone}`}
                      className="bg-white hover:bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-lg border border-slate-200 font-semibold flex items-center gap-1 shadow-2xs"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Delivery Completion OTP & Fallback Code */}
              {!isCompleted && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-emerald-900 uppercase">Client Delivery OTP</span>
                    <span className="font-mono text-base sm:text-lg font-black text-emerald-700 tracking-wider">
                      {task.completionOtp}
                    </span>
                    <span className="text-[10px] text-emerald-700">Give to courier at gate</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-700 uppercase">Offline SMS Token</span>
                    <span className="font-mono text-xs font-bold text-amber-800">
                      {task.lowConnectivityToken}
                    </span>
                    <span className="text-[10px] text-slate-500">For zero-4G hill zones</span>
                  </div>
                </div>
              )}

              {/* Cancel Button if still Pending */}
              {(isPending || isAccepted) && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => onCancelTask(task.id)}
                    className="text-[11px] text-rose-700 hover:text-rose-900 font-semibold py-0.5 px-2.5 rounded-lg border border-rose-200 bg-rose-50 transition"
                  >
                    {isMizo ? 'Hna Thulh Rawh' : 'Cancel Task'}
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
