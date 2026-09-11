"use client";

import React, { useState } from 'react';
import { UserRole, MerchantKyc } from '@/shared/types';
import { 
  loginWithEmail, 
  loginWithGoogle, 
  signupUser, 
  quickSwitchDemoRole,
  SINGLE_ADMIN_EMAIL
} from '@/lib/auth-store';
import { 
  ShoppingBag, 
  Store as StoreIcon, 
  ShieldCheck, 
  X, 
  Mail, 
  User as UserIcon, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileCheck,
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
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole === 'ADMIN' ? 'ADMIN' : initialRole);
  
  // Interactive Google Sign-In state
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // Email & Name Form State (No Passwords)
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  // Merchant KYC Form State
  const [kycAge, setKycAge] = useState<number>(25);
  const [kycDob, setKycDob] = useState('2000-05-15');
  const [kycState, setKycState] = useState('Maharashtra');
  const [kycCity, setKycCity] = useState('Pune');
  const [kycStreet, setKycStreet] = useState('FC Road Commercial District');
  const [kycGovtIdType, setKycGovtIdType] = useState<'AADHAAR' | 'PAN' | 'PASSPORT'>('PAN');
  const [kycGovtIdNum, setKycGovtIdNum] = useState('ABCDE1234F');
  const [kycFssai, setKycFssai] = useState('21524022000999');
  const [kycGstin, setKycGstin] = useState('27ABCDE1234F1Z5');
  const [kycBankName, setKycBankName] = useState('HDFC Bank');
  const [kycAccountHolder, setKycAccountHolder] = useState('');
  const [kycAccountNumber, setKycAccountNumber] = useState('50100987654321');
  const [kycIfsc, setKycIfsc] = useState('HDFC0000140');

  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');

    if (role === 'CONSUMER') {
      setEmail('rohan.consumer@gmail.com');
    } else if (role === 'SHOPKEEPER') {
      setEmail('priya.bakery@gmail.com');
    } else if (role === 'ADMIN') {
      setEmail(SINGLE_ADMIN_EMAIL);
    }
  };

  const triggerGoogleSignIn = () => {
    setErrorMsg('');
    setShowGooglePrompt(true);
  };

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      setErrorMsg('Please enter a valid Gmail address');
      return;
    }
    try {
      loginWithGoogle(selectedRole, googleEmail, googleName);
      setSuccessNotice(`Authenticated via Gmail as ${googleEmail} (${selectedRole})!`);
      setShowGooglePrompt(false);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google authentication failed');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    try {
      if (activeTab === 'LOGIN') {
        loginWithEmail(email, selectedRole);
        setSuccessNotice(`Welcome back! Logged in as ${selectedRole}.`);
      } else {
        let kycPayload: MerchantKyc | undefined;

        if (selectedRole === 'SHOPKEEPER') {
          if (kycAge < 18) {
            setErrorMsg('Eligibility error: Shopkeeper must be at least 18 years old.');
            return;
          }
          if (kycState.trim().toLowerCase() !== 'maharashtra') {
            setErrorMsg('Location error: SAVE-BITE Merchant operations are restricted to Maharashtra, India.');
            return;
          }
          if (!kycGovtIdNum || kycGovtIdNum.length < 5) {
            setErrorMsg('Government Identity error: Please provide a valid PAN / Aadhaar number.');
            return;
          }
          if (!kycFssai || kycFssai.length < 10) {
            setErrorMsg('Food Safety Compliance error: Valid FSSAI License Number (14 digits) is required.');
            return;
          }
          if (!kycAccountNumber || !kycIfsc) {
            setErrorMsg('Financial Payout error: Bank Account Number & IFSC code are required.');
            return;
          }

          kycPayload = {
            age: kycAge,
            dob: kycDob,
            state: kycState,
            city: kycCity,
            streetAddress: kycStreet,
            govtIdType: kycGovtIdType,
            govtIdNumber: kycGovtIdNum,
            fssaiLicense: kycFssai,
            gstin: kycGstin,
            bankName: kycBankName,
            accountHolder: kycAccountHolder || name || email.split('@')[0],
            accountNumber: kycAccountNumber,
            ifscCode: kycIfsc,
          };
        }

        signupUser(name || email.split('@')[0], email, selectedRole, kycPayload);
        setSuccessNotice(
          selectedRole === 'SHOPKEEPER' 
            ? `Shopkeeper KYC Verified & Registered in Maharashtra!`
            : `Account created successfully as ${selectedRole}!`
        );
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please try again.');
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    try {
      quickSwitchDemoRole(role);
      setSuccessNotice(`Logged in with 1-Click Demo (${role})!`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 400);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Demo login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">SAVE-BITE Authentication</h2>
          <p className="text-xs text-zinc-500 mt-1">Instant password-free Gmail sign-in &amp; merchant registration</p>
        </div>

        {/* Tab Toggle: Login vs Sign Up */}
        <div className="flex bg-zinc-100 p-1 rounded-2xl mb-6 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('LOGIN');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'LOGIN'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('SIGNUP');
              setErrorMsg('');
              if (selectedRole === 'ADMIN') setSelectedRole('CONSUMER');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'SIGNUP'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Register / Sign Up
          </button>
        </div>

        {/* Role Selector Cards */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
            Select Account Role:
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
                <ShoppingBag className={`w-5 h-5 ${selectedRole === 'CONSUMER' ? 'text-emerald-700' : 'text-zinc-500'}`} />
                {selectedRole === 'CONSUMER' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <div>
                <div className="font-bold text-xs">Consumer</div>
                <div className="text-[10px] opacity-75 truncate">Rescue surplus</div>
              </div>
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
                <StoreIcon className={`w-5 h-5 ${selectedRole === 'SHOPKEEPER' ? 'text-blue-700' : 'text-zinc-500'}`} />
                {selectedRole === 'SHOPKEEPER' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
              </div>
              <div>
                <div className="font-bold text-xs">Shopkeeper</div>
                <div className="text-[10px] opacity-75 truncate">Merchant &amp; KYC</div>
              </div>
            </button>

            <button
              type="button"
              disabled={activeTab === 'SIGNUP'}
              onClick={() => handleRoleSelect('ADMIN')}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                activeTab === 'SIGNUP'
                  ? 'opacity-40 cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400'
                  : selectedRole === 'ADMIN'
                  ? 'border-zinc-800 bg-zinc-100 text-zinc-900 ring-2 ring-zinc-800/40 shadow-sm'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <ShieldCheck className={`w-5 h-5 ${selectedRole === 'ADMIN' ? 'text-zinc-900' : 'text-zinc-500'}`} />
                {selectedRole === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-800" />}
              </div>
              <div>
                <div className="font-bold text-xs">Single Admin</div>
                <div className="text-[10px] opacity-75 truncate">Governance</div>
              </div>
            </button>
          </div>
        </div>

        {/* Interactive Google Sign In Input */}
        {showGooglePrompt ? (
          <form onSubmit={handleGoogleSubmit} className="bg-slate-50 rounded-2xl p-4 border border-zinc-200 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-zinc-900">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Instant Gmail Sign-In</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGooglePrompt(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                ✕ Cancel
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Enter Your Gmail Address:</label>
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Enter Your Display Name:</label>
              <input
                type="text"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="e.g. Akash Kumar"
                className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Sign In with Gmail as {selectedRole}</span>
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={triggerGoogleSignIn}
            className="w-full py-3 px-4 rounded-2xl border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold flex items-center justify-center gap-3 transition-all shadow-sm mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Gmail / Google Account</span>
          </button>
        )}

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
          <span className="relative bg-white px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">or sign in with email</span>
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

        {/* Email & Name Form (NO PASSWORDS) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'SIGNUP' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Akash Kumar"
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Email / Gmail Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  selectedRole === 'CONSUMER' ? 'rohan.consumer@gmail.com' :
                  selectedRole === 'SHOPKEEPER' ? 'priya.bakery@gmail.com' :
                  SINGLE_ADMIN_EMAIL
                }
                className="w-full pl-10 pr-3 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900"
                required
              />
            </div>
          </div>

          {/* MERCHANT KYC VERIFICATION (When registering as Shopkeeper) */}
          {activeTab === 'SIGNUP' && selectedRole === 'SHOPKEEPER' && (
            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3 pt-3">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs border-b border-blue-200/80 pb-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Shopkeeper Identity &amp; Regulatory Verification (KYC)</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-1">Age (&ge; 18):</label>
                  <input
                    type="number"
                    min="18"
                    value={kycAge}
                    onChange={(e) => setKycAge(parseInt(e.target.value) || 18)}
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-1">State (MH):</label>
                  <input
                    type="text"
                    value={kycState}
                    onChange={(e) => setKycState(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white outline-none font-bold text-blue-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-1">City:</label>
                  <input
                    type="text"
                    value={kycCity}
                    onChange={(e) => setKycCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-1">Govt ID Number:</label>
                  <input
                    type="text"
                    value={kycGovtIdNum}
                    onChange={(e) => setKycGovtIdNum(e.target.value)}
                    placeholder="PAN / Aadhaar"
                    className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-700 mb-1">FSSAI Food Safety License Number (14 Digits):</label>
                <input
                  type="text"
                  value={kycFssai}
                  onChange={(e) => setKycFssai(e.target.value)}
                  placeholder="21524022000999"
                  className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white outline-none font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-1">Bank Name:</label>
                  <input
                    type="text"
                    value={kycBankName}
                    onChange={(e) => setKycBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-1">Account &amp; IFSC:</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={kycAccountNumber}
                      onChange={(e) => setKycAccountNumber(e.target.value)}
                      placeholder="Account No"
                      className="w-full px-1.5 py-1.5 text-[11px] border rounded-lg bg-white font-mono"
                      required
                    />
                    <input
                      type="text"
                      value={kycIfsc}
                      onChange={(e) => setKycIfsc(e.target.value)}
                      placeholder="IFSC"
                      className="w-16 px-1 py-1.5 text-[10px] border rounded-lg bg-white font-mono uppercase"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all mt-2"
          >
            <span>{activeTab === 'LOGIN' ? `Sign In as ${selectedRole}` : `Register ${selectedRole}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Quick Demo Login Shortcuts */}
        <div className="mt-6 pt-4 border-t border-zinc-100">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-center mb-2">
            ⚡ 1-Click Instant Demo Profiles
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              onClick={() => handleQuickDemo('CONSUMER')}
              className="px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition-colors"
            >
              🛍️ Consumer Demo
            </button>
            <button
              onClick={() => handleQuickDemo('SHOPKEEPER')}
              className="px-2 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold border border-blue-200 transition-colors"
            >
              🏪 Verified Merchant
            </button>
            <button
              onClick={() => handleQuickDemo('ADMIN')}
              className="px-2 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold border border-zinc-300 transition-colors"
            >
              🛡️ Single Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
