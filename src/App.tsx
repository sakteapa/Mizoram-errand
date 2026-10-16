import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { DynamicPluginBar } from './components/DynamicPluginBar.tsx';
import { ClientTaskCreator } from './components/ClientTaskCreator.tsx';
import { TaskTracker } from './components/TaskTracker.tsx';
import { WorkerPortal } from './components/WorkerPortal.tsx';
import { AdminControlCenter } from './components/AdminControlCenter.tsx';
import { PhoneOtpModal } from './components/PhoneOtpModal.tsx';
import { ArchitectureModal } from './components/ArchitectureModal.tsx';
import { LowConnectivityBanner } from './components/LowConnectivityBanner.tsx';
import { INITIAL_MODULES, INITIAL_WORKERS } from './utils/mizoramData.ts';
import { User, Briefcase, Sliders, PlusCircle, ListChecks } from 'lucide-react';
import type { 
  PlatformModule, 
  ServiceCategory, 
  TaskRecord, 
  WorkerProfile, 
  UserRole 
} from './types/platform.ts';

export default function App() {
  const [language, setLanguage] = useState<'en' | 'mizo'>('mizo'); // Default to Mizo as requested in brief
  const [activeTab, setActiveTab] = useState<'client' | 'worker' | 'admin' | 'supervisor'>('client');
  const [activeRole, setActiveRole] = useState<UserRole>('client');
  const [userPhone, setUserPhone] = useState<string>('+919862112233');
  const [userName, setUserName] = useState<string>('Lalawmpuii (Awmi)');

  // Client view sub-toggle to avoid scrolling: New Task vs Active Tracking
  const [clientViewMode, setClientViewMode] = useState<'create' | 'track'>('create');

  const [modules, setModules] = useState<PlatformModule[]>(INITIAL_MODULES);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('errand');
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>(INITIAL_WORKERS);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Fetch initial data from server
  const fetchData = useCallback(async () => {
    setIsLoadingFeed(true);
    try {
      // Fetch modules
      const modRes = await fetch('/api/modules');
      const modData = await modRes.json();
      if (modData.success && modData.modules) {
        setModules(modData.modules);
      }

      // Fetch tasks
      const taskRes = await fetch('/api/tasks');
      const taskData = await taskRes.json();
      if (taskData.success && taskData.tasks) {
        setTasks(taskData.tasks);
      }

      // Fetch workers
      const wrkRes = await fetch('/api/workers');
      const wrkData = await wrkRes.json();
      if (wrkData.success && wrkData.workers) {
        setWorkers(wrkData.workers);
      }
    } catch (err) {
      console.warn('API fetch warning, using seeded data:', err);
    } finally {
      setIsLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Current active module
  const activeModule = modules.find(m => m.category === selectedCategory && m.enabled) 
    || modules.find(m => m.enabled) 
    || modules[0];

  // Active worker profile if in worker role
  const currentWorker = workers.find(w => w.phone === userPhone) || workers[0];

  // Sync role switch with tabs
  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'client') {
      setActiveTab('client');
      setUserPhone('+919862112233');
      setUserName('Lalawmpuii (Awmi)');
    } else if (role === 'worker') {
      setActiveTab('worker');
      setUserPhone('+919862345123');
      setUserName('Lalrinsanga (Rina)');
    } else {
      setActiveTab('admin');
      setUserPhone('+919862000000');
      setUserName('Super Admin HQ');
    }
  };

  // Task created handler
  const handleTaskCreated = (newTask: TaskRecord) => {
    setTasks(prev => [newTask, ...prev]);
    setClientViewMode('track'); // Auto-switch to tracking view without scrolling!
  };

  // Task status transition handler (strict state machine)
  const handleUpdateTaskStatus = async (
    taskId: string, 
    nextStatus: 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED',
    payload: any = {}
  ) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextStatus,
          workerId: currentWorker?.id || 'wrk_mizo_01',
          ...payload,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update task status');
      }

      // Update in state
      setTasks(prev => prev.map(t => (t.id === taskId ? data.task : t)));
      // Refresh workers to update wallet balance if completed
      if (nextStatus === 'COMPLETED') {
        const wrkRes = await fetch('/api/workers');
        const wrkData = await wrkRes.json();
        if (wrkData.success && wrkData.workers) {
          setWorkers(wrkData.workers);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Status transition error');
      throw err;
    }
  };

  // Cancel task
  const handleCancelTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextStatus: 'CANCELLED' }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks(prev => prev.map(t => (t.id === taskId ? data.task : t)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin module update
  const handleUpdateModule = async (moduleId: string, updates: Partial<PlatformModule>) => {
    try {
      const res = await fetch(`/api/modules/${moduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': activeRole,
          'x-user-phone': userPhone,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.module) {
        setModules(prev => prev.map(m => (m.id === moduleId ? data.module : m)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin worker KYC verification
  const handleVerifyWorker = async (workerId: string, verified: boolean) => {
    try {
      const res = await fetch(`/api/workers/${workerId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified }),
      });
      const data = await res.json();
      if (data.success && data.worker) {
        setWorkers(prev => prev.map(w => (w.id === workerId ? data.worker : w)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Worker toggle online
  const handleToggleOnline = (isOnline: boolean) => {
    if (currentWorker) {
      setWorkers(prev =>
        prev.map(w => (w.id === currentWorker.id ? { ...w, isOnline } : w))
      );
    }
  };

  const isMizo = language === 'mizo';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white pb-16 sm:pb-0">
      {/* Platform Header (Light Theme) */}
      <Header
        language={language}
        setLanguage={setLanguage}
        activeRole={activeRole}
        setActiveRole={handleRoleChange}
        userPhone={userPhone}
        userName={userName}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenArchitecture={() => setIsArchModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onlineWorkersCount={workers.filter(w => w.isOnline).length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-2 sm:py-4">
        {/* Compact low-connectivity offline alert (Shown on client and worker tabs) */}
        {activeTab !== 'admin' && <LowConnectivityBanner language={language} />}

        {/* Dynamic Plugin Module Ribbon (Shown for client errand creation) */}
        {activeTab === 'client' && (
          <DynamicPluginBar
            modules={modules}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setClientViewMode('create');
            }}
            language={language}
            onManagePluginsClick={() => {
              setActiveTab('admin');
              setActiveRole('super_admin');
            }}
          />
        )}

        {/* Client Portal View with Sub-Navigation to Prevent Scrolling */}
        {activeTab === 'client' && (
          <div className="space-y-4">
            {/* Quick Segmented Switcher (New Errand vs Active Tracking) */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-1.5 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <button
                  onClick={() => setClientViewMode('create')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                    clientViewMode === 'create'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isMizo ? 'Hna Siam Thar' : 'New Task'}</span>
                </button>

                <button
                  onClick={() => setClientViewMode('track')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                    clientViewMode === 'track'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ListChecks className="w-4 h-4" />
                  <span>{isMizo ? 'Hna Chelh Lai' : 'Active Errands'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    clientViewMode === 'track' ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tasks.length}
                  </span>
                </button>
              </div>

              <div className="hidden sm:block text-xs text-slate-500 font-medium pr-2">
                {isMizo ? 'Aizawl tlangchhip tirhkah awlsam' : 'Quick Hill Dispatch in Aizawl'}
              </div>
            </div>

            {/* View Mode: Task Creator */}
            {clientViewMode === 'create' && (
              <ClientTaskCreator
                activeModule={activeModule}
                availableModules={modules.filter(m => m.enabled)}
                workers={workers}
                language={language}
                clientPhone={userPhone}
                clientName={userName}
                onTaskCreated={handleTaskCreated}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
              />
            )}

            {/* View Mode: Task Tracker */}
            {clientViewMode === 'track' && (
              <TaskTracker
                tasks={tasks}
                language={language}
                onRefresh={fetchData}
                onCancelTask={handleCancelTask}
              />
            )}
          </div>
        )}

        {/* Worker Portal View */}
        {activeTab === 'worker' && (
          <WorkerPortal
            tasks={tasks}
            currentWorker={currentWorker}
            language={language}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onToggleOnline={handleToggleOnline}
          />
        )}

        {/* Admin Control Center View */}
        {activeTab === 'admin' && (
          <AdminControlCenter
            modules={modules}
            workers={workers}
            userRole={activeRole}
            language={language}
            onUpdateModule={handleUpdateModule}
            onVerifyWorker={handleVerifyWorker}
            onRefreshData={fetchData}
          />
        )}
      </main>

      {/* Footer (Light Theme) */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-slate-800">
              Mizoram Errand &amp; Service Platform
            </span>
            <span>•</span>
            <span>Aizawl • Lunglei • Champhai • Kolasib</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsArchModalOpen(true)}
              className="text-emerald-700 hover:text-emerald-900 font-semibold underline"
            >
              NestJS / Go Architecture
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile-Friendly Sticky Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 border-t border-slate-200 backdrop-blur-md z-40 px-3 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => {
            setActiveTab('client');
            setActiveRole('client');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            activeTab === 'client' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">{isMizo ? 'Chhawrtu' : 'Client'}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('worker');
            setActiveRole('worker');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            activeTab === 'worker' ? 'text-amber-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px]">{isMizo ? 'Thawktu' : 'Worker'}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('admin');
            setActiveRole('super_admin');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            activeTab === 'admin' ? 'text-indigo-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px]">{isMizo ? 'Admin' : 'Admin'}</span>
        </button>
      </div>

      {/* Phone OTP Auth Modal */}
      <PhoneOtpModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        language={language}
        currentPhone={userPhone}
        onLoginSuccess={(phone, role, name) => {
          setUserPhone(phone);
          setActiveRole(role);
          setUserName(name);
          if (role === 'worker') setActiveTab('worker');
          else if (role === 'client') setActiveTab('client');
          else setActiveTab('admin');
        }}
      />

      {/* Architecture Modal */}
      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
        language={language}
      />
    </div>
  );
}
