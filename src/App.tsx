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
import type { 
  PlatformModule, 
  ServiceCategory, 
  TaskRecord, 
  WorkerProfile, 
  UserRole 
} from './types/platform.ts';

export default function App() {
  const [language, setLanguage] = useState<'en' | 'mizo'>('en');
  const [activeTab, setActiveTab] = useState<'client' | 'worker' | 'admin' | 'supervisor'>('client');
  const [activeRole, setActiveRole] = useState<UserRole>('client');
  const [userPhone, setUserPhone] = useState<string>('+919862112233');
  const [userName, setUserName] = useState<string>('Lalawmpuii (Awmi)');

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Platform Header */}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Low connectivity banner & offline SMS simulator */}
        <LowConnectivityBanner language={language} />

        {/* Dynamic Plugin Module Ribbon */}
        <DynamicPluginBar
          modules={modules}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          language={language}
          onManagePluginsClick={() => {
            setActiveTab('admin');
            setActiveRole('super_admin');
          }}
        />

        {/* Dynamic Views by Tab */}
        {activeTab === 'client' && (
          <div className="space-y-6">
            {/* Errand / Task Creation Wizard */}
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

            {/* Live Task Feed & State Machine Stepper */}
            <TaskTracker
              tasks={tasks}
              language={language}
              onRefresh={fetchData}
              onCancelTask={handleCancelTask}
            />
          </div>
        )}

        {activeTab === 'worker' && (
          <WorkerPortal
            tasks={tasks}
            currentWorker={currentWorker}
            language={language}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onToggleOnline={handleToggleOnline}
          />
        )}

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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">
              Mizoram Errand &amp; Service Platform
            </span>
            <span>•</span>
            <span>Aizawl • Lunglei • Champhai • Kolasib • Serchhip</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsArchModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              NestJS / Go / PostgreSQL Specification
            </button>
            <span>•</span>
            <span>Bilingual Mizo ṭawng &amp; English</span>
          </div>
        </div>
      </footer>

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

      {/* Architecture & Code Snippets Modal */}
      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
        language={language}
      />
    </div>
  );
}
