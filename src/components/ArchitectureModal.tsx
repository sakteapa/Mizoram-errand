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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Production Architecture & Code Snippets</span>
                <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                  NestJS • Go • PostgreSQL • Flutter
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isMizo
                  ? 'Mizoram Errand & Service Platform backend leh frontend code kalphung'
                  : 'Backend & mobile patterns adhering strictly to the platform guidelines.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('postgres')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'postgres' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>PostgreSQL Schema</span>
          </button>

          <button
            onClick={() => setActiveTab('nestjs')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'nestjs' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>NestJS Controller</span>
          </button>

          <button
            onClick={() => setActiveTab('golang')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'golang' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Golang Offline Handler</span>
          </button>

          <button
            onClick={() => setActiveTab('flutter')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'flutter' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Flutter BLoC Pattern</span>
          </button>
        </div>

        {/* Code Content Body */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950/80 font-mono text-xs relative">
          {activeTab === 'postgres' && (
            <div>
              <div className="flex justify-between items-center mb-2 text-slate-400 font-sans text-xs">
                <span>Relational PostgreSQL DDL Schema (Optimized for indexing & state transitions):</span>
                <button
                  onClick={() => handleCopy('postgres', postgresCode)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'postgres' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'postgres' ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="text-emerald-300 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed">
                {postgresCode}
              </pre>
            </div>
          )}

          {activeTab === 'nestjs' && (
            <div>
              <div className="flex justify-between items-center mb-2 text-slate-400 font-sans text-xs">
                <span>Modular NestJS Controller (Decorators, PhoneOtpGuard & RBAC):</span>
                <button
                  onClick={() => handleCopy('nestjs', nestjsCode)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'nestjs' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'nestjs' ? 'Copied' : 'Copy TypeScript'}</span>
                </button>
              </div>
              <pre className="text-rose-300 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed">
                {nestjsCode}
              </pre>
            </div>
          )}

          {activeTab === 'golang' && (
            <div>
              <div className="flex justify-between items-center mb-2 text-slate-400 font-sans text-xs">
                <span>Golang Offline Token Verification (Microsecond speed for zero-signal hill USSD/SMS gateways):</span>
                <button
                  onClick={() => handleCopy('golang', golangCode)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'golang' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'golang' ? 'Copied' : 'Copy Go'}</span>
                </button>
              </div>
              <pre className="text-cyan-300 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed">
                {golangCode}
              </pre>
            </div>
          )}

          {activeTab === 'flutter' && (
            <div>
              <div className="flex justify-between items-center mb-2 text-slate-400 font-sans text-xs">
                <span>Flutter / React Native Clean Architecture (State Machine BLoC / Redux):</span>
                <button
                  onClick={() => handleCopy('flutter', flutterCode)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded flex items-center gap-1 text-[11px]"
                >
                  {copiedKey === 'flutter' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'flutter' ? 'Copied' : 'Copy Dart'}</span>
                </button>
              </div>
              <pre className="text-blue-300 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed">
                {flutterCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
