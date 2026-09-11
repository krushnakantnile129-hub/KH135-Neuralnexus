"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { TelemetryCards } from '@/components/merchant/telemetry-cards';
import { ActiveDealsList } from '@/components/merchant/active-deals-list';
import { AuthModal } from '@/components/auth/auth-modal';
import { Deal, Store, User } from '@/shared/types';
import { 
  loadDeals, 
  loadStores, 
  decrementDealInventory, 
  markDealAllSold, 
  updateDealStatus, 
  computeMerchantMetrics 
} from '@/lib/store';
import { subscribeAuth } from '@/lib/auth-store';
import { 
  PlusCircle, 
  ShieldCheck, 
  Store as StoreIcon,
  Lock,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export default function MerchantPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [metrics, setMetrics] = useState(computeMerchantMetrics());

  // Subscribe to Auth
  useEffect(() => {
    const unsubscribe = subscribeAuth((u) => {
      setCurrentUser(u);
    });
    return () => unsubscribe();
  }, []);

  const refreshData = () => {
    const s = loadStores();
    setStores(s);
    if (!selectedStoreId && s.length > 0) {
      setSelectedStoreId(s[0].id);
    }
    const d = loadDeals();
    setDeals(d);
    setMetrics(computeMerchantMetrics(selectedStoreId || undefined));
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [selectedStoreId]);

  const handleSellOne = (dealId: string) => {
    decrementDealInventory(dealId, 1);
    refreshData();
  };

  const handleSellAll = (dealId: string) => {
    markDealAllSold(dealId);
    refreshData();
  };

  const handleCancel = (dealId: string) => {
    if (confirm('Cancel and unpublish this surplus deal from public consumer indices?')) {
      updateDealStatus(dealId, 'CANCELLED');
      refreshData();
    }
  };

  const isAuthorized = currentUser && (currentUser.role === 'SHOPKEEPER' || currentUser.role === 'ADMIN');

  const storeDeals = selectedStoreId 
    ? deals.filter(d => d.storeId === selectedStoreId)
    : deals;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Access Control Guard */}
      {!isAuthorized ? (
        <main className="max-w-xl mx-auto px-4 py-16 flex-1 flex flex-col justify-center items-center text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-zinc-200 shadow-xl space-y-6 w-full">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🏪
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full border border-blue-200">
                Shopkeeper Access Required
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Merchant Control Center</h1>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
                You are currently browsing as {currentUser ? `a ${currentUser.role}` : 'a Guest'}. Please sign in with your Shopkeeper account via Gmail or custom credentials to publish deals and monitor pricing telemetry.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Lock className="w-4 h-4" />
                <span>Log In as Shopkeeper / Store Owner</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      ) : (
        <>
          {/* Header Bar */}
          <section className="bg-white border-b border-zinc-200 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl shadow-inner">
                  🏪
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-zinc-900">Merchant Control Center</h1>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <span>✓ FSSAI Licensed</span>
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Verified Maharashtra Merchant • Real-time inventory clearance, pricing telemetry &amp; ESG impact.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Store Switcher */}
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border rounded-xl bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-800 shadow-sm"
                >
                  <option value="">All Store Outlets ({stores.length})</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>

                <Link
                  href="/merchant/add-deal"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Surplus Listing</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Main Merchant Body */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
          {/* Section: Performance Summary Cards */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base text-zinc-900">Sales Performance</h2>
                  <p className="text-xs text-zinc-500">Live revenue and inventory metrics for your store</p>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">Auto-refreshed</span>
              </div>

              <TelemetryCards metrics={metrics} />
            </section>

            {/* Section: Live Active Surplus Listings */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base text-zinc-900">Current Surplus Inventory Status</h2>
                  <p className="text-xs text-zinc-500">Fast 1-click counter decrement as walk-in customers purchase items</p>
                </div>
                <Link
                  href="/merchant/add-deal"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>+ Catalog New Batch</span>
                </Link>
              </div>

              <ActiveDealsList
                deals={storeDeals}
                onSellOne={handleSellOne}
                onSellAll={handleSellAll}
                onCancel={handleCancel}
              />
            </section>

            {/* Informational Guidance Box */}
            <section className="p-5 bg-gradient-to-r from-emerald-950 to-teal-950 text-white rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  Explainable Human-In-The-Loop Pricing Philosophy
                </div>
                <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
                  SAVE-BITE never forces auto-markdowns. You maintain 100% pricing sovereignty via the 60 FPS slider while receiving real-time mathematical risk predictions.
                </p>
              </div>
              <Link
                href="/merchant/add-deal"
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs shrink-0 transition-colors"
              >
                Launch Interactive Pricing Slider ➔
              </Link>
            </section>
          </main>
        </>
      )}

      {/* Auth Modal for Shopkeeper Login */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialRole="SHOPKEEPER"
        customPrompt="Sign in as Shopkeeper to access the Merchant Control Center & 60 FPS pricing slider."
      />
    </div>
  );
}
