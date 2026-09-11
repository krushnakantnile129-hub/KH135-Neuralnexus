"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StoreCategory, ProductUnit, SalesVelocity, Deal } from '@/shared/types';
import { evaluateWasteRisk } from '@/shared/engine/wasteRisk';
import { PriceSlider } from './price-slider';
import { RiskMeter } from './risk-meter';
import { addDeal, loadStores } from '@/lib/store';
import { formatINR, formatDisplayDate, formatExpiryCountdown } from '@/lib/utils';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Info,
  Layers,
  Tag,
  Package,
  Eye,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

const CATEGORY_IMAGES: Record<string, string> = {
  'Dairy': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
  'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  'Prepared Food': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  'Snacks': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&auto=format&fit=crop&q=80',
  'Beverages': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
  'Other': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80',
};

export function FastCatalogForm() {
  const router = useRouter();
  const stores = loadStores();
  const defaultStore = stores[0] || {
    id: 'store-abc-bakery',
    name: 'ABC Gourmet Bakery & Café',
    category: 'Bakery' as StoreCategory,
    streetAddress: 'Plot 42, FC Road, Shivajinagar, Pune',
    latitude: 18.5255,
    longitude: 73.8595,
    phoneContact: '+91 98230 12345',
  };

  // Helper date strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const twoDaysLaterStr = useMemo(() => {
    const d = new Date(Date.now() + 2 * 24 * 3600000);
    return d.toISOString().split('T')[0];
  }, []);

  // Form State: 1. Product Information
  const [selectedStoreId, setSelectedStoreId] = useState(defaultStore.id);
  const [productName, setProductName] = useState('Fresh Sandwich');
  const [category, setCategory] = useState<StoreCategory>('Prepared Food');
  const [description, setDescription] = useState('Triple decker multigrain bread, fresh lettuce, cheddar cheese, and garden cucumber.');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80');
  const [quantity, setQuantity] = useState(8);
  const [unit, setUnit] = useState<ProductUnit>('pieces');

  // Form State: 2. Pricing Information
  const [originalPrice, setOriginalPrice] = useState(60);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  // Form State: 3. Manufacturing & Expiry Date (DD Month YYYY)
  const [manufacturingDate, setManufacturingDate] = useState('2026-09-10');
  const [expiryDate, setExpiryDate] = useState('2026-09-12');

  // Form State: 4. Sales Velocity
  const [salesVelocity, setSalesVelocity] = useState<SalesVelocity>('LOW');
  const [salesVelocityNumeric, setSalesVelocityNumeric] = useState(1.5);
  const [unitsSoldToday, setUnitsSoldToday] = useState(4);
  const [expectedDemand, setExpectedDemand] = useState(8);

  // UI state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Real-time evaluation taking active selected price
  const activeEvaluation = useMemo(() => {
    const p = customPrice !== null ? customPrice : 35;
    return evaluateWasteRisk({
      quantity: Math.max(1, quantity),
      originalPrice: Math.max(5, originalPrice),
      selectedPrice: p,
      manufacturingDate,
      expiryDate,
      salesVelocity,
      salesVelocityNumeric,
      unitsSoldToday,
      expectedDemand,
      category,
    });
  }, [quantity, originalPrice, customPrice, manufacturingDate, expiryDate, salesVelocity, salesVelocityNumeric, unitsSoldToday, expectedDemand, category]);

  const activePrice = customPrice !== null ? customPrice : activeEvaluation.recommendedPrice;

  // Calculate discount percentage
  const discountPct = Math.max(0, Math.round(((originalPrice - activePrice) / originalPrice) * 100));

  // Quick Preset Handlers
  const applySandwichPreset = () => {
    setProductName('Fresh Sandwich');
    setCategory('Prepared Food');
    setImageUrl('https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80');
    setDescription('Triple decker multigrain bread, garden lettuce, cucumber, cheddar cheese, and fresh herb spread.');
    setQuantity(8);
    setUnit('pieces');
    setOriginalPrice(60);
    setManufacturingDate('2026-09-10');
    setExpiryDate('2026-09-12');
    setSalesVelocity('LOW');
    setSalesVelocityNumeric(1.5);
    setCustomPrice(35);
  };

  const applyDairyPreset = () => {
    setProductName('Fresh Organic Malai Paneer (500g)');
    setCategory('Dairy');
    setImageUrl(CATEGORY_IMAGES['Dairy']);
    setDescription('Farm-fresh soft cottage cheese batch made earlier today.');
    setQuantity(12);
    setUnit('packs');
    setOriginalPrice(220);
    setManufacturingDate('2026-09-10');
    setExpiryDate('2026-09-13');
    setSalesVelocity('MEDIUM');
    setSalesVelocityNumeric(2.5);
    setCustomPrice(110);
  };

  const applyBakeryPreset = () => {
    setProductName('Artisanal Sourdough Country Loaf');
    setCategory('Bakery');
    setImageUrl(CATEGORY_IMAGES['Bakery']);
    setDescription('Slow fermented 24-hour crusty sourdough with soft open crumb.');
    setQuantity(15);
    setUnit('pieces');
    setOriginalPrice(160);
    setManufacturingDate('2026-09-10');
    setExpiryDate('2026-09-12');
    setSalesVelocity('LOW');
    setSalesVelocityNumeric(1.5);
    setCustomPrice(80);
  };

  // Category change auto-updates default image
  const handleCategoryChange = (newCat: StoreCategory) => {
    setCategory(newCat);
    setImageUrl(CATEGORY_IMAGES[newCat] || CATEGORY_IMAGES['Other']);
  };

  // Validation
  const validateForm = (): boolean => {
    setValidationError(null);
    if (!productName.trim() || productName.trim().length < 2) {
      setValidationError('Product name must be at least 2 characters long.');
      return false;
    }
    if (quantity <= 0) {
      setValidationError('Quantity available must be at least 1.');
      return false;
    }
    if (originalPrice < 5) {
      setValidationError('Original price must be at least ₹5.');
      return false;
    }

    if (!manufacturingDate || !expiryDate) {
      setValidationError('Please specify both Manufacturing Date and Expiry Date.');
      return false;
    }

    const mfgTime = new Date(manufacturingDate).getTime();
    const expTime = new Date(expiryDate).getTime();

    if (expTime <= mfgTime) {
      setValidationError('Expiry Date must be strictly after the Manufacturing Date.');
      return false;
    }

    if (activeEvaluation.isExpired) {
      setValidationError('Product is marked as expired based on current date. Please set a future Expiry Date.');
      return false;
    }

    return true;
  };

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const handleFinalPublish = () => {
    setIsSubmitting(true);
    const store = stores.find(s => s.id === selectedStoreId) || defaultStore;

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      storeId: store.id,
      storeName: store.name,
      storeCategory: category,
      storeAddress: store.streetAddress,
      latitude: store.latitude,
      longitude: store.longitude,
      phoneContact: store.phoneContact,
      productName: productName.trim(),
      category,
      description: description.trim() || `Fresh surplus ${category.toLowerCase()} batch at ₹${activePrice} clearance price.`,
      imageUrl: imageUrl.trim() || CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Other'],
      initialUnits: quantity,
      remainingUnits: quantity,
      soldUnits: 0,
      unit,
      originalPrice,
      recommendedPrice: activeEvaluation.recommendedPrice,
      publishedPrice: activePrice,
      discountPct,
      manufacturingDate,
      manufacturingDateFormatted: activeEvaluation.manufacturingDateFormatted,
      expiryDate,
      expiryDateFormatted: activeEvaluation.expiryDateFormatted,
      expiryCountdownFormatted: activeEvaluation.expiryCountdownFormatted,
      deadline: new Date(`${expiryDate}T23:59:59.999`).toISOString(),
      salesVelocity,
      salesVelocityNumeric,
      unitsSoldToday,
      expectedDemand,
      wasteRiskScore: activeEvaluation.wasteRiskScore,
      wasteRiskPercentage: activeEvaluation.wasteRiskPercentage,
      riskLevel: activeEvaluation.riskLevel,
      riskReasons: activeEvaluation.reasons,
      status: 'ACTIVE',
      freshnessTag: 'Verified Fresh',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDeal(newDeal);
    setShowConfirmModal(false);
    setShowSuccessToast(true);

    setTimeout(() => {
      router.push('/merchant');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Quick Presets Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-zinc-900 text-white rounded-3xl p-5 shadow-lg border border-emerald-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            ResQFood Quick Test Presets
          </span>
          <p className="text-xs text-zinc-300 mt-1 max-w-lg">
            Populate sample products with Manufacturing &amp; Expiry dates (`DD Month YYYY`) to test live countdowns and rule-based waste risk scoring.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applySandwichPreset}
            className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-black transition-all active:scale-95 shadow"
          >
            🥪 Fresh Sandwich (₹35 / 86% Risk)
          </button>
          <button
            type="button"
            onClick={applyDairyPreset}
            className="px-3.5 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-zinc-950 text-xs font-black transition-all active:scale-95 shadow"
          >
            🥛 Paneer (Dairy 50% Off)
          </button>
          <button
            type="button"
            onClick={applyBakeryPreset}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black transition-all active:scale-95 shadow"
          >
            🥐 Sourdough (Bakery)
          </button>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 animate-in shake">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-bold">{validationError}</span>
        </div>
      )}

      {/* Main Listing Form */}
      <form onSubmit={handleOpenReview} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Product Info & Date Pickers */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section 1: Product Information */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <h2 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wide">1. Product Information</h2>
              </div>
              <span className="text-xs text-zinc-400">Step 1 of 3</span>
            </div>

            {/* Store Outlet Picker */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Select Outlet / Location *</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 focus:bg-white text-zinc-800"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.streetAddress})</option>
                ))}
              </select>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Fresh Sandwich, Chocolate Croissant, Whole Milk"
                className="w-full px-3.5 py-2.5 text-sm font-semibold border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-zinc-400 text-zinc-900"
              />
            </div>

            {/* Category Grid */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-2">Category *</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(['Bakery', 'Prepared Food', 'Dairy', 'Snacks', 'Beverages', 'Other'] as StoreCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                      category === cat
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Quantity Available *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-bold border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Unit of Measurement *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as ProductUnit)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50 focus:bg-white text-zinc-800"
                >
                  <option value="pieces">pieces / units</option>
                  <option value="kg">kg (Kilograms)</option>
                  <option value="litres">litres</option>
                  <option value="packs">packs / containers</option>
                  <option value="plates">plates</option>
                  <option value="portions">portions</option>
                  <option value="boxes">boxes / combos</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Product Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about ingredients, packaging, storage recommendations..."
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-800 resize-none"
              />
            </div>
          </div>

          {/* Section 2: Manufacturing & Expiry Date Pickers (DD Month YYYY) */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h2 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wide">2. Manufacturing &amp; Expiry Dates</h2>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700">
                DD Month YYYY Format
              </span>
            </div>

            {/* Live Expiry Countdown Banner */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              activeEvaluation.windowStatus === 'safe'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : activeEvaluation.windowStatus === 'warning'
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">
                  {activeEvaluation.windowStatus === 'safe' ? '🟢' : activeEvaluation.windowStatus === 'warning' ? '🟡' : '🔴'}
                </span>
                <div>
                  <div className="font-extrabold text-xs flex items-center gap-2">
                    <span>Expires on: <strong>{activeEvaluation.expiryDateFormatted}</strong></span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Live Countdown: <strong className="font-mono font-black">{activeEvaluation.expiryCountdownFormatted}</strong>
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-black uppercase px-2.5 py-1 rounded-xl bg-white shadow-sm border border-black/5">
                ⏳ {activeEvaluation.expiryCountdownFormatted}
              </span>
            </div>

            {/* Manufacturing & Expiry Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200 space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  Manufacturing Date *
                </label>
                <input
                  type="date"
                  required
                  value={manufacturingDate}
                  onChange={(e) => setManufacturingDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-zinc-900"
                />
                <p className="text-[11px] text-zinc-500 font-semibold pt-1">
                  📅 Made: <strong className="text-zinc-800">{formatDisplayDate(manufacturingDate)}</strong>
                </p>
              </div>

              <div className="bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-200 space-y-1.5">
                <label className="block text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-zinc-900"
                />
                <p className="text-[11px] text-emerald-800 font-semibold pt-1">
                  📅 Expires: <strong className="text-emerald-950">{formatDisplayDate(expiryDate)}</strong>
                </p>
              </div>
            </div>

            {/* Sales Velocity Rate */}
            <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700">Estimated Sales Velocity</label>
                <p className="text-[11px] text-zinc-400">Average units sold per hour at this counter</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="50"
                  value={salesVelocityNumeric}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 1.0;
                    setSalesVelocityNumeric(v);
                    if (v < 2.0) setSalesVelocity('LOW');
                    else if (v <= 5.0) setSalesVelocity('MEDIUM');
                    else setSalesVelocity('HIGH');
                  }}
                  className="w-20 px-2.5 py-1.5 text-xs font-mono font-bold border border-zinc-300 rounded-xl text-center bg-white"
                />
                <span className="text-xs text-zinc-500 font-bold">{unit}/hr</span>
              </div>
            </div>
          </div>

          {/* Section 3: Pricing Baseline */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <h2 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wide">3. Pricing Baseline</h2>
              </div>
              <span className="text-xs text-zinc-400">Step 3 of 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Original Price per Unit (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-zinc-400 font-bold text-sm">₹</span>
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
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm font-mono border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Recommended Clearance Price</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-emerald-600 font-bold text-sm">₹</span>
                  <input
                    type="text"
                    disabled
                    value={activeEvaluation.recommendedPrice}
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm font-mono border border-emerald-200 rounded-xl bg-emerald-50/50 text-emerald-900 font-extrabold cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Waste Risk Engine, Interactive 60 FPS Price Slider, & Submit Action */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          
          <div className="space-y-5">
            {/* Explainable Waste Risk Engine Display */}
            <RiskMeter evaluation={activeEvaluation} />

            {/* Interactive 60 FPS Price Slider */}
            <PriceSlider
              originalPrice={originalPrice}
              selectedPrice={activePrice}
              recommendedPrice={activeEvaluation.recommendedPrice}
              recommendedDiscountPct={activeEvaluation.recommendedDiscountPct}
              onChangePrice={(newPrice) => setCustomPrice(newPrice)}
              wasteRiskScore={activeEvaluation.wasteRiskScore}
            />
          </div>

          {/* Action Button: Review & Publish */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-500 hover:to-teal-700 active:scale-[0.99] text-white font-black text-base shadow-xl shadow-emerald-700/25 flex items-center justify-center gap-2.5 transition-all"
            >
              <Eye className="w-5 h-5" />
              <span>REVIEW &amp; PUBLISH DEAL (₹{activePrice}) ➔</span>
            </button>
            <p className="text-center text-[11px] text-zinc-400 mt-2">
              Opens pre-publication summary card with full risk breakdown.
            </p>
          </div>

        </div>
      </form>

      {/* Pre-Publication Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 space-y-5 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pre-Publication Review</span>
                <h3 className="text-lg font-black text-zinc-900">Confirm ResQFood Surplus Listing</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Card Format */}
            <div className="flex gap-4 items-start bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
              <img
                src={imageUrl || CATEGORY_IMAGES[category]}
                alt={productName}
                className="w-20 h-20 rounded-xl object-cover border border-zinc-200 shadow-sm"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-zinc-900 text-white">
                    {category}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono font-bold">
                    📦 {quantity} {unit} left
                  </span>
                </div>
                <h4 className="font-extrabold text-base text-zinc-900">{productName}</h4>
                <p className="text-xs text-zinc-600 line-clamp-1">{description}</p>
              </div>
            </div>

            {/* Key Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Original</span>
                <span className="text-sm font-bold text-zinc-500 line-through">{formatINR(originalPrice)}</span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Clearance Price</span>
                <span className="text-base font-black text-emerald-800">{formatINR(activePrice)}</span>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <span className="text-[10px] uppercase font-bold text-rose-700 block">Discount</span>
                <span className="text-base font-black text-rose-700">-{discountPct}%</span>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Waste Risk</span>
                <span className="text-base font-black text-zinc-900">{activeEvaluation.wasteRiskScore}% 🔴</span>
              </div>
            </div>

            {/* Date & Expiry Details Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 font-medium">🏭 Manufacturing Date:</span>
                <span className="font-bold text-zinc-900">{activeEvaluation.manufacturingDateFormatted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 font-medium">📅 Expiry Date:</span>
                <span className="font-bold text-zinc-900">{activeEvaluation.expiryDateFormatted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 font-medium">⏳ Expiry Countdown:</span>
                <span className="font-bold text-emerald-700 font-mono">{activeEvaluation.expiryCountdownFormatted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 font-medium">💡 Primary Reason:</span>
                <span className="font-medium text-zinc-700 italic">{activeEvaluation.primaryReason}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-3 px-4 rounded-xl border border-zinc-300 font-bold text-xs text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                [ EDIT DETAILS ]
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalPublish}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>[ PUBLISH DEAL NOW ]</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-950 text-white px-6 py-4 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div>
            <h4 className="font-extrabold text-sm">Deal Published Successfully!</h4>
            <p className="text-xs text-emerald-200">Broadcasted to nearby customers within 10 km.</p>
          </div>
        </div>
      )}
    </div>
  );
}