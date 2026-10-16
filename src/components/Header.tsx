import React from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Globe, 
  UserCheck, 
  Wifi, 
  Sliders, 
  Briefcase, 
  User, 
  Code2,
  ChevronDown
} from 'lucide-react';
import type { UserRole } from '../types/platform.ts';

interface HeaderProps {
  language: 'en' | 'mizo';
  setLanguage: (lang: 'en' | 'mizo') => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  userPhone: string;
  userName: string;
  onOpenAuth: () => void;
  onOpenArchitecture: () => void;
  activeTab: 'client' | 'worker' | 'admin' | 'supervisor';
  setActiveTab: (tab: 'client' | 'worker' | 'admin' | 'supervisor') => void;
  onlineWorkersCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  activeRole,
  setActiveRole,
  userPhone,
  userName,
  onOpenAuth,
  onOpenArchitecture,
  activeTab,
  setActiveTab,
  onlineWorkersCount,
}) => {
  const isMizo = language === 'mizo';

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      {/* Top micro bar for Mizoram locality info & low-connectivity status */}
      <div className="bg-emerald-50 border-b border-emerald-100 px-3 sm:px-6 py-1 text-[11px] sm:text-xs flex items-center justify-between text-emerald-800">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-emerald-950 truncate">Aizawl Hills (920m ASL)</span>
          <span className="hidden md:inline text-emerald-300">•</span>
          <span className="hidden md:inline-flex items-center gap-1 text-emerald-700">
            <Wifi className="w-3 h-3 text-emerald-600" />
            {isMizo ? 'Offline SMS Token Inpeih' : 'Low-Connectivity Offline Tokens Active'}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-emerald-800 font-medium hidden sm:inline">
            {isMizo ? `Thawktu Inpeih: ${onlineWorkersCount}` : `Active Field Workers: ${onlineWorkersCount}`}
          </span>
          <button
            onClick={onOpenArchitecture}
            className="text-[11px] bg-white hover:bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-medium flex items-center gap-1 transition shadow-2xs"
            title="Inspect Production Backend & DB Schema"
          >
            <Code2 className="w-3 h-3 text-emerald-600" />
            <span><strong className="hidden sm:inline">NestJS/Go </strong>Arch</span>
          </button>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-extrabold text-sm sm:text-base tracking-wide">
            MZ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-tight">
                {isMizo ? 'Mizoram Tirhkah' : 'Mizoram Errand & Service'}
              </h1>
              <span className="hidden sm:inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5">
              {isMizo ? 'Tlangram rawngbawlna & hill dispatch' : 'Hill Terrain Dispatch, OTP Auth & Dynamic Plugins'}
            </p>
          </div>
        </div>

        {/* View mode navigation tabs (Desktop / Tablet) */}
        <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              setActiveTab('client');
              setActiveRole('client');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'client'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isMizo ? 'Chhawrtu' : 'Client Portal'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('worker');
              setActiveRole('worker');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'worker'
                ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
            <span>{isMizo ? 'Thawktu' : 'Worker Duty'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('admin');
              setActiveRole('super_admin');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'admin'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isMizo ? 'Admin' : 'Admin & Analytics'}</span>
          </button>
        </div>

        {/* Right side controls: Language, Role Picker, User Phone */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 sm:px-2 py-1 rounded font-medium transition ${
                language === 'en' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-slate-500'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('mizo')}
              className={`px-1.5 sm:px-2 py-1 rounded font-medium transition ${
                language === 'mizo' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-slate-500'
              }`}
            >
              MIZO
            </button>
          </div>

          {/* Quick RBAC Role Selector */}
          <div className="relative inline-flex items-center">
            <select
              aria-label="Active Platform Role"
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as UserRole)}
              className="bg-white text-slate-700 text-xs font-semibold py-1.5 pl-2 pr-6 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer appearance-none shadow-2xs"
            >
              <option value="client">Client (Chhawrtu)</option>
              <option value="worker">Worker (Thawktu)</option>
              <option value="super_admin">Super Admin</option>
              <option value="system_admin">System Admin</option>
              <option value="moderator">Moderator</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 pointer-events-none" />
          </div>

          {/* User Account / OTP Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium transition shadow-2xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-mono text-emerald-950 font-bold text-[11px] hidden sm:inline">
              {userPhone ? userPhone.slice(-4) : 'OTP'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
