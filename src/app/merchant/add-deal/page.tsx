"use client";

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { FastCatalogForm } from '@/components/merchant/fast-catalog-form';
import { ChevronLeft } from 'lucide-react';

export default function AddDealPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

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
    </div>
  );
}
