import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  Check, 
  X, 
  Sparkles, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  RefreshCw,
  Lock,
  Server,
  BarChart3
} from 'lucide-react';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard.tsx';
import type { PlatformModule, WorkerProfile, UserRole } from '../types/platform.ts';

interface AdminControlCenterProps {
  modules: PlatformModule[];
  workers: WorkerProfile[];
  userRole: UserRole;
  language: 'en' | 'mizo';
  onUpdateModule: (moduleId: string, updates: Partial<PlatformModule>) => Promise<void>;
  onVerifyWorker: (workerId: string, verified: boolean) => Promise<void>;
  onRefreshData: () => void;
}

export const AdminControlCenter: React.FC<AdminControlCenterProps> = ({
  modules,
  workers,
  userRole,
  language,
  onUpdateModule,
  onVerifyWorker,
  onRefreshData,
}) => {
  const isMizo = language === 'mizo';
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'modules' | 'workers' | 'supervisor'>('analytics');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [supervisorReport, setSupervisorReport] = useState<any | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [customAiQuery, setCustomAiQuery] = useState('');
  const [aiAssistantReply, setAiAssistantReply] = useState<string | null>(null);

  const canEditModules = userRole === 'super_admin' || userRole === 'system_admin';
  const canVerifyWorkers = userRole === 'super_admin' || userRole === 'system_admin' || userRole === 'moderator';

  const handleToggleModule = async (mod: PlatformModule) => {
    if (!canEditModules) {
      alert('Only Super Admin or System Admin can toggle dynamic modules.');
      return;
    }
    await onUpdateModule(mod.id, { enabled: !mod.enabled });
  };

  const handleRunAiAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/ai/supervisor-audit', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSupervisorReport(data.supervisorAudit);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleAskSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAiQuery.trim()) return;
    setIsAuditing(true);
    setAiAssistantReply(null);

    try {
      const res = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText: customAiQuery }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAssistantReply(
          isMizo ? data.analysis.explanationMizo : data.analysis.explanationEn
        );
      }
    } catch (err: any) {
      setAiAssistantReply('Supervisor query failed. Please verify API connectivity.');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* RBAC Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {isMizo ? 'Admin & Dynamic Plugin Control' : 'Platform Administration & Logic Supervisor'}
                </h2>
                <span className="font-mono text-xs font-bold uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                  {userRole}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isMizo 
                  ? 'Dynamic Modules, Thawktu KYC lehkha, leh AI Supervisor thurawn' 
                  : 'Dynamic module lifecycle, worker KYC verification, and terrain AI audit'}
              </p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('analytics')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeSubTab === 'analytics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isMizo ? 'Revenue & District Trends' : 'Revenue & District Trends'}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('modules')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'modules' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isMizo ? 'Plugin Modules' : 'Dynamic Modules'}
            </button>
            <button
              onClick={() => setActiveSubTab('workers')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'workers' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isMizo ? 'Thawktu KYC' : 'Worker KYC'}
            </button>
            <button
              onClick={() => {
                setActiveSubTab('supervisor');
                if (!supervisorReport) handleRunAiAudit();
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                activeSubTab === 'supervisor' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>AI Supervisor</span>
            </button>
          </div>
        </div>
      </div>

      {/* SubTab 0: Revenue & District Trends Data Visualization */}
      {activeSubTab === 'analytics' && (
        <AdminAnalyticsDashboard language={language} />
      )}

      {/* SubTab 1: Dynamic Module / Plugin Manager */}
      {activeSubTab === 'modules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>{isMizo ? 'Dynamic Modules / Plugins Dinhmun' : 'Dynamic Modules & Plugins Configuration'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isMizo
                  ? 'Server aṭangin hetiang plugin hi a tihtawp emaw chhawr theih a ni. Client app in a hriat nghal zel ang.'
                  : 'Toggle modules on/off dynamically. Client applications adapt instantly based on server rules.'}
              </p>
            </div>

            {!canEditModules && (
              <span className="text-xs text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800 flex items-center gap-1">
                <Lock className="w-3 h-3" /> View Only (Requires Super Admin / System Admin)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className={`p-4 rounded-xl border transition ${
                  mod.enabled
                    ? 'border-emerald-900/60 bg-slate-950'
                    : 'border-slate-800 bg-slate-950/50 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {isMizo ? mod.nameMizo : mod.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      v{mod.version}
                    </span>
                  </div>

                  {/* Toggle Button */}
                  <button
                    disabled={!canEditModules}
                    onClick={() => handleToggleModule(mod)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                      mod.enabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {mod.enabled ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-400 mb-3">
                  {isMizo ? mod.descriptionMizo : mod.description}
                </p>

                {/* Pricing Parameters */}
                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Base Price</span>
                    <span className="font-mono font-bold text-white"><span className="currency-symbol">₹</span>{mod.basePrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Per Km</span>
                    <span className="font-mono font-bold text-white"><span className="currency-symbol">₹</span>{mod.perKmRate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Hill Multiplier</span>
                    <span className="font-mono font-bold text-emerald-400">{mod.hillMultiplier}x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: Worker KYC Management */}
      {activeSubTab === 'workers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{isMizo ? 'Hna Thawktu KYC & Lehkha Pawmna' : 'Worker KYC Verification Queue'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isMizo ? 'Aizawl chhung a thawktute Driving License leh Voter ID check-na' : 'Verify Driving License, Aadhaar, and vehicle suitability for steep hill dispatch.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workers.map((w) => (
              <div key={w.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{w.name}</h4>
                    <span className="font-mono text-xs text-slate-400">{w.phone}</span>
                  </div>

                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    w.verified
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}>
                    {w.verified ? 'KYC Verified' : 'Pending Review'}
                  </span>
                </div>

                <div className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div>Document: <strong className="text-white uppercase">{w.kycDocType.replace('_', ' ')}</strong></div>
                  <div className="font-mono text-emerald-300">Doc #: {w.kycDocNumber}</div>
                  <div>Vehicle: <strong className="text-white">{w.vehicleType}</strong></div>
                  <div>Rating: <strong className="text-amber-400">{w.rating}★</strong> ({w.completedTasks} completed jobs)</div>
                </div>

                {canVerifyWorkers && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onVerifyWorker(w.id, !w.verified)}
                      className={`flex-1 text-xs font-semibold py-2 rounded-lg transition ${
                        w.verified
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {w.verified ? (isMizo ? 'Tih Tawp Leh (Revoke)' : 'Revoke Verification') : (isMizo ? 'Pawm Rawh (Approve KYC)' : 'Approve KYC')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 3: AI Logic Supervisor Console */}
      {activeSubTab === 'supervisor' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isMizo ? 'AI Logic Supervisor: Tlangram Rawngbawlna Chhutna' : 'AI Logic Supervisor: Hill Platform Audit'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isMizo ? 'Aizawl tlangchhip tana fairness chhutna leh thurawn' : 'Continuous terrain load monitoring, fraud mitigation, and locality fare integrity.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleRunAiAudit}
              disabled={isAuditing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isMizo ? 'Endik Ṭha Leh Rawh' : 'Run Supervisor Audit'}</span>
            </button>
          </div>

          {supervisorReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">System Health</div>
                  <div className="font-bold text-emerald-400 text-sm mt-0.5">{supervisorReport.systemHealth}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Active Workers</div>
                  <div className="font-bold text-white text-sm mt-0.5">{supervisorReport.metrics.activeWorkersOnline} Online</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">In Progress Tasks</div>
                  <div className="font-bold text-purple-400 text-sm mt-0.5">{supervisorReport.metrics.inProgressTasks}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Enabled Modules</div>
                  <div className="font-bold text-cyan-400 text-sm mt-0.5">{supervisorReport.metrics.activeModulesCount} Modules</div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {isMizo ? 'Supervisor Thurawn (Active Recommendations):' : 'AI Supervisor Recommendations:'}
                </h4>
                {supervisorReport.recommendations.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-indigo-900/40 text-xs flex items-start gap-3"
                  >
                    <span className="font-mono text-[10px] font-bold bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 shrink-0">
                      {rec.priority}
                    </span>
                    <span className="text-slate-300">
                      {isMizo ? rec.textMizo : rec.textEn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct Query to AI Dispatcher */}
          <form onSubmit={handleAskSupervisor} className="pt-2 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              {isMizo ? 'AI Supervisor Hnen a Zawhna Zawt Rawh:' : 'Ask AI Supervisor for Locality / Terrain Consultation:'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customAiQuery}
                onChange={(e) => setCustomAiQuery(e.target.value)}
                placeholder={
                  isMizo
                    ? 'Eg: Champhai aṭanga Lunglei inkar hna lak dan tur eng nge ni ang?'
                    : 'Eg: Suggest fair fare policy for heavy LPG delivery down 150 terrace steps in Kulikawn...'
                }
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isAuditing || !customAiQuery.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl font-semibold transition shrink-0"
              >
                {isAuditing ? 'Consulting...' : (isMizo ? 'Zawt Rawh' : 'Consult AI')}
              </button>
            </div>

            {aiAssistantReply && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 mt-2">
                <span className="font-bold text-white block mb-1">Supervisor Advisory:</span>
                {aiAssistantReply}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
