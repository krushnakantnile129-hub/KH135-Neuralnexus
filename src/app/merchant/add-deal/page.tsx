"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { FastCatalogForm } from '@/components/merchant/fast-catalog-form';
import { AuthModal } from '@/components/auth/auth-modal';
import { subscribeAuth } from '@/lib/auth-store';
import { User } from '@/shared/types';
import { ChevronLeft, Lock, ArrowRight } from 'lucide-react';

export default function AddDealPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuth((u) => {
      setCurrentUser(u);
    });
    return () => unsubscribe();
  }, []);

  const isAuthorized = currentUser && (currentUser.role === 'SHOPKEEPER' || currentUser.role === 'ADMIN');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {!isAuthorized ? (
        <main className="max-w-xl mx-auto px-4 py-16 flex-1 flex flex-col justify-center items-center text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-zinc-200 shadow-xl space-y-6 w-full">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              ✨
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full border border-blue-200">
                Shopkeeper Access Required
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Add Surplus Listing</h1>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
                Cataloging surplus items and simulating dynamic pricing via the 60 FPS slider requires a verified Shopkeeper account.
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

          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialRole="SHOPKEEPER"
            customPrompt="Sign in as Shopkeeper to access the Fast Catalog Form & Dynamic Price Slider."
          />
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
          {/* Navigation Breadcrumb */}
          <div className="flex items-center justify-between">
            <Link
              href="/merchant"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Merchant Hub</span>
            </Link>

            <span className="text-xs text-zinc-500 font-mono">
              Module: FR-INV &amp; FR-ENG (v1.1)
            </span>
          </div>

          {/* Title & Introduction */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <span>Catalog Surplus &amp; Simulate Pricing</span>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                60 FPS Reactive Engine
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-3xl leading-relaxed">
              Fill in the 6 parameters below. The deterministic Waste Risk Engine computes baseline clearing risk in &lt;16ms and suggests a margin-protective clearance discount. Drag the slider to override.
            </p>
          </div>

          {/* Core Fast Form + Interactive Slider Component */}
          <FastCatalogForm />
        </main>
      )}
    </div>
  );
}
