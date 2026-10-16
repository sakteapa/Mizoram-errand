import React, { useState } from 'react';
import { WifiOff, Radio, Check, ChevronDown, ChevronUp, Smartphone } from 'lucide-react';

interface LowConnectivityBannerProps {
  language: 'en' | 'mizo';
}

export const LowConnectivityBanner: React.FC<LowConnectivityBannerProps> = ({ language }) => {
  const isMizo = language === 'mizo';
  const [isExpanded, setIsExpanded] = useState(false);
  const [testSimToken, setTestSimToken] = useState('MZ-8A4F-29BC');
  const [simulatedSmsResult, setSimulatedSmsResult] = useState<string | null>(null);

  const handleSimulateSms = () => {
    setSimulatedSmsResult(
      isMizo
        ? `[SMS SUCCESS] 56161 ah "${testSimToken} DONE" thawn a ni. Server in offline token a pawm e.`
        : `[SMS GATEWAY] Token "${testSimToken} DONE" processed via Mizoram Airtel/Jio SMS shortcode 56161. Task marked verified!`
    );
  };

  return (
    <div className="bg-slate-900/90 border border-amber-900/40 rounded-2xl p-4 mb-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>{isMizo ? 'Mizoram Hill Low-Connectivity Fallback Architecture' : 'Mizoram Hill Low-Connectivity Fallback Architecture'}</span>
              <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                2G/SMS Compatible
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {isMizo
                ? 'Aizawl kawng kual leh Durtlang / Tuirial ruam a mobile data chhiat pawha hna zawh theihna'
                : 'Guarantees reliable task verification even when field workers lose 4G/5G in steep valleys.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 text-xs"
        >
          <span>{isExpanded ? (isMizo ? 'Khar Rawh' : 'Collapse Details') : (isMizo ? 'En Chianna' : 'View Offline Protocol')}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Cryptographic Seed</span>
              </div>
              <p className="text-[11px] text-slate-400">
                When a task is booked, an 8-character deterministic hex token is baked into the client’s phone local storage.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. SMS / USSD Gateway</span>
              </div>
              <p className="text-[11px] text-slate-400">
                In zero-data pockets (e.g. Selesih descent or Tanhril valley), the courier texts `&lt;TOKEN&gt; DONE` to 56161.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-400" />
                <span>3. Zero-State Reconciliation</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Our Go/Node backend verifies the hash in &lt;1ms and releases worker payout without requiring continuous web sockets.
              </p>
            </div>
          </div>

          {/* Interactive Tester */}
          <div className="bg-slate-950 p-3 rounded-xl border border-amber-900/30 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Test SMS String:</span>
              <span className="font-mono text-xs bg-slate-900 text-amber-300 px-2 py-1 rounded border border-slate-800">
                "{testSimToken} COMPLETED"
              </span>
            </div>
            <button
              onClick={handleSimulateSms}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-3 py-1 rounded-lg font-semibold transition"
            >
              Simulate 2G SMS Dispatch
            </button>
          </div>

          {simulatedSmsResult && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-xs font-mono">
              {simulatedSmsResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
