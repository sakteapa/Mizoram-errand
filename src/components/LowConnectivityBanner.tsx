import React, { useState } from 'react';
import { WifiOff, Radio, Check, ChevronDown, ChevronUp, Smartphone } from 'lucide-react';

interface LowConnectivityBannerProps {
  language: 'en' | 'mizo';
}

export const LowConnectivityBanner: React.FC<LowConnectivityBannerProps> = ({ language }) => {
  const isMizo = language === 'mizo';
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [testSimToken, setTestSimToken] = useState('MZ-8A4F-29BC');
  const [simulatedSmsResult, setSimulatedSmsResult] = useState<string | null>(null);

  const handleSimulateSms = () => {
    setSimulatedSmsResult(
      isMizo
        ? `[SMS SUCCESS] 56161 ah "${testSimToken} DONE" thawn a ni. Server in offline token a pawm e.`
        : `[SMS GATEWAY] Token "${testSimToken} DONE" processed via Mizoram SMS shortcode 56161. Verified!`
    );
  };

  if (isDismissed) {
    return (
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setIsDismissed(false)}
          className="text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium transition"
        >
          <WifiOff className="w-2.5 h-2.5 text-amber-600" />
          <span>{isMizo ? 'Offline SMS Fallback' : 'Offline SMS'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2 sm:p-2.5 mb-2.5 sm:mb-3 text-xs shadow-2xs">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <WifiOff className="w-3 h-3" />
          </div>
          <div className="truncate">
            <span className="font-bold text-amber-950 text-xs mr-1.5">
              {isMizo ? 'Offline SMS Fallback' : 'Low-Connectivity Offline'}
            </span>
            <span className="text-[9px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.2 rounded border border-amber-300 hidden sm:inline">
              2G/SMS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-0.5 text-[10px] sm:text-[11px] bg-white/80 px-2 py-0.5 rounded-md border border-amber-200"
          >
            <span>{isExpanded ? (isMizo ? 'Khar' : 'Hide') : (isMizo ? 'En Chianna' : 'Details')}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-amber-600 hover:text-amber-900 text-xs px-1.5 py-0.5 rounded-md hover:bg-amber-100/50"
            title="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-2.5 border-t border-amber-200/80 space-y-2.5 animate-fadeIn">
          <p className="text-[11px] text-amber-800">
            {isMizo
              ? 'Aizawl kawng kual leh ruam thuk a mobile data awm loh pawhin SMS hmangin hna a zo fel theih reng.'
              : 'Reliable task verification using deterministic SHA tokens via SMS shortcode 56161 when couriers lose 4G in valleys.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-950 block">1. Cryptographic Token</span>
              <span className="text-slate-600">8-char hex code generated in local storage.</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-950 block">2. 2G SMS Shortcode</span>
              <span className="text-slate-600">Courier texts token to 56161 without data.</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-950 block">3. Immediate Payout</span>
              <span className="text-slate-600">Backend reconciles offline ledger in &lt;1ms.</span>
            </div>
          </div>

          <div className="bg-white p-2 rounded-lg border border-amber-200 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-amber-900 font-bold">
              "{testSimToken} DONE"
            </span>
            <button
              onClick={handleSimulateSms}
              className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] px-2.5 py-1 rounded-md font-semibold transition"
            >
              Simulate 2G SMS Dispatch
            </button>
          </div>

          {simulatedSmsResult && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900 text-[11px] font-mono">
              {simulatedSmsResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
