"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { ShieldCheck, Database, Sliders, RefreshCw, CheckCircle2 } from 'lucide-react';
import { resetDemoState } from '@/lib/store';

export default function AdminPage() {
  const [weights, setWeights] = useState({
    wTime: 0.40,
    wStock: 0.35,
    wVelocity: 0.25,
    wDiscount: 0.25,
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleReset = () => {
    if (confirm('Reset entire system database to initial demo state?')) {
      resetDemoState();
      window.location.reload();
    }
  };

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Platform Governance &amp; Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">
            Platform Administrator Console (ACT-03)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Review Role-Based Access Control (RBAC) matrices, tune mathematical scoring weights, and govern surplus catalogs.
          </p>
        </div>

        {/* RBAC Matrix (SRS Section 03) */}
        <section className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h2 className="font-bold text-base text-zinc-900">Role-Based Access Control (RBAC) Matrix</h2>
              <p className="text-xs text-zinc-500">Enforces operational boundaries across customer, merchant, and admin personas</p>
            </div>
            <span className="text-xs font-mono font-bold bg-zinc-100 text-zinc-800 px-2 py-1 rounded">
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

        {/* Algorithm Weights Tuner & Seed Data Reset */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tuning Form */}
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

          {/* Database Governance & Invariable Business Rules */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Invariable Business Rules (SRS Section 04)</span>
              </div>

              <div className="space-y-3 mt-3 text-xs text-zinc-600">
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <strong className="text-zinc-900 block">BR-01: Zero-Checkout Mandate</strong>
                  Platform strictly prohibits digital escrow, cart holds, and delivery dispatch. Transactions occur strictly at counter POS.
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <strong className="text-zinc-900 block">BR-02: Immutable Food Safety Horizon</strong>
                  Selling deadlines are never auto-extended. Expired deals drop instantaneously from all consumer query feeds.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-medium">Reset Seed Database</span>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Demo State</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
