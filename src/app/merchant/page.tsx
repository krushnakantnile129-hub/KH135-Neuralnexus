"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { FastCatalogForm } from '@/components/merchant/fast-catalog-form';
import { ActiveDealsList } from '@/components/merchant/active-deals-list';
import { AddSurplusModal } from '@/components/merchant/add-surplus-modal';
import { AuthModal } from '@/components/auth/auth-modal';
import { Deal, Store, User } from '@/shared/types';
import { 
  loadDeals, 
  loadStores, 
  decrementDealInventory, 
  markDealAllSold, 
  updateDealStatus 
} from '@/lib/store';
import { subscribeAuth } from '@/lib/auth-store';
import { 
  PlusCircle, 
  ShieldCheck, 
  Store as StoreIcon,
  Lock,
  ArrowRight,
  Package,
  Layers
} from 'lucide-react';

export default function MerchantPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddSurplusModal, setShowAddSurplusModal] = useState(false);

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [deals, setDeals] = useState<Deal[]>([]);

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
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    if (typeof window !== 'undefined') {
      window.addEventListener('deals-updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }
    const interval = setInterval(refreshData, 2000);
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deals-updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
      clearInterval(interval);
    };
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
    if (confirm('Cancel and unpublish this surplus deal from public consumer feeds?')) {
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
                You are currently browsing as {currentUser ? `a ${currentUser.role}` : 'a Guest'}. Please sign in with your Shopkeeper account via Gmail or custom credentials to publish deals and manage surplus inventory.
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
                    Verified Maharashtra Merchant • Real-time surplus food cataloging &amp; multi-factor dynamic pricing.
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

                <button
                  type="button"
                  onClick={() => setShowAddSurplusModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Surplus Modal</span>
                </button>
              </div>
            </div>
          </section>

          {/* Main Merchant Dashboard Body */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
            
            {/* Section 1: Publish New Surplus Item Form with Multi-Factor Pricing Engine */}
            <section className="space-y-3">
              <FastCatalogForm onSuccess={refreshData} />
            </section>

            {/* Section 2: Live Active Surplus Inventory Management Table */}
            <section className="space-y-3">
              <ActiveDealsList
                deals={storeDeals}
                onSellOne={handleSellOne}
                onSellAll={handleSellAll}
                onCancel={handleCancel}
              />
            </section>

          </main>
        </>
      )}

      {/* Add Surplus Modal */}
      <AddSurplusModal
        isOpen={showAddSurplusModal}
        onClose={() => setShowAddSurplusModal(false)}
        onItemAdded={refreshData}
      />

      {/* Auth Modal for Shopkeeper Login */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialRole="SHOPKEEPER"
        customPrompt="Sign in as Shopkeeper to access the Merchant Control Center & Dynamic Price Engine."
      />
    </div>
  );
}
