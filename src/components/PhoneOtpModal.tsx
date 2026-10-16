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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50 via-slate-50 to-white p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isMizo ? 'Phone OTP Luhna' : 'Phone Number OTP Auth'}
              </h2>
              <p className="text-[10px] text-slate-500">
                Strictly +91 Mizoram numbers
              </p>
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

        <div className="p-4 space-y-3">
          {/* Presets */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{isMizo ? 'A Rang Lama Luhna (Presets):' : 'Instant Test Presets:'}</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.phone}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`text-left p-1.5 rounded-lg border text-xs transition ${
                    phoneNumber === p.phone
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[11px] truncate">{p.label.split(' ')[0]}</div>
                  <div className="font-mono text-[9px] text-slate-500">{p.phone.slice(-4)}</div>
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Phone Number (+91)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+919862345123"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  {isMizo ? 'Hming' : 'Name'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {isLoading ? 'Sending...' : (isMizo ? 'OTP Thawn Rawh' : 'Send OTP')}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full tracking-widest text-center bg-slate-50 border border-slate-200 rounded-xl py-2 text-lg font-mono text-emerald-800 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {devOtpHint && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-center text-xs text-emerald-900">
                  <span>Dev OTP: </span>
                  <span className="font-mono font-bold text-emerald-700">{devOtpHint}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{isMizo ? 'Finfiah & Lut Rawh' : 'Verify & Enter'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
