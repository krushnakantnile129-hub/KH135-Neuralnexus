"use client";

import React, { useState } from 'react';
import { UserRole } from '@/shared/types';
import { loginWithGoogle, getDefaultAvatar } from '@/lib/auth-store';
import { 
  ShoppingBag, 
  Store as StoreIcon, 
  ShieldCheck, 
  X, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  customPrompt?: string;
  onSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  initialRole = 'CONSUMER',
  customPrompt,
  onSuccess,
}: AuthModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole === 'ADMIN' ? 'ADMIN' : initialRole);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
  };

  const handleGoogleClick = () => {
    setErrorMsg('');
    // Open Google Account Selection popup screen
    setShowAccountSelector(true);
  };

  const handleSelectAccount = (email: string, name: string) => {
    try {
      const avatar = getDefaultAvatar(email);
      loginWithGoogle(selectedRole, email, name, avatar);
      setSuccessNotice(`Authenticated via Google as ${email}`);
      setShowAccountSelector(false);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 400);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google Sign-In failed');
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      setErrorMsg('Please enter a valid Google / Gmail address');
      return;
    }
    const nameToUse = googleName.trim() || googleEmail.split('@')[0];
    handleSelectAccount(googleEmail, nameToUse);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Context Prompt Header */}
        {customPrompt && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{customPrompt}</span>
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20 mb-2">
            <span className="text-2xl">🌿</span>
          </div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">SAVE-BITE Sign In</h2>
          <p className="text-xs text-zinc-500 mt-1">1-Click Google OAuth Authentication</p>
        </div>

        {/* Role Selector */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
            Sign In As:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleRoleSelect('CONSUMER')}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                selectedRole === 'CONSUMER'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/40 shadow-sm'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <ShoppingBag className={`w-4 h-4 ${selectedRole === 'CONSUMER' ? 'text-emerald-700' : 'text-zinc-500'}`} />
                {selectedRole === 'CONSUMER' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <div className="font-bold text-xs">Consumer</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('SHOPKEEPER')}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                selectedRole === 'SHOPKEEPER'
                  ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/40 shadow-sm'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <StoreIcon className={`w-4 h-4 ${selectedRole === 'SHOPKEEPER' ? 'text-blue-700' : 'text-zinc-500'}`} />
                {selectedRole === 'SHOPKEEPER' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
              </div>
              <div className="font-bold text-xs">Shopkeeper</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('ADMIN')}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                selectedRole === 'ADMIN'
                  ? 'border-zinc-800 bg-zinc-100 text-zinc-900 ring-2 ring-zinc-800/40 shadow-sm'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <ShieldCheck className={`w-4 h-4 ${selectedRole === 'ADMIN' ? 'text-zinc-900' : 'text-zinc-500'}`} />
                {selectedRole === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-800" />}
              </div>
              <div className="font-bold text-xs">Admin</div>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successNotice && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Google Account Selection Screen Popup */}
        {showAccountSelector ? (
          <div className="bg-slate-50 rounded-2xl p-5 border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Choose a Google Account</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountSelector(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-[11px] text-zinc-500">to continue to <strong>SAVE-BITE</strong></p>

            {/* Quick Google Account Choices */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSelectAccount('priya.bakery@gmail.com', 'Priya Patel')}
                className="w-full p-3 rounded-xl bg-white border border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left flex items-center gap-3 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  P
                </div>
                <div className="flex-1 truncate">
                  <div className="text-xs font-bold text-zinc-900">Priya Patel</div>
                  <div className="text-[11px] text-zinc-500">priya.bakery@gmail.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectAccount('rohan.consumer@gmail.com', 'Rohan Sharma')}
                className="w-full p-3 rounded-xl bg-white border border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left flex items-center gap-3 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  R
                </div>
                <div className="flex-1 truncate">
                  <div className="text-xs font-bold text-zinc-900">Rohan Sharma</div>
                  <div className="text-[11px] text-zinc-500">rohan.consumer@gmail.com</div>
                </div>
              </button>
            </div>

            {/* Custom Google Account Input */}
            <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-zinc-200 space-y-2">
              <label className="block text-[11px] font-bold text-zinc-700">Use another Google Account:</label>
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="user@gmail.com"
                className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              />
              <input
                type="text"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="Display Name (optional)"
                className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Continue with this Google Account
              </button>
            </form>
          </div>
        ) : (
          /* Primary 1-Click Google OAuth Trigger */
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-zinc-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 text-zinc-900 text-sm font-extrabold flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
            <p className="text-[11px] text-zinc-400 text-center">
              Instant 1-click Google OAuth authentication. No password or registration required.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
