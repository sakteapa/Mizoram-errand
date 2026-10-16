import React from 'react';
import { 
  Package, 
  Bike, 
  Zap, 
  Wrench, 
  Flame, 
  Cross, 
  ShoppingBag, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import type { PlatformModule, ServiceCategory } from '../types/platform.ts';

interface DynamicPluginBarProps {
  modules: PlatformModule[];
  selectedCategory: ServiceCategory;
  onSelectCategory: (cat: ServiceCategory) => void;
  language: 'en' | 'mizo';
  onManagePluginsClick: () => void;
}

export const DynamicPluginBar: React.FC<DynamicPluginBarProps> = ({
  modules,
  selectedCategory,
  onSelectCategory,
  language,
  onManagePluginsClick,
}) => {
  const isMizo = language === 'mizo';

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Package': return <Package className="w-4 h-4" />;
      case 'Bike': return <Bike className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'Wrench': return <Wrench className="w-4 h-4" />;
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Cross': return <Cross className="w-4 h-4" />;
      case 'ShoppingBag': return <ShoppingBag className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {isMizo ? 'Dynamic Module & Rawngbawlna Plugins' : 'Dynamic Platform Modules & Plugins'}
          </h2>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
            {modules.filter(m => m.enabled).length}/{modules.length} {isMizo ? 'Hman theih' : 'Active'}
          </span>
        </div>

        <button
          onClick={onManagePluginsClick}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium transition"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isMizo ? 'Server Plugin Rules Tihdanglam' : 'Configure Dynamic Rules'}</span>
        </button>
      </div>

      {/* Module Pill Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {modules.map((mod) => {
          const isSelected = selectedCategory === mod.category;
          const isEnabled = mod.enabled;

          return (
            <button
              key={mod.id}
              onClick={() => {
                if (isEnabled) {
                  onSelectCategory(mod.category);
                }
              }}
              disabled={!isEnabled}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition relative overflow-hidden group ${
                !isEnabled
                  ? 'border-slate-800/60 bg-slate-950/40 opacity-50 cursor-not-allowed'
                  : isSelected
                  ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md ring-1 ring-emerald-500/30'
                  : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-emerald-400'
                }`}>
                  {getIcon(mod.iconName)}
                </div>

                {isEnabled ? (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                    {mod.hillMultiplier}x hill
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/60 flex items-center gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5" /> Disabled
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-xs leading-tight line-clamp-1">
                  {isMizo ? mod.nameMizo : mod.name}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                  <span>Base <span className="currency-symbol">₹</span>{mod.basePrice}</span>
                  <span className="text-slate-500"><span className="currency-symbol">₹</span>{mod.perKmRate}/km</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
