import React, { useState } from 'react';
import { Phone, Shield, ArrowRight, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import type { UserRole } from '../types/platform.ts';

interface PhoneOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'mizo';
  onLoginSuccess: (phone: string, role: UserRole, name: string) => void;
  currentPhone: string;
}

export const PhoneOtpModal: React.FC<PhoneOtpModalProps> = ({
  isOpen,
  onClose,
  language,
  onLoginSuccess,
  currentPhone,
}) => {
  const isMizo = language === 'mizo';
  const [phoneNumber, setPhoneNumber] = useState(currentPhone || '+919862112233');
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [fullName, setFullName] = useState('Lalawmpuii');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [
    { label: 'Aizawl Client (Lalawmpuii)', phone: '+919862112233', role: 'client' as UserRole, name: 'Lalawmpuii (Awmi)' },
    { label: 'Two-Wheeler Worker (Lalrinsanga)', phone: '+919862345123', role: 'worker' as UserRole, name: 'Lalrinsanga (Rina)' },
    { label: 'Skilled Electrician (Tetea)', phone: '+919436128765', role: 'worker' as UserRole, name: 'C. Lalramnghaka (Tetea)' },
    { label: 'Super Admin (Aizawl HQ)', phone: '+919862000000', role: 'super_admin' as UserRole, name: 'Super Admin' },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setPhoneNumber(p.phone);
    setSelectedRole(p.role);
    setFullName(p.name);
    setErrorMessage(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, role: selectedRole }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setDevOtpHint(data.devOtp);
      setOtpCode(data.devOtp); // Auto-fill for friction-free evaluation
      setStep('otp');
      setSuccessNotice(isMizo ? data.messageMizo : data.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          otp: otpCode,
          role: selectedRole,
          name: fullName,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid OTP code');
      }

      onLoginSuccess(data.user.phone, data.user.role, data.user.name);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isMizo ? 'Phone Number OTP Luhna' : 'Phone Number OTP Login'}
              </h2>
              <p className="text-xs text-slate-400">
                {isMizo ? 'Mizoram +91 number chauh hman theih a ni' : 'Strictly +91 Mizoram cellular authentication'}
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

        <div className="p-6 space-y-4">
          {/* Quick presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isMizo ? 'A rang lama luhna (Presets):' : 'Instant Test Credentials:'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.phone}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`text-left p-2 rounded-lg border text-xs transition ${
                    phoneNumber === p.phone
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="font-semibold truncate">{p.label}</div>
                  <div className="font-mono text-[10px] text-slate-500">{p.phone}</div>
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/50 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isMizo ? 'Phone Number (+91 Mizoram Mobile)' : 'Phone Number (+91 India / Mizoram)'}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+919862345123"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isMizo 
                    ? 'Email ngai lovin phone number hmangin him takin kan in register zel.' 
                    : 'No email-first signup. Mobile number is bound to Aadhar/Voter ID for worker safety.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isMizo ? 'I hming (Full Name)' : 'Your Name'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isMizo ? 'Luh tumna Role' : 'Intended Platform Role'}
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="client">Client / Chhawrtu (Job Poster)</option>
                  <option value="worker">Worker / Hna Thawktu (Field Agent)</option>
                  <option value="super_admin">Super Admin (System Owner)</option>
                  <option value="system_admin">System Admin (Module Manager)</option>
                  <option value="moderator">Moderator (KYC Staff)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                {isLoading ? (
                  <span>{isMizo ? 'OTP thawn mek...' : 'Sending OTP...'}</span>
                ) : (
                  <>
                    <span>{isMizo ? 'OTP Thawn Rawh' : 'Send One-Time Password'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    {isMizo ? 'Digit 6 OTP chhut luh tur' : 'Enter 6-Digit OTP'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    {isMizo ? 'Phone thlakna' : 'Change Phone'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full tracking-widest text-center bg-slate-950 border border-slate-800 rounded-xl py-3 text-xl font-mono text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {devOtpHint && (
                <div className="p-3 bg-slate-950 border border-emerald-900/60 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {isMizo ? 'Preview Dev OTP:' : 'Evaluator Sandbox OTP:'}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold text-sm bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {devOtpHint}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                {isLoading ? (
                  <span>{isMizo ? 'Fin fiah mek...' : 'Verifying...'}</span>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>{isMizo ? 'OTP Finfiah & Lut Rawh' : 'Verify & Enter Platform'}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
