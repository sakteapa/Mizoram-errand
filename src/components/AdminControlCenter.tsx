import React, { useState, useEffect } from 'react';
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
  BarChart3,
  Percent,
  Coins,
  CheckCircle2,
  Info
} from 'lucide-react';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard.tsx';
import { Rupee } from './CurrencySymbol.tsx';
import type { PlatformModule, WorkerProfile, UserRole, PlatformSettings } from '../types/platform.ts';

interface AdminControlCenterProps {
  modules: PlatformModule[];
  workers: WorkerProfile[];
  userRole: UserRole;
  language: 'en' | 'mizo';
  platformSettings?: PlatformSettings;
  onUpdateModule: (moduleId: string, updates: Partial<PlatformModule>) => Promise<void>;
  onVerifyWorker: (workerId: string, verified: boolean) => Promise<void>;
  onUpdateSettings?: (newFee: number, noticeMizo?: string, noticeEn?: string) => Promise<void>;
  onRefreshData: () => void;
}

export const AdminControlCenter: React.FC<AdminControlCenterProps> = ({
  modules,
  workers,
  userRole,
  language,
  platformSettings,
  onUpdateModule,
  onVerifyWorker,
  onUpdateSettings,
  onRefreshData,
}) => {
  const isMizo = language === 'mizo';
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'fee' | 'modules' | 'workers' | 'supervisor'>('analytics');
  const [feePercentage, setFeePercentage] = useState<number>(platformSettings?.platformFeePercentage ?? 0);
  const [customNoticeMizo, setCustomNoticeMizo] = useState(platformSettings?.promotionalNoticeMizo || 'Platform Fee lak a ni lo (0%). Hlawh 100% thawktu kutah a lut vek e!');
  const [customNoticeEn, setCustomNoticeEn] = useState(platformSettings?.promotionalNoticeEn || '0% Platform Fee Active. Workers keep 100% of task earnings!');
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [feeSaveFeedback, setFeeSaveFeedback] = useState<string | null>(null);
  const [simulatedFare, setSimulatedFare] = useState<number>(300);

  useEffect(() => {
    if (platformSettings) {
      setFeePercentage(platformSettings.platformFeePercentage);
      if (platformSettings.promotionalNoticeMizo) setCustomNoticeMizo(platformSettings.promotionalNoticeMizo);
      if (platformSettings.promotionalNoticeEn) setCustomNoticeEn(platformSettings.promotionalNoticeEn);
    }
  }, [platformSettings]);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [supervisorReport, setSupervisorReport] = useState<any | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [customAiQuery, setCustomAiQuery] = useState('');
  const [aiAssistantReply, setAiAssistantReply] = useState<string | null>(null);

  const canEditModules = userRole === 'super_admin' || userRole === 'system_admin';
  const canVerifyWorkers = userRole === 'super_admin' || userRole === 'system_admin' || userRole === 'moderator';

  const handleSavePlatformFee = async () => {
    if (!canEditModules) {
      alert(isMizo ? 'Super Admin emaw System Admin chauhvin platform fee an thlak thei.' : 'Only Super Admin and System Admin can update Platform Fee.');
      return;
    }
    setIsSavingFee(true);
    setFeeSaveFeedback(null);
    try {
      if (onUpdateSettings) {
        await onUpdateSettings(feePercentage, customNoticeMizo, customNoticeEn);
      } else {
        const res = await fetch('/api/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': userRole,
          },
          body: JSON.stringify({
            platformFeePercentage: feePercentage,
            promotionalNoticeMizo: customNoticeMizo,
            promotionalNoticeEn: customNoticeEn,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update settings');
      }
      setFeeSaveFeedback(
        isMizo 
          ? `Platform fee chu ${feePercentage}%-ah hlawhtling takin thlak a ni e!` 
          : `Platform fee successfully updated to ${feePercentage}%!`
      );
      setTimeout(() => setFeeSaveFeedback(null), 4000);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error updating platform fee');
    } finally {
      setIsSavingFee(false);
    }
  };

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
              onClick={() => setActiveSubTab('fee')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
                activeSubTab === 'fee' ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Percent className="w-3.5 h-3.5 text-cyan-600" />
              <span>{isMizo ? `Platform Fee (${feePercentage}%)` : `Commission (${feePercentage}%)`}</span>
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
        <AdminAnalyticsDashboard language={language} platformFeePercentage={feePercentage} />
      )}

      {/* SubTab: Platform Fee & Commission Manager */}
      {activeSubTab === 'fee' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-600" />
                <span>{isMizo ? 'Platform Commission Fee Enkawlna' : 'Platform Fee & Commission Manager'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isMizo 
                  ? 'Platform commission percentage hi i duh hun hunah 0% aṭanga 30% thleng i thlak danglam thei a, thawktu payout-ah nghawng a nei nghal ang.' 
                  : 'Adjust platform fee dynamically between 0% and 30%. Takes effect instantly across all jobs.'}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 ${
                feePercentage === 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${feePercentage === 0 ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></span>
                {feePercentage === 0 
                  ? (isMizo ? '0% Fee Active (Free Launch)' : '0% Fee (Free Launch)')
                  : `${feePercentage}% Fee Active`}
              </span>
            </div>
          </div>

          {/* Current Live Policy Hero Banner */}
          <div className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            feePercentage === 0
              ? 'bg-gradient-to-r from-emerald-50 to-teal-50/50 border-emerald-200'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50/50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                feePercentage === 0 ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {feePercentage}%
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  {feePercentage === 0
                    ? (isMizo ? '0% Platform Fee: Thawktute tan 100% Hlawh' : '0% Platform Fee: 100% Payout to Couriers')
                    : (isMizo ? `${feePercentage}% Platform Fee Active` : `${feePercentage}% Commission Model Active`)}
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {feePercentage === 0
                    ? (isMizo 
                        ? 'Tun dinhmunah platform-in commission a la lo a, client-te pek hna man zawng zawng 100% thawktu account-ah a lut vek.' 
                        : 'Currently, the platform takes 0% cut. 100% of the customer fare is directly credited to workers.')
                    : (isMizo
                        ? `Client fare aṭangin ${feePercentage}% platform enkawl nan a lut a, ${100 - feePercentage}% thawktuin an dawng ang.`
                        : `Platform takes ${feePercentage}% for infrastructure and support, couriers receive ${100 - feePercentage}%.`)}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Worker Payout Ratio</span>
              <span className={`text-base sm:text-lg font-mono font-black ${feePercentage === 0 ? 'text-emerald-700' : 'text-blue-700'}`}>
                {100 - feePercentage}%
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {isMizo ? 'Quick Presets (Hmeh zawk a thlan theih):' : 'Quick Presets (Click to select):'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { val: 0, labelMizo: '0% (Free Launch)', labelEn: '0% (Free Launch)', descMizo: '100% Worker Payout' },
                { val: 5, labelMizo: '5% (Maintenance)', labelEn: '5% (Maintenance)', descMizo: '95% Worker Payout' },
                { val: 10, labelMizo: '10% (Balanced)', labelEn: '10% (Balanced)', descMizo: '90% Worker Payout' },
                { val: 15, labelMizo: '15% (Standard)', labelEn: '15% (Standard)', descMizo: '85% Worker Payout' },
                { val: 20, labelMizo: '20% (Enterprise)', labelEn: '20% (Enterprise)', descMizo: '80% Worker Payout' },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setFeePercentage(preset.val)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    feePercentage === preset.val
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{isMizo ? preset.labelMizo : preset.labelEn}</span>
                    {feePercentage === preset.val && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-[10px] block mt-0.5 ${feePercentage === preset.val ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {preset.descMizo}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Slider Control */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-600" />
                <span>{isMizo ? 'Custom Percentage Slider' : 'Custom Fee Percentage Slider'}</span>
              </label>
              <span className="font-mono font-bold text-sm text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                {feePercentage}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={feePercentage}
              onChange={(e) => setFeePercentage(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0% (Free)</span>
              <span>10%</span>
              <span>20%</span>
              <span>30% (Max)</span>
            </div>
          </div>

          {/* Real-time Fare Split Calculator Simulator */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>{isMizo ? 'Live Fare Split Entirnan (Simulation)' : 'Live Fare Split Simulation'}</span>
              </span>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500">{isMizo ? 'Task Fare:' : 'Sample Fare:'}</span>
                <span className="font-mono font-bold flex items-center text-slate-900">
                  <Rupee className="w-3 h-3 text-slate-800" />
                  <input
                    type="number"
                    value={simulatedFare}
                    onChange={(e) => setSimulatedFare(Math.max(50, parseInt(e.target.value, 10) || 50))}
                    className="w-16 px-1 py-0.5 rounded border border-slate-200 font-mono text-xs text-right"
                  />
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block uppercase">
                  {isMizo ? `Thawktu Hlawh (${100 - feePercentage}%)` : `Worker Receives (${100 - feePercentage}%)`}
                </span>
                <span className="text-base font-mono font-black text-emerald-900 flex items-center mt-0.5">
                  <Rupee className="w-3.5 h-3.5" />
                  <span>{Math.round(simulatedFare * ((100 - feePercentage) / 100))}</span>
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-cyan-50 border border-cyan-200">
                <span className="text-[10px] text-cyan-800 font-bold block uppercase">
                  {isMizo ? `Platform Commission (${feePercentage}%)` : `Platform Commission (${feePercentage}%)`}
                </span>
                <span className="text-base font-mono font-black text-cyan-900 flex items-center mt-0.5">
                  <Rupee className="w-3.5 h-3.5" />
                  <span>{Math.round(simulatedFare * (feePercentage / 100))}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Feedback & Save Action */}
          {feeSaveFeedback && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feeSaveFeedback}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500">
              {isMizo ? 'Super Admin / System Admin tan chauh khawih theih a ni.' : 'Requires Super Admin or System Admin permissions.'}
            </span>
            <button
              type="button"
              disabled={isSavingFee || !canEditModules}
              onClick={handleSavePlatformFee}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                !canEditModules
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              {isSavingFee ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isMizo ? 'Save Mek...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isMizo ? 'Duh Dan Save Rawh' : 'Save Platform Fee'}</span>
                </>
              )}
            </button>
          </div>
        </div>
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
