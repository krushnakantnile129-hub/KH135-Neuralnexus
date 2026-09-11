"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StoreCategory, ProductUnit, SalesVelocity, Deal } from '@/shared/types';
import { evaluateWasteRisk } from '@/shared/engine/wasteRisk';
import { PriceSlider } from './price-slider';
import { RiskMeter } from './risk-meter';
import { addDeal, loadStores } from '@/lib/store';
import { formatINR } from '@/lib/utils';
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
  'DAIRY': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
  'BAKERY': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
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
  const nowTimeStr = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);
  const defaultBestBeforeTime = useMemo(() => {
    const d = new Date(Date.now() + 120 * 60 * 1000); // 2 hours from now
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  // Form State: 1. Product Information
  const [selectedStoreId, setSelectedStoreId] = useState(defaultStore.id);
  const [productName, setProductName] = useState('Fresh Organic Malai Paneer (500g)');
  const [category, setCategory] = useState<StoreCategory>('Dairy');
  const [description, setDescription] = useState('Fresh farm-sourced cottage cheese prepared this morning. High protein, tender texture.');
  const [imageUrl, setImageUrl] = useState(CATEGORY_IMAGES['Dairy']);
  const [quantity, setQuantity] = useState(12);
  const [unit, setUnit] = useState<ProductUnit>('packs');

  // Form State: 2. Pricing Information
  const [originalPrice, setOriginalPrice] = useState(220);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  // Form State: 3. Time & Expiry Information
  const [prepDate, setPrepDate] = useState(todayStr);
  const [prepTime, setPrepTime] = useState('07:30');
  const [bestBeforeDate, setBestBeforeDate] = useState(todayStr);
  const [bestBeforeTime, setBestBeforeTime] = useState(defaultBestBeforeTime);
  const [hasExpiryDate, setHasExpiryDate] = useState(false);
  const [expiryDate, setExpiryDate] = useState(todayStr);
  const [expiryTime, setExpiryTime] = useState('23:00');

  // Form State: 4. Inventory & Sales Velocity
  const [unitsSoldToday, setUnitsSoldToday] = useState(8);
  const [expectedDemand, setExpectedDemand] = useState(15);
  const [salesVelocity, setSalesVelocity] = useState<SalesVelocity>('MEDIUM');
  const [salesVelocityNumeric, setSalesVelocityNumeric] = useState(2.0);

  // UI state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Compute selling deadline ISO from bestBeforeDate and bestBeforeTime
  const deadlineIso = useMemo(() => {
    try {
      const dt = new Date(`${bestBeforeDate}T${bestBeforeTime}:00`);
      if (isNaN(dt.getTime())) {
        return new Date(Date.now() + 120 * 60 * 1000).toISOString();
      }
      return dt.toISOString();
    } catch {
      return new Date(Date.now() + 120 * 60 * 1000).toISOString();
    }
  }, [bestBeforeDate, bestBeforeTime]);

  const prepDateTimeIso = useMemo(() => {
    try {
      return new Date(`${prepDate}T${prepTime}:00`).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }, [prepDate, prepTime]);

  // Waste Risk Evaluation based on current parameters
  const evaluation = useMemo(() => {
    return evaluateWasteRisk({
      quantity: Math.max(1, quantity),
      originalPrice: Math.max(5, originalPrice),
      selectedPrice: customPrice !== null ? customPrice : originalPrice,
      deadlineIso,
      prepDateTimeIso,
      salesVelocity,
      salesVelocityNumeric,
      unitsSoldToday,
      expectedDemand,
      prepDate,
      prepTime,
      category,
    });
  }, [quantity, originalPrice, customPrice, deadlineIso, prepDateTimeIso, salesVelocity, salesVelocityNumeric, unitsSoldToday, expectedDemand, prepDate, prepTime, category]);

  const activePrice = customPrice !== null ? customPrice : evaluation.recommendedPrice;

  // Real-time evaluation taking active selected price
  const activeEvaluation = useMemo(() => {
    return evaluateWasteRisk({
      quantity: Math.max(1, quantity),
      originalPrice: Math.max(5, originalPrice),
      selectedPrice: activePrice,
      deadlineIso,
      prepDateTimeIso,
      salesVelocity,
      salesVelocityNumeric,
      unitsSoldToday,
      expectedDemand,
      prepDate,
      prepTime,
      category,
    });
  }, [quantity, originalPrice, activePrice, deadlineIso, prepDateTimeIso, salesVelocity, salesVelocityNumeric, unitsSoldToday, expectedDemand, prepDate, prepTime, category]);

  // Calculate discount percentage
  const discountPct = Math.max(0, Math.round(((originalPrice - activePrice) / originalPrice) * 100));

  // Quick Preset Handlers
  const applyDairyPreset = () => {
    setProductName('Fresh Organic Malai Paneer (500g)');
    setCategory('Dairy');
    setImageUrl(CATEGORY_IMAGES['Dairy']);
    setDescription('Farm-fresh soft cottage cheese batch made earlier today.');
    setQuantity(12);
    setUnit('packs');
    setOriginalPrice(220);
    setUnitsSoldToday(8);
    setExpectedDemand(16);
    setSalesVelocity('MEDIUM');
    setSalesVelocityNumeric(2.5);
    const d = new Date(Date.now() + 90 * 60 * 1000);
    setBestBeforeDate(d.toISOString().split('T')[0]);
    setBestBeforeTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
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
    setUnitsSoldToday(5);
    setExpectedDemand(12);
    setSalesVelocity('LOW');
    setSalesVelocityNumeric(1.5);
    const d = new Date(Date.now() + 60 * 60 * 1000);
    setBestBeforeDate(d.toISOString().split('T')[0]);
    setBestBeforeTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    setCustomPrice(80);
  };

  const applyPreparedFoodPreset = () => {
    setProductName('Paneer Butter Masala & Paratha Meal Box');
    setCategory('Prepared Food');
    setImageUrl(CATEGORY_IMAGES['Prepared Food']);
    setDescription('Hot lunch combo box prepared at noon with rich gravy and 3 butter parathas.');
    setQuantity(18);
    setUnit('boxes');
    setOriginalPrice(180);
    setUnitsSoldToday(14);
    setExpectedDemand(20);
    setSalesVelocity('HIGH');
    setSalesVelocityNumeric(4.0);
    const d = new Date(Date.now() + 45 * 60 * 1000);
    setBestBeforeDate(d.toISOString().split('T')[0]);
    setBestBeforeTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    setCustomPrice(90);
  };

  // Category change auto-updates default image
  const handleCategoryChange = (newCat: StoreCategory) => {
    setCategory(newCat);
    setImageUrl(CATEGORY_IMAGES[newCat] || CATEGORY_IMAGES['Other']);
  };

  // Validation
  const validateForm = (): boolean => {
    setValidationError(null);
    if (!productName.trim() || productName.trim().length < 3) {
      setValidationError('Product name must be at least 3 characters long.');
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

    const prepDateTime = new Date(`${prepDate}T${prepTime}:00`);
    const bestBeforeDateTime = new Date(`${bestBeforeDate}T${bestBeforeTime}:00`);

    if (bestBeforeDateTime.getTime() <= prepDateTime.getTime()) {
      setValidationError('Best Before Date/Time must be after Preparation Date/Time.');
      return false;
    }

    if (activeEvaluation.windowStatus === 'expired') {
      setValidationError('Selling deadline cannot be in the past. Please set a future Best Before time.');
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
      prepDate,
      prepTime,
      bestBeforeDate,
      bestBeforeTime,
      expiryDateTime: hasExpiryDate ? `${expiryDate}T${expiryTime}:00` : undefined,
      deadline: deadlineIso,
      salesVelocity,
      unitsSoldToday,
      expectedDemand,
      wasteRiskScore: activeEvaluation.wasteRiskScore,
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
            Quick Catalog Test Presets
          </span>
          <p className="text-xs text-zinc-300 mt-1 max-w-lg">
            Populate sample products across different categories to test real-time risk calculations, expiry warnings, and dynamic markdown logic.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyDairyPreset}
            className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-black transition-all active:scale-95 shadow"
          >
            🥛 Dairy (Paneer 50% Off)
          </button>
          <button
            type="button"
            onClick={applyBakeryPreset}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black transition-all active:scale-95 shadow"
          >
            🥐 Bakery (Sourdough 50% Off)
          </button>
          <button
            type="button"
            onClick={applyPreparedFoodPreset}
            className="px-3.5 py-2 rounded-xl bg-rose-400 hover:bg-rose-300 text-zinc-950 text-xs font-black transition-all active:scale-95 shadow"
          >
            🍱 Meal Box (High Velocity)
          </button>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleOpenReview} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Comprehensive Product, Expiry, & Inventory Inputs */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section 1: Product Information */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <h2 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wide">1. Product Information</h2>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Core Listing</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Originating Store / Branch</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-zinc-900"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={80}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Malai Paneer 500g, Artisanal Baguette, Cold Brew Latte"
                className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900 font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Product Category *</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as StoreCategory)}
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-zinc-800"
                >
                  <option value="Bakery">🥐 Bakery</option>
                  <option value="Prepared Food">🍱 Prepared Food</option>
                  <option value="Dairy">🥛 Dairy</option>
                  <option value="Snacks">🥨 Snacks</option>
                  <option value="Beverages">🧃 Beverages</option>
                  <option value="Other">📦 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Unit of Measurement *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as ProductUnit)}
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-zinc-800"
                >
                  <option value="pieces">pieces</option>
                  <option value="kg">kg</option>
                  <option value="litres">litres</option>
                  <option value="packs">packs</option>
                  <option value="plates">plates</option>
                  <option value="portions">portions</option>
                  <option value="boxes">boxes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Product Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the surplus batch, ingredients, freshness notes..."
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Product Image URL</label>
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-800"
                />
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-sm"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Time & Expiry Information with Warning System */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h2 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wide">2. Time & Expiry Information</h2>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono font-bold">
                <span className="text-zinc-500">Horizon:</span>
                <span className={
                  activeEvaluation.windowStatus === 'safe'
                    ? 'text-emerald-700 font-black'
                    : activeEvaluation.windowStatus === 'warning'
                    ? 'text-amber-600 font-black'
                    : 'text-rose-600 font-black'
                }>
                  {activeEvaluation.timeRemainingFormatted}
                </span>
              </div>
            </div>

            {/* Visual Warning Banner */}
            <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${
              activeEvaluation.windowStatus === 'safe'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : activeEvaluation.windowStatus === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-base">
                  {activeEvaluation.windowStatus === 'safe' ? '🟢' : activeEvaluation.windowStatus === 'warning' ? '🟡' : '🔴'}
                </span>
                <span>
                  {activeEvaluation.windowStatus === 'safe' && 'Safe selling window (> 3h left before deadline)'}
                  {activeEvaluation.windowStatus === 'warning' && 'Approaching expiry (1h – 3h remaining - discount advised)'}
                  {activeEvaluation.windowStatus === 'critical' && 'Critical risk (< 1h remaining - aggressive markdown needed)'}
                  {activeEvaluation.windowStatus === 'expired' && 'Expired selling deadline'}
                </span>
              </div>
              <span className="font-mono text-[11px] uppercase bg-white/70 px-2 py-0.5 rounded-lg border border-black/5">
                {activeEvaluation.timeRemainingFormatted}
              </span>
            </div>

            {/* Preparation Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  Date of Preparation
                </label>
                <input
                  type="date"
                  required
                  value={prepDate}
                  onChange={(e) => setPrepDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  Preparation Time
                </label>
                <input
                  type="time"
                  required
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-800"
                />
              </div>
            </div>

            {/* Best Before Date & Time (Determines Selling Deadline) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Best Before Date *
                </label>
                <input
                  type="date"
                  required
                  value={bestBeforeDate}
                  onChange={(e) => setBestBeforeDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900 font-bold bg-emerald-50/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Best Before Time * (Selling Deadline)
                </label>
                <input
                  type="time"
                  required
                  value={bestBeforeTime}
                  onChange={(e) => setBestBeforeTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900 font-bold bg-emerald-50/30"
                />
              </div>
            </div>

            {/* Optional Expiry Date/Time */}
            <div className="pt-2 border-t border-zinc-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700">
                <input
                  type="checkbox"
                  checked={hasExpiryDate}
                  onChange={(e) => setHasExpiryDate(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Set Separate Final Expiry Date/Time (where applicable)</span>
              </label>

              {hasExpiryDate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Final Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-zinc-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Final Expiry Time</label>
                    <input
                      type="time"
                      value={expiryTime}
                      onChange={(e) => setExpiryTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-zinc-200 rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Inventory & Sales Velocity Information */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h2 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wide">3. Inventory & Velocity Tracking</h2>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Demand Model</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Quantity Available *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    max={1000}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-zinc-900"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-zinc-400 font-medium">{unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Units Sold Today</label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={unitsSoldToday}
                  onChange={(e) => setUnitsSoldToday(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Expected Daily Demand</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={expectedDemand}
                  onChange={(e) => setExpectedDemand(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-800 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Observed Sales Velocity</label>
              <div className="grid grid-cols-3 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as SalesVelocity[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSalesVelocity(v)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      salesVelocity === v
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    {v === 'LOW' && '🐢 Low (< 2/hr)'}
                    {v === 'MEDIUM' && '🚶 Med (2–5/hr)'}
                    {v === 'HIGH' && '⚡ High (> 5/hr)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Pricing Base Inputs */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <h2 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wide">4. Pricing Information</h2>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                Auto Discount: -{discountPct}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <span>REVIEW & PUBLISH DEAL (₹{activePrice}) ➔</span>
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
                <h3 className="text-lg font-black text-zinc-900">Confirm Surplus Food Listing</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Grid */}
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
                  <span className="text-xs text-zinc-500 font-mono">
                    {quantity} {unit} available
                  </span>
                </div>
                <h4 className="font-extrabold text-base text-zinc-900">{productName}</h4>
                <p className="text-xs text-zinc-600 line-clamp-2">{description}</p>
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
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Potential Recovery</span>
                <span className="text-base font-black text-zinc-900">{formatINR(activePrice * quantity)}</span>
              </div>
            </div>

            {/* Time & Risk Status */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 font-medium">Selling Window:</span>
                <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  {activeEvaluation.timeRemainingFormatted} remaining
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 font-medium">Waste Risk Score:</span>
                <span className="font-extrabold text-zinc-900">
                  {activeEvaluation.wasteRiskScore}/100 ({activeEvaluation.riskLevel} Risk)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 font-medium">Best Before Deadline:</span>
                <span className="font-mono text-zinc-700">{bestBeforeDate} at {bestBeforeTime}</span>
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
            <p className="text-xs text-emerald-200">Broadcasted to nearby customers within 5 km.</p>
          </div>
        </div>
      )}
    </div>
  );
}