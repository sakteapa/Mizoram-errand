import React, { useState, useEffect } from 'react';
import { Code2, X, Copy, Check, Database, Server, Smartphone, Cpu } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'mizo';
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isMizo = language === 'mizo';
  const [activeTab, setActiveTab] = useState<'postgres' | 'nestjs' | 'golang' | 'flutter'>('postgres');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [archData, setArchData] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && !archData) {
      fetch('/api/architecture')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.schemas) {
            setArchData(data.schemas);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, archData]);

  if (!isOpen) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const postgresCode = archData?.postgresql || `-- PostgreSQL Schema for Mizoram Errand & Service Platform
CREATE TYPE user_role AS ENUM ('client', 'worker', 'staff', 'moderator', 'system_admin', 'super_admin');
CREATE TYPE task_status AS ENUM ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL, -- Format +91XXXXXXXXXX
  full_name VARCHAR(100) NOT NULL,
  role user_role DEFAULT 'client',
  district VARCHAR(50) DEFAULT 'Aizawl',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id VARCHAR(30) PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  worker_id UUID REFERENCES users(id),
  pickup_locality VARCHAR(100) NOT NULL,
  drop_locality VARCHAR(100) NOT NULL,
  stair_steps_count INT DEFAULT 0,
  hill_difficulty_index SMALLINT CHECK (hill_difficulty_index BETWEEN 1 AND 5),
  base_fee NUMERIC(10, 2) NOT NULL,
  hill_surcharge NUMERIC(10, 2) DEFAULT 0,
  total_fee NUMERIC(10, 2) NOT NULL,
  completion_otp CHAR(6) NOT NULL,
  low_connectivity_token VARCHAR(20) NOT NULL,
  status task_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  const nestjsCode = archData?.nestjsController || `@Controller('api/v1/tasks')
@UseGuards(PhoneOtpJwtGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('client', 'staff', 'super_admin')
  async createHillTask(@Body() dto: CreateMizoramTaskDto) {
    return this.tasksService.dispatchWithTerrainMultiplier(dto);
  }

  @Patch(':id/transition')
  async transitionStatus(
    @Param('id') id: string,
    @Body() dto: TransitionTaskStatusDto,
  ) {
    return this.tasksService.enforceStateTransition(id, dto);
  }
}`;

  const golangCode = archData?.goHandler || `// Go Low-Connectivity Fallback Validator for Hill Ridges
package dispatch

import (
    "crypto/sha256"
    "fmt"
)

func VerifyLowConnectivityToken(taskId, phone string, timestamp int64, token string) bool {
    seed := fmt.Sprintf("%s:%s:%d:MIZO_ERRAND", taskId, phone, timestamp)
    hash := sha256.Sum256([]byte(seed))
    expected := fmt.Sprintf("MZ-%X-%X", hash[0:2], hash[2:4])
    return expected == token
}`;

  const flutterCode = archData?.flutterBloc || `// Flutter Mobile App State Machine Bloc
class TaskBloc extends Bloc<TaskEvent, TaskState> {
  TaskBloc(this.repository) : super(TaskInitial()) {
    on<CreateTaskRequested>((event, emit) async {
      emit(TaskDispatching());
      final task = await repository.createHillTask(event.params);
      emit(TaskCreated(task: task));
    });
    on<UpdateStatusRequested>((event, emit) async {
      final updated = await repository.transitionState(event.taskId, event.nextStatus);
      emit(TaskUpdated(task: updated));
    });
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="bg-slate-50 p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Architecture Specification</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                  NestJS • Go • Postgres • Flutter
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border-b border-slate-200 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('postgres')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              activeTab === 'postgres' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PostgreSQL
          </button>
          <button
            onClick={() => setActiveTab('nestjs')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              activeTab === 'nestjs' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            NestJS
          </button>
          <button
            onClick={() => setActiveTab('golang')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              activeTab === 'golang' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Go Offline
          </button>
          <button
            onClick={() => setActiveTab('flutter')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              activeTab === 'flutter' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Flutter BLoC
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-3 bg-slate-950 font-mono text-xs">
          {activeTab === 'postgres' && (
            <div>
              <div className="flex justify-between items-center mb-1.5 text-slate-400 text-[11px] font-sans">
                <span>PostgreSQL DDL:</span>
                <button
                  onClick={() => handleCopy('postgres', postgresCode)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] flex items-center gap-1"
                >
                  {copiedKey === 'postgres' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'postgres' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-emerald-300 leading-relaxed overflow-x-auto">
                {postgresCode}
              </pre>
            </div>
          )}

          {activeTab === 'nestjs' && (
            <div>
              <div className="flex justify-between items-center mb-1.5 text-slate-400 text-[11px] font-sans">
                <span>NestJS Controller:</span>
                <button
                  onClick={() => handleCopy('nestjs', nestjsCode)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] flex items-center gap-1"
                >
                  {copiedKey === 'nestjs' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'nestjs' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-rose-300 leading-relaxed overflow-x-auto">
                {nestjsCode}
              </pre>
            </div>
          )}

          {activeTab === 'golang' && (
            <div>
              <div className="flex justify-between items-center mb-1.5 text-slate-400 text-[11px] font-sans">
                <span>Golang Handler:</span>
                <button
                  onClick={() => handleCopy('golang', golangCode)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] flex items-center gap-1"
                >
                  {copiedKey === 'golang' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'golang' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-cyan-300 leading-relaxed overflow-x-auto">
                {golangCode}
              </pre>
            </div>
          )}

          {activeTab === 'flutter' && (
            <div>
              <div className="flex justify-between items-center mb-1.5 text-slate-400 text-[11px] font-sans">
                <span>Flutter BLoC:</span>
                <button
                  onClick={() => handleCopy('flutter', flutterCode)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] flex items-center gap-1"
                >
                  {copiedKey === 'flutter' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'flutter' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-blue-300 leading-relaxed overflow-x-auto">
                {flutterCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
