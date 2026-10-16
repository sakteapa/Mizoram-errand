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
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top micro bar for Mizoram locality info & low-connectivity fallback */}
      <div className="bg-emerald-950/60 border-b border-emerald-800/40 px-4 py-1 text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-300">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mizoram State Hub:</span>
            <span className="text-white font-semibold">Aizawl (Ridge 920m ASL)</span>
          </span>
          <span className="hidden sm:inline text-emerald-600">|</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-emerald-300/80">
            <Wifi className="w-3 h-3 text-emerald-400" />
            {isMizo ? 'Offline SMS Token Hman Theih' : 'Low-Connectivity Offline Tokens Active'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-emerald-300/90 font-medium">
            {isMizo ? `Thawktu Inpeih: ${onlineWorkersCount}` : `Active Field Workers: ${onlineWorkersCount}`}
          </span>
          <button
            onClick={onOpenArchitecture}
            className="text-xs bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700/50 flex items-center gap-1 transition"
            title="Inspect Production Backend & DB Schema"
          >
            <Code2 className="w-3 h-3" />
            <span className="hidden md:inline">NestJS / Go / Postgres</span> Arch
          </button>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <span className="font-extrabold text-white text-lg tracking-wider">MZ</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">
                {isMizo ? 'Mizoram Tirhkah & Service' : 'Mizoram Errand & Service'}
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                PROD v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isMizo 
                ? 'Tlangram kawng kual & kailawn sang a rawngbawlna' 
                : 'Hill Terrain Dispatch, OTP Auth & Dynamic Plugins'}
            </p>
          </div>
        </div>

        {/* View mode navigation tabs */}
        <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('client');
              setActiveRole('client');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'client'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isMizo ? 'Chhawrtu (Client)' : 'Client Portal'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('worker');
              setActiveRole('worker');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'worker'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{isMizo ? 'Thawktu (Worker)' : 'Worker Duty'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('admin');
              setActiveRole('super_admin');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'admin'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isMizo ? 'Admin Control' : 'Admin & Plugins'}</span>
          </button>
        </div>

        {/* Right side controls: Language, Role Picker, User Phone */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded font-medium transition ${
                language === 'en' ? 'bg-slate-700 text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('mizo')}
              className={`px-2 py-1 rounded font-medium transition ${
                language === 'mizo' ? 'bg-slate-700 text-emerald-400 font-bold' : 'text-slate-400'
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
              className="bg-slate-800 text-slate-200 text-xs font-medium py-1.5 pl-2.5 pr-7 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none"
            >
              <option value="client">Role: Client / Chhawrtu</option>
              <option value="worker">Role: Field Worker / Thawktu</option>
              <option value="super_admin">Role: Super Admin (Hotu)</option>
              <option value="system_admin">Role: System Admin</option>
              <option value="moderator">Role: Moderator / KYC Staff</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          {/* User Account / OTP Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-emerald-300 font-medium">
              {userPhone ? userPhone.slice(0, 3) + ' ' + userPhone.slice(3) : '+91 OTP'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
