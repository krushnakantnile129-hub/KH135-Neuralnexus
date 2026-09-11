"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { StoreCategory, SalesVelocity, Deal } from '@/shared/types';
import { evaluateWasteRisk } from '@/shared/engine/wasteRisk';
import { PriceSlider } from './price-slider';
import { RiskMeter } from './risk-meter';
import { addDeal, loadStores } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import { Sparkles, ArrowRight, Zap, CheckCircle2, Clock } from 'lucide-react';

export function FastCatalogForm() {
  const router = useRouter();
  const stores = loadStores();
  const defaultStore = stores[0] || {
    id: 'store-abc-bakery',
    name: 'ABC Gourmet Bakery & Café',
    category: 'BAKERY',
    streetAddress: 'Plot 42, Fergusson College Rd, Shivajinagar, Pune',
    latitude: 18.5255,
    longitude: 73.8595,
    phoneContact: '+91 98230 12345',
  };

  const [selectedStoreId, setSelectedStoreId] = useState(defaultStore.id);
  const [productName, setProductName] = useState('Fresh Organic Malai Paneer (500g)');
  const [category, setCategory] = useState<StoreCategory>('DAIRY');
  const [remainingUnits, setRemainingUnits] = useState(12);
  const [originalPrice, setOriginalPrice] = useState(220);
  const [salesVelocity, setSalesVelocity] = useState<SalesVelocity>('MEDIUM');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const deadlineIso = useMemo(() => {
    return new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  }, [durationMinutes]);

  const evaluation = useMemo(() => {
    return evaluateWasteRisk({
      quantity: Math.max(1, remainingUnits),
      originalPrice: Math.max(5, originalPrice),
      selectedPrice: customPrice !== null ? customPrice : originalPrice,
      deadlineIso,
      salesVelocity,
    });
  }, [remainingUnits, originalPrice, customPrice, deadlineIso, salesVelocity]);

  const activePrice = customPrice !== null ? customPrice : evaluation.recommendedPrice;

  const activeEvaluation = useMemo(() => {
    return evaluateWasteRisk({
      quantity: Math.max(1, remainingUnits),
      originalPrice: Math.max(5, originalPrice),
      selectedPrice: activePrice,
      deadlineIso,
      salesVelocity,
    });
  }, [remainingUnits, originalPrice, activePrice, deadlineIso, salesVelocity]);

  const applyScenario1 = () => {
    setProductName('Sourdough Loaf');
    setCategory('BAKERY');
    setRemainingUnits(15);
    setOriginalPrice(120);
    setDurationMinutes(60);
    setSalesVelocity('LOW');
    setCustomPrice(60);
  };

  const applyScenario2 = () => {
    setProductName('Veggie Club Sandwich');
    setCategory('BAKERY');
    setRemainingUnits(18);
    setOriginalPrice(60);
    setDurationMinutes(50);
    setSalesVelocity('LOW');
    setCustomPrice(50);
  };

  const applyDairyScenario = () => {
    setProductName('Fresh Organic Malai Paneer (500g)');
    setCategory('DAIRY');
    setRemainingUnits(12);
    setOriginalPrice(220);
    setDurationMinutes(45);
    setSalesVelocity('MEDIUM');
    setCustomPrice(110);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const store = stores.find(s => s.id === selectedStoreId) || defaultStore;
    const discountPct = Math.round(((originalPrice - activePrice) / originalPrice) * 100);

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      storeId: store.id,
      storeName: store.name,
      storeCategory: category,
      storeAddress: store.streetAddress,
      latitude: store.latitude,
      longitude: store.longitude,
      phoneContact: store.phoneContact,
      productName: productName.trim() || 'Surplus Item',
      category,
      initialUnits: remainingUnits,
      remainingUnits: remainingUnits,
      soldUnits: 0,
      originalPrice,
      recommendedPrice: activeEvaluation.recommendedPrice,
      publishedPrice: activePrice,
      wasteRiskScore: activeEvaluation.wasteRiskScore,
      salesVelocity,
      deadline: deadlineIso,
      status: 'ACTIVE',
      discountPct,
      freshnessTag: 'Verified Fresh',
      description: `Fresh surplus ${category.toLowerCase()} batch published with ₹${activePrice} clearance price to ensure immediate walk-in recovery.`,
      imageUrl: category === 'DAIRY' 
        ? 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDeal(newDeal);
    setShowSuccessToast(true);

    setTimeout(() => {
      router.push('/merchant');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Scenario Demo Quick Presets */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Quick Catalog Test Presets
          </span>
          <p className="text-xs text-zinc-300 mt-0.5">
            Pre-populate exact values to simulate instant risk and price advisory.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyDairyScenario}
            className="px-3 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-zinc-950 text-xs font-bold transition-colors"
          >
            🥛 Dairy (Paneer 50% Off)
          </button>
          <button
            type="button"
            onClick={applyScenario1}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors"
          >
            🥐 Bakery (Sourdough 50% Off)
          </button>
          <button
            type="button"
            onClick={applyScenario2}
            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-colors"
          >
            🥪 Sandwich (₹50 Override)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Fast 6-Parameter Entry */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-5">
          <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-zinc-900">1. Fast Surplus Cataloging (FR-INV)</h2>
              <p className="text-xs text-zinc-500">6 atomic fields designed for busy store counter staff</p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              &lt; 30s Target
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Originating Store / Branch</label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-zinc-800"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Product Name (3-80 Chars)</label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={80}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Fresh Organic Paneer, Cow Milk Pouch..."
              className="w-full px-3.5 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StoreCategory)}
                className="w-full px-3 py-2.5 text-sm border rounded-xl bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-zinc-800"
              >
                <option value="DAIRY">Dairy & Farm 🥛</option>
                <option value="BAKERY">Bakery 🥐</option>
                <option value="CAFE">Café ☕</option>
                <option value="RESTAURANT">Restaurant 🍕</option>
                <option value="CANTEEN">Canteen 🍱</option>
                <option value="GROCERY">Grocery 🥗</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Observed Footfall (V)</label>
              <select
                value={salesVelocity}
                onChange={(e) => setSalesVelocity(e.target.value as SalesVelocity)}
                className="w-full px-3 py-2.5 text-sm border rounded-xl bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-zinc-800"
              >
                <option value="LOW">LOW (&lt; 2 units/hr)</option>
                <option value="MEDIUM">MEDIUM (2-5 units/hr)</option>
                <option value="HIGH">HIGH (&gt; 5 units/hr)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Remaining Units (Q)</label>
              <input
                type="number"
                required
                min={1}
                max={500}
                value={remainingUnits}
                onChange={(e) => setRemainingUnits(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 text-sm font-mono border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Baseline Price (P_orig)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  required
                  min={5}
                  max={50000}
                  value={originalPrice}
                  onChange={(e) => {
                    const orig = Math.max(5, parseInt(e.target.value) || 5);
                    setOriginalPrice(orig);
                    setCustomPrice(null);
                  }}
                  className="w-full pl-7 pr-3.5 py-2.5 text-sm font-mono border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-zinc-900"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                End-of-Sale Horizon ({durationMinutes} mins remaining)
              </label>
              <span className="text-[11px] text-zinc-500 font-mono">
                Closes in {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[30, 45, 60, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    durationMinutes === mins
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}
                >
                  {mins >= 60 ? `${mins / 60} hr` : `${mins}m`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Price Control Slider & Waste Risk Feedback */}
        <div className="lg:col-span-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <RiskMeter evaluation={activeEvaluation} />

            <PriceSlider
              originalPrice={originalPrice}
              selectedPrice={activePrice}
              recommendedPrice={activeEvaluation.recommendedPrice}
              recommendedDiscountPct={activeEvaluation.recommendedDiscountPct}
              onChangePrice={(newPrice) => setCustomPrice(newPrice)}
              wasteRiskScore={activeEvaluation.wasteRiskScore}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.99] text-white font-extrabold text-base shadow-xl shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>PUBLISH SURPLUS DEAL (₹{activePrice}) ➔</span>
            </button>
            <p className="text-center text-[11px] text-zinc-400 mt-2">
              Broadcasts instantly to nearby customers within 5 km radial distance.
            </p>
          </div>
        </div>
      </form>

      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div>
            <h4 className="font-bold text-sm">Deal Published Successfully!</h4>
            <p className="text-xs text-emerald-200">Broadcasting to nearby consumers...</p>
          </div>
        </div>
      )}
    </div>
  );
}