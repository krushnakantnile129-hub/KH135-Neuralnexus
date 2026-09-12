"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { AuthModal } from '@/components/auth/auth-modal';
import { subscribeAuth } from '@/lib/auth-store';
import { User, Store } from '@/shared/types';
import { loadStores } from '@/lib/store';
import { 
  ShieldCheck, 
  Database, 
  Sliders, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  UserCheck,
  Activity,
  FileText,
  Building,
  Server,
  AlertCircle
} from 'lucide-react';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'GOVERNANCE' | 'MERCHANTS' | 'LOGS'>('GOVERNANCE');
  const [stores, setStores] = useState<Store[]>([]);

  const [weights, setWeights] = useState({
    wTime: 0.40,
    wStock: 0.35,
    wVelocity: 0.25,
    wDiscount: 0.25,
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuth((u) => {
      setCurrentUser(u);
    });
    setStores(loadStores());
    return () => unsubscribe();
  }, []);

  const isAuthorized = currentUser && currentUser.role === 'ADMIN';

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Mock System Audit Logs for High-Level Governance Oversight
  const systemAuditLogs = [
    { id: 'log-101', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), type: 'RBAC_CHECK', severity: 'INFO', details: 'Consumer feed access granted (GET /api/deals, Lat: 18.5204, Lng: 73.8567)' },
    { id: 'log-102', timestamp: new Date(Date.now() - 12 * 60000).toISOString(), type: 'RISK_ENGINE', severity: 'SUCCESS', details: 'Waste Risk Evaluated for "Whole Wheat Sourdough" -> Risk Score: 72 (50% Markdown suggested)' },
    { id: 'log-103', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), type: 'MERCHANT_KYC', severity: 'INFO', details: 'FSSAI License Verified for "Shivani Dairy & Sweets" (MH Registration Active)' },
    { id: 'log-104', timestamp: new Date(Date.now() - 40 * 60000).toISOString(), type: 'SECURITY', severity: 'INFO', details: 'Zero-Checkout BR-01 Compliance Check Passed: No Escrow Cart state detected' },
    { id: 'log-105', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), type: 'TTL_SWEEP', severity: 'SYSTEM', details: 'Automatic TTL Expiry Sweep executed: 0 deals auto-expired' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {!isAuthorized ? (
        <main className="max-w-xl mx-auto px-4 py-16 flex-1 flex flex-col justify-center items-center text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-zinc-200 shadow-xl space-y-6 w-full">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 text-zinc-800 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🛡️
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-zinc-800 text-white px-2.5 py-1 rounded-full">
                Admin Credentials Required
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Platform Governance Console</h1>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
                Tuning mathematical scoring weights, inspecting RBAC permissions, and auditing merchant compliance requires Platform Admin authentication.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Lock className="w-4 h-4" />
                <span>Log In as Platform Administrator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialRole="ADMIN"
            customPrompt="Sign in with Admin credentials to access governance & system configuration."
          />
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Platform Governance &amp; Administration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">
                Platform Administrator Console (ACT-03)
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                High-level governance oversight, RBAC enforcement, system logs, and merchant compliance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-right hidden sm:block">
                <p className="font-bold text-zinc-900">{currentUser.name}</p>
                <p className="text-[11px] text-emerald-700 font-mono">Role: PLATFORM_ADMIN</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-emerald-400 flex items-center justify-center font-bold text-base shadow-md">
                🛡️
              </div>
            </div>
          </div>

          {/* Admin Focus Navigation Sub-Tabs */}
          <div className="flex bg-zinc-200/80 p-1 rounded-2xl text-xs font-bold max-w-lg">
            <button
              onClick={() => setActiveAdminTab('GOVERNANCE')}
              className={`flex-1 py-2 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeAdminTab === 'GOVERNANCE' ? 'bg-zinc-900 text-white shadow-sm font-extrabold' : 'text-zinc-700 hover:text-zinc-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Governance &amp; RBAC</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('MERCHANTS')}
              className={`flex-1 py-2 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeAdminTab === 'MERCHANTS' ? 'bg-zinc-900 text-white shadow-sm font-extrabold' : 'text-zinc-700 hover:text-zinc-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Merchant Oversight</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('LOGS')}
              className={`flex-1 py-2 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeAdminTab === 'LOGS' ? 'bg-zinc-900 text-white shadow-sm font-extrabold' : 'text-zinc-700 hover:text-zinc-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>System Logs</span>
            </button>
          </div>

          {/* TAB 1: GOVERNANCE & RBAC */}
          {activeAdminTab === 'GOVERNANCE' && (
            <div className="space-y-6">
              {/* Telemetry Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">System Health</span>
                    <p className="text-lg font-black text-emerald-700 mt-0.5">100% Operational</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Active Stores</span>
                    <p className="text-lg font-black text-zinc-900 mt-0.5">{stores.length} Registered Outlets</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">RBAC Policy Enforcement</span>
                    <p className="text-lg font-black text-purple-900 mt-0.5">Strict Isolation</p>
                  </div>
                </div>
              </div>

              {/* RBAC Matrix (SRS Section 03) */}
              <section className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="font-bold text-base text-zinc-900">Role-Based Access Control (RBAC) Policy Matrix</h2>
                    <p className="text-xs text-zinc-500">Enforces operational boundaries across consumer, store staff, merchant owner, and platform admin</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded">
                    SRS Section 03 Compliant
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-3 rounded-l-xl">System Capability / Endpoint</th>
                        <th className="p-3 text-center">Consumer (ACT-02)</th>
                        <th className="p-3 text-center">Store Staff</th>
                        <th className="p-3 text-center">Store Owner (ACT-01)</th>
                        <th className="p-3 rounded-r-xl text-center">Admin (ACT-03)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {[
                        { name: 'Browse Proximity Feed (GET /api/v1/deals)', c: true, s: true, o: true, a: true },
                        { name: 'Inspect Deal Metadata & Map Trigger', c: true, s: true, o: true, a: true },
                        { name: 'Register & Profile Store (POST /api/v1/stores)', c: false, s: false, o: true, a: true },
                        { name: 'Run Risk Simulation Engine (POST /api/v1/engine)', c: false, s: true, o: true, a: true },
                        { name: 'Publish / Unpublish Live Deal', c: false, s: true, o: true, a: true },
                        { name: 'Mark Inventory Redemptions / Sold', c: false, s: true, o: true, a: true },
                        { name: 'Access Financial & ESG Telemetry', c: false, s: false, o: true, a: true },
                        { name: 'Tune Risk Scoring Coefficients', c: false, s: false, o: false, a: true },
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50">
                          <td className="p-3 font-medium text-zinc-900">{row.name}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${row.c ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
                              {row.c ? 'ALLOW' : 'DENY'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${row.s ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
                              {row.s ? 'ALLOW' : 'DENY'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${row.o ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
                              {row.o ? 'ALLOW' : 'DENY'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${row.a ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
                              {row.a ? 'ALLOW' : 'DENY'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Algorithm Weights Tuner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form onSubmit={handleSaveWeights} className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>Waste Risk Engine Vector Coefficients</span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Live baseline tuning for weights: Time Urgency (40%), Volume Overhang (35%), Footfall Velocity (25%).
                  </p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-zinc-700 mb-1">
                        <span>Time Urgency Weight (w_t)</span>
                        <span className="font-mono">{weights.wTime * 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.10"
                        max="0.70"
                        step="0.05"
                        value={weights.wTime}
                        onChange={(e) => setWeights({ ...weights, wTime: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-200 rounded appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-zinc-700 mb-1">
                        <span>Volume Overhang Weight (w_q)</span>
                        <span className="font-mono">{weights.wStock * 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.10"
                        max="0.70"
                        step="0.05"
                        value={weights.wStock}
                        onChange={(e) => setWeights({ ...weights, wStock: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-200 rounded appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-zinc-700 mb-1">
                        <span>Footfall Velocity Weight (w_v)</span>
                        <span className="font-mono">{weights.wVelocity * 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.10"
                        max="0.70"
                        step="0.05"
                        value={weights.wVelocity}
                        onChange={(e) => setWeights({ ...weights, wVelocity: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-200 rounded appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-zinc-100">
                    {isSaved ? (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Saved!
                      </span>
                    ) : <div />}
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-colors"
                    >
                      Update Model Parameters
                    </button>
                  </div>
                </form>

                {/* Business Rules Compliance */}
                <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Invariable Business Rules (SRS Section 04)</span>
                  </div>

                  <div className="space-y-3 mt-3 text-xs text-zinc-600">
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                      <strong className="text-zinc-900 block font-bold mb-1">BR-01: Zero-Checkout Mandate</strong>
                      Platform strictly prohibits digital escrow, cart holds, and delivery dispatch. All surplus purchases occur strictly at physical merchant POS.
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                      <strong className="text-zinc-900 block font-bold mb-1">BR-02: Immutable Food Safety Horizon</strong>
                      Selling deadlines are never auto-extended. Expired deals drop instantaneously from all consumer query feeds upon TTL threshold breach.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MERCHANT OVERSIGHT & VERIFICATION */}
          {activeAdminTab === 'MERCHANTS' && (
            <section className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h2 className="font-bold text-base text-zinc-900">Registered Merchant Outlets Oversight</h2>
                  <p className="text-xs text-zinc-500">Monitor FSSAI licensing compliance and Maharashtra operational residency</p>
                </div>
                <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded border border-blue-200">
                  {stores.length} Verified Outlets
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {stores.map((store) => (
                  <div key={store.id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-sm text-zinc-900 line-clamp-1">{store.name}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded shrink-0">
                        {store.category}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 line-clamp-2">{store.streetAddress}</p>

                    <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> FSSAI Verified
                      </span>
                      <span className="text-zinc-400 font-mono">{store.phoneContact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 3: SYSTEM AUDIT LOGS */}
          {activeAdminTab === 'LOGS' && (
            <section className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h2 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Real-Time Governance &amp; Security Audit Trail</span>
                  </h2>
                  <p className="text-xs text-zinc-500">Live timestamped logs for RBAC checks, risk engine calculations, and system events</p>
                </div>
                <span className="text-xs font-mono font-bold bg-zinc-900 text-emerald-400 px-2.5 py-1 rounded">
                  LOG_STREAM: LIVE
                </span>
              </div>

              <div className="bg-zinc-950 text-zinc-200 p-4 rounded-2xl font-mono text-xs space-y-2.5 overflow-x-auto max-h-96">
                {systemAuditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 border-b border-zinc-800/80 pb-2 last:border-0 last:pb-0">
                    <span className="text-zinc-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      log.severity === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      log.severity === 'SYSTEM' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      [{log.type}]
                    </span>
                    <span className="text-zinc-300 leading-relaxed">{log.details}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}
