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
import { Rupee } from './CurrencySymbol.tsx';
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
    <div className="space-y-4">
      {/* RBAC Header (Light Theme) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {isMizo ? 'Admin & Dynamic Plugin Control' : 'Platform Administration & Supervisor'}
                </h2>
                <span className="font-mono text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded border border-indigo-200">
                  {userRole}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isMizo 
                  ? 'Dynamic Modules, Thawktu KYC lehkha, leh AI Supervisor thurawn' 
                  : 'Dynamic plugin lifecycle, worker KYC verification, and terrain AI audit'}
              </p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveSubTab('analytics')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
                activeSubTab === 'analytics' ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Revenue &amp; Trends</span>
            </button>
            <button
              onClick={() => setActiveSubTab('modules')}
              className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                activeSubTab === 'modules' ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isMizo ? 'Plugins' : 'Modules'}
            </button>
            <button
              onClick={() => setActiveSubTab('workers')}
              className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                activeSubTab === 'workers' ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isMizo ? 'Thawktu KYC' : 'Worker KYC'}
            </button>
            <button
              onClick={() => {
                setActiveSubTab('supervisor');
                if (!supervisorReport) handleRunAiAudit();
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 shrink-0 ${
                activeSubTab === 'supervisor' ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
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
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>{isMizo ? 'Dynamic Modules / Plugins Dinhmun' : 'Dynamic Modules & Plugins Configuration'}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {isMizo ? 'Plugin enable / disable dan in client app a khawih nghal zel ang.' : 'Toggle modules on/off dynamically. Client apps adapt instantly.'}
              </p>
            </div>

            {!canEditModules && (
              <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3" /> View Only (Super Admin required)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className={`p-3.5 rounded-xl border transition ${
                  mod.enabled
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-slate-200 bg-slate-50 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {isMizo ? mod.nameMizo : mod.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      v{mod.version}
                    </span>
                  </div>

                  <button
                    disabled={!canEditModules}
                    onClick={() => handleToggleModule(mod)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                      mod.enabled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
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

                <p className="text-[11px] text-slate-600 mb-2">
                  {isMizo ? mod.descriptionMizo : mod.description}
                </p>

                <div className="grid grid-cols-3 gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Base</span>
                    <span className="font-mono font-bold text-slate-900 flex items-center">
                      <Rupee className="w-3 h-3 text-slate-800" />
                      <span>{mod.basePrice}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Per Km</span>
                    <span className="font-mono font-bold text-slate-900 flex items-center">
                      <Rupee className="w-3 h-3 text-slate-800" />
                      <span>{mod.perKmRate}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Hill Mult.</span>
                    <span className="font-mono font-bold text-emerald-700">{mod.hillMultiplier}x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: Worker KYC Management */}
      {activeSubTab === 'workers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>{isMizo ? 'Hna Thawktu KYC & Lehkha Pawmna' : 'Worker KYC Verification Queue'}</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Verify driving licenses and IDs for safe terrain deployment across Mizoram.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workers.map((w) => (
              <div key={w.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{w.name}</h4>
                    <span className="font-mono text-[11px] text-slate-500">{w.phone}</span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    w.verified
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {w.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
                  <div>Doc: <strong className="text-slate-900 uppercase">{w.kycDocType.replace('_', ' ')}</strong> ({w.kycDocNumber})</div>
                  <div>Rating: <strong className="text-amber-700">{w.rating}★</strong> ({w.completedTasks} jobs)</div>
                </div>

                {canVerifyWorkers && (
                  <button
                    onClick={() => onVerifyWorker(w.id, !w.verified)}
                    className={`w-full text-xs font-bold py-1.5 rounded-lg transition ${
                      w.verified
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {w.verified ? 'Revoke Verification' : 'Approve KYC'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 3: AI Logic Supervisor Console */}
      {activeSubTab === 'supervisor' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isMizo ? 'AI Logic Supervisor: Tlangram Platform Audit' : 'AI Logic Supervisor: Hill Platform Audit'}
                </h3>
              </div>
            </div>

            <button
              onClick={handleRunAiAudit}
              disabled={isAuditing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition"
            >
              <RefreshCw className={`w-3 h-3 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isMizo ? 'Check Leh' : 'Audit'}</span>
            </button>
          </div>

          {supervisorReport && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">System Health</div>
                  <div className="font-bold text-emerald-700 text-xs mt-0.5">{supervisorReport.systemHealth}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Active Workers</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{supervisorReport.metrics.activeWorkersOnline} Online</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Active Tasks</div>
                  <div className="font-bold text-purple-700 text-xs mt-0.5">{supervisorReport.metrics.inProgressTasks}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Modules</div>
                  <div className="font-bold text-cyan-700 text-xs mt-0.5">{supervisorReport.metrics.activeModulesCount} Active</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">
                  Supervisor Recommendations:
                </h4>
                {supervisorReport.recommendations.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-indigo-100 text-xs flex items-start gap-2"
                  >
                    <span className="font-mono text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded border border-indigo-200 shrink-0">
                      {rec.priority}
                    </span>
                    <span className="text-slate-700 text-[11px]">
                      {isMizo ? rec.textMizo : rec.textEn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct Query */}
          <form onSubmit={handleAskSupervisor} className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customAiQuery}
                onChange={(e) => setCustomAiQuery(e.target.value)}
                placeholder={isMizo ? 'AI Supervisor hnenah zawhna zawt rawh...' : 'Ask AI Supervisor for hill pricing or dispatch advice...'}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={isAuditing || !customAiQuery.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition shrink-0"
              >
                {isMizo ? 'Zawt' : 'Ask'}
              </button>
            </div>

            {aiAssistantReply && (
              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-950 mt-1.5">
                <span className="font-bold block mb-0.5">Advisory:</span>
                {aiAssistantReply}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
