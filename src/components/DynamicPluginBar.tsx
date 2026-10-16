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
import { Rupee } from './CurrencySymbol.tsx';
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
    <div className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-xs mb-2.5 sm:mb-4">
      <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
            {isMizo ? 'Rawngbawlna & Dynamic Plugins' : 'Active Service Modules'}
          </h2>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold border border-slate-200">
            {modules.filter(m => m.enabled).length}/{modules.length}
          </span>
        </div>

        <button
          onClick={onManagePluginsClick}
          className="text-[11px] text-indigo-700 hover:text-indigo-900 flex items-center gap-1 font-semibold transition"
        >
          <Sliders className="w-3 h-3 text-indigo-600" />
          <span>{isMizo ? 'Rules' : 'Configure'}</span>
        </button>
      </div>

      {/* Swipeable on mobile with smooth snap, grid on desktop */}
      <div className="flex sm:grid sm:grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5 -mx-0.5 px-0.5">
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
              className={`min-w-[125px] sm:min-w-0 p-2 rounded-xl border text-left flex flex-col justify-between transition shrink-0 ${
                !isEnabled
                  ? 'border-slate-200 bg-slate-100/60 opacity-50 cursor-not-allowed text-slate-400'
                  : isSelected
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className={`p-1.5 rounded-lg ${
                  isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {getIcon(mod.iconName)}
                </div>

                {isEnabled ? (
                  <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200">
                    {mod.hillMultiplier}x
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">
                    Off
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-xs leading-snug truncate text-slate-900">
                  {isMizo ? mod.nameMizo : mod.name}
                </h3>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                  <span className="flex items-center">Base <Rupee className="w-2.5 h-2.5 ml-0.5 text-slate-600" />{mod.basePrice}</span>
                  <span className="flex items-center"><Rupee className="w-2.5 h-2.5 text-slate-600" />{mod.perKmRate}/km</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
