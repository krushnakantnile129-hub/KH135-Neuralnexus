"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StoreCategory, ProductUnit, Deal } from '@/shared/types';
import { calculateRecommendedPrice, MultiFactorPricingResult } from '@/shared/engine/wasteRisk';
import { addDeal, loadStores } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  Tag,
  Package,
  Eye,
  AlertCircle,
  Upload,
  Sliders,
  Store,
  Info
} from 'lucide-react';

const CATEGORY_IMAGES: Record<string, string> = {
  'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  'Dairy & Farm': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
  'Restaurant': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
  'Cafés': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
  'Groceries': 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&auto=format&fit=crop&q=80',
  'Canteens': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
};

interface FastCatalogFormProps {
  onSuccess?: () => void;
}

export function FastCatalogForm({ onSuccess }: FastCatalogFormProps) {
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

  // Helper date/time strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultExpiryTime = useMemo(() => {
    const d = new Date(Date.now() + 4 * 3600000); // 4 hours from now
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  // Form State Inputs
  const [selectedStoreId, setSelectedStoreId] = useState(defaultStore.id);
  const [productName, setProductName] = useState('Fresh Milk (1L Pouch)');
  const [category, setCategory] = useState<string>('Dairy & Farm');
  const [stockRemaining, setStockRemaining] = useState<number>(15);
  const [originalPrice, setOriginalPrice] = useState<number>(70);
  const [arrivalTimeDate, setArrivalTimeDate] = useState<string>(todayStr);
  const [arrivalTimeTime, setArrivalTimeTime] = useState<string>('08:00');
  const [unitsSoldSoFar, setUnitsSoldSoFar] = useState<number>(0);
  const [expiryDate, setExpiryDate] = useState<string>(todayStr);
  const [expiryTime, setExpiryTime] = useState<string>(defaultExpiryTime);
  const [imageUrl, setImageUrl] = useState<string>(CATEGORY_IMAGES['Dairy & Farm']);
  const [description, setDescription] = useState<string>('Fresh farm pasteurized milk batch.');
  const [unit, setUnit] = useState<ProductUnit>('packs');

  // Custom Price Override state (null until adjusted by slider)
  const [manualPrice, setManualPrice] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Derive Hours Until Expiry & Total Shelf Life Hours
  const { hoursUntilExpiry, totalShelfLifeHours, expiryIso } = useMemo(() => {
    const now = new Date();
    let expDt = new Date(`${expiryDate}T${expiryTime}:00`);
    if (isNaN(expDt.getTime())) {
      expDt = new Date(Date.now() + 4 * 3600000);
    }
    const diffMs = expDt.getTime() - now.getTime();
    const hrsExpiry = Math.max(0.01, diffMs / 3600000);

    let shelfLife = 12; // default
    if (arrivalTimeDate && arrivalTimeTime) {
      const arrDt = new Date(`${arrivalTimeDate}T${arrivalTimeTime}:00`);
      if (!isNaN(arrDt.getTime()) && expDt.getTime() > arrDt.getTime()) {
        shelfLife = Math.max(1, (expDt.getTime() - arrDt.getTime()) / 3600000);
      }
    }

    return {
      hoursUntilExpiry: hrsExpiry,
      totalShelfLifeHours: shelfLife,
      expiryIso: expDt.toISOString(),
    };
  }, [expiryDate, expiryTime, arrivalTimeDate, arrivalTimeTime]);

  // Execute Multi-Factor Dynamic Pricing Algorithm
  const pricingResult: MultiFactorPricingResult = useMemo(() => {
    return calculateRecommendedPrice({
      originalPrice,
      hoursUntilExpiry,
      totalShelfLifeHours,
      stockRemaining,
      unitsSoldSoFar,
    });
  }, [originalPrice, hoursUntilExpiry, totalShelfLifeHours, stockRemaining, unitsSoldSoFar]);

  // Final published price: manual override or recommended
  const finalPrice = manualPrice !== null ? manualPrice : pricingResult.recommendedPrice;
  const discountPct = Math.max(0, Math.round(((originalPrice - finalPrice) / originalPrice) * 100));

  // REACTIVE DYNAMIC PRICING: Reset manual price override whenever ANY input parameter changes
  // so recommended price & price slider position update reactively in real time.
  useEffect(() => {
    setManualPrice(null);
  }, [originalPrice, stockRemaining, expiryDate, expiryTime, arrivalTimeDate, arrivalTimeTime, unitsSoldSoFar]);

  // Update category image preview when category changes
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (CATEGORY_IMAGES[newCat]) {
      setImageUrl(CATEGORY_IMAGES[newCat]);
    }
  };

  // Quick Preset Fillers
  const applyPreset = (presetName: string) => {
    setManualPrice(null);
    setValidationError(null);
    if (presetName === 'milk') {
      setProductName('Fresh Milk (1L Pouch)');
      setCategory('Dairy & Farm');
      setImageUrl(CATEGORY_IMAGES['Dairy & Farm']);
      setOriginalPrice(70);
      setStockRemaining(20);
      setUnitsSoldSoFar(4);
      setDescription('Chilled farm fresh whole milk.');
    } else if (presetName === 'sourdough') {
      setProductName('Whole Wheat Sourdough Loaf');
      setCategory('Bakery');
      setImageUrl(CATEGORY_IMAGES['Bakery']);
      setOriginalPrice(120);
      setStockRemaining(10);
      setUnitsSoldSoFar(2);
      setDescription('Artisan sourdough baked stone-ground.');
    } else if (presetName === 'curd') {
      setProductName('Fresh Curd / Dahi (500g)');
      setCategory('Dairy & Farm');
      setImageUrl(CATEGORY_IMAGES['Dairy & Farm']);
      setOriginalPrice(40);
      setStockRemaining(15);
      setUnitsSoldSoFar(3);
      setDescription('Pure set dahi prepared today.');
    } else if (presetName === 'croissant') {
      setProductName('Butter Croissant Pair');
      setCategory('Bakery');
      setImageUrl(CATEGORY_IMAGES['Bakery']);
      setOriginalPrice(200);
      setStockRemaining(12);
      setUnitsSoldSoFar(5);
      setDescription('Flaky French butter croissants.');
    }
  };

  // Validate Required Fields
  const validateForm = (): boolean => {
    setValidationError(null);
    if (!productName.trim() || productName.trim().length < 3) {
      setValidationError('Product Name is required (minimum 3 characters).');
      return false;
    }
    if (!category) {
      setValidationError('Please select a Product Category.');
      return false;
    }
    if (!stockRemaining || stockRemaining < 1) {
      setValidationError('Stock Quantity must be at least 1 unit.');
      return false;
    }
    if (!originalPrice || originalPrice < 5) {
      setValidationError('Initial / Original Price must be at least ₹5.');
      return false;
    }
    if (hoursUntilExpiry <= 0) {
      setValidationError('Expiry Date & Time must be set in the future.');
      return false;
    }
    return true;
  };

  // Form Submit: Publish New Surplus Item Workflow
  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const store = stores.find(s => s.id === selectedStoreId) || defaultStore;

    // Convert category to StoreCategory
    let storeCat: StoreCategory = 'BAKERY';
    if (category.toLowerCase().includes('dairy')) storeCat = 'DAIRY';
    else if (category.toLowerCase().includes('baker')) storeCat = 'BAKERY';
    else if (category.toLowerCase().includes('rest')) storeCat = 'RESTAURANT';
    else if (category.toLowerCase().includes('cafe')) storeCat = 'CAFE';
    else if (category.toLowerCase().includes('cant')) storeCat = 'CANTEEN';
    else if (category.toLowerCase().includes('groc')) storeCat = 'GROCERY';

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      storeId: store.id,
      storeName: store.name,
      shopName: store.name,
      storeCategory: storeCat,
      storeAddress: store.streetAddress,
      locationName: store.streetAddress,
      latitude: store.latitude,
      longitude: store.longitude,
      phoneContact: store.phoneContact,
      productName: productName.trim(),
      title: productName.trim(),
      category: storeCat,
      description: description.trim() || `Fresh end-of-day surplus ${category}.`,
      imageUrl: imageUrl.trim() || CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Bakery'],
      image: imageUrl.trim() || CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Bakery'],
      initialUnits: stockRemaining,
      remainingUnits: stockRemaining,
      soldUnits: unitsSoldSoFar,
      unit,
      originalPrice,
      recommendedPrice: pricingResult.recommendedPrice,
      publishedPrice: finalPrice,
      discountedPrice: finalPrice,
      discountPct,
      deadline: expiryIso,
      pickupWindow: `Today until ${expiryTime}`,
      salesVelocity: pricingResult.riskLevel === 'Critical' ? 'HIGH' : pricingResult.riskLevel === 'High' ? 'HIGH' : 'MEDIUM',
      wasteRiskScore: pricingResult.wasteRiskScore,
      status: 'ACTIVE',
      freshnessTag: 'Verified Fresh',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Prepend to global deals array
    addDeal(newDeal);
    setIsSubmitting(false);
    setShowSuccessToast(true);

    if (onSuccess) {
      onSuccess();
    }

    setTimeout(() => {
      setShowSuccessToast(false);
      router.push('/merchant');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Quick Preset Toolbar */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-zinc-900 text-white rounded-3xl p-5 shadow-lg border border-emerald-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            Quick Preset Items
          </span>
          <p className="text-xs text-zinc-300 mt-1">
            Auto-fill form with standard surplus food items to test multi-factor pricing calculations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset('milk')}
            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-black transition-all active:scale-95 shadow"
          >
            🥛 Fresh Milk (1L)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('sourdough')}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black transition-all active:scale-95 shadow"
          >
            🥐 Sourdough Bread
          </button>
          <button
            type="button"
            onClick={() => applyPreset('curd')}
            className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-black transition-all active:scale-95 shadow"
          >
            🥣 Fresh Curd (500g)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('croissant')}
            className="px-3 py-1.5 rounded-xl bg-rose-400 hover:bg-rose-300 text-zinc-950 text-xs font-black transition-all active:scale-95 shadow"
          >
            🥐 Croissants Pair
          </button>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handlePublish} className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-sm space-y-6">
        
        <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>Surplus Product Listing &amp; Dynamic Pricing</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Fill in product parameters. Multi-factor algorithm automatically recommends price &amp; waste risk score.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-zinc-600">Store Outlet:</label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-zinc-800"
            >
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Column 1: Product Metadata */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider border-b border-zinc-100 pb-2">
              1. Product Details &amp; Image
            </h3>

            {/* Product Image Input */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Product Image Thumbnail (URL / File Preview)</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900 font-mono"
                />
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={80}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Fresh Milk (1L), Whole Wheat Sourdough, Paneer Slices"
                className="w-full px-3.5 py-2.5 text-sm font-bold border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900"
              />
            </div>

            {/* Product Category */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-bold border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-800"
              >
                <option value="Dairy & Farm">🥛 Dairy &amp; Farm</option>
                <option value="Bakery">🥐 Bakery</option>
                <option value="Restaurant">🍕 Restaurant</option>
                <option value="Cafés">☕ Cafés</option>
                <option value="Groceries">🥗 Groceries</option>
                <option value="Canteens">🍱 Canteens</option>
              </select>
            </div>

            {/* Stock Quantity & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Stock Quantity (`stockRemaining`) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={1000}
                  value={stockRemaining}
                  onChange={(e) => setStockRemaining(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2 text-xs font-mono font-bold border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Unit of Measure</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as ProductUnit)}
                  className="w-full px-3.5 py-2 text-xs font-semibold border border-zinc-200 rounded-xl bg-zinc-50 outline-none text-zinc-800"
                >
                  <option value="packs font-bold">packs</option>
                  <option value="pieces">pieces</option>
                  <option value="kg">kg</option>
                  <option value="litres">litres</option>
                  <option value="boxes">boxes</option>
                  <option value="portions">portions</option>
                </select>
              </div>
            </div>

            {/* Product Description */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Description / Merchant Notes</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fresh batch packaged earlier today..."
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-800"
              />
            </div>
          </div>

          {/* Column 2: Pricing, Arrival Time & Expiry Inputs */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider border-b border-zinc-100 pb-2">
              2. Pricing, Velocity &amp; Expiry Parameters
            </h3>

            {/* Initial / Original Price */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Initial / Original Price (₹) (`originalPrice`) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  required
                  min={5}
                  max={50000}
                  value={originalPrice}
                  onChange={(e) => {
                    setOriginalPrice(Math.max(5, parseInt(e.target.value) || 5));
                    setManualPrice(null); // Recalculate auto recommendation
                  }}
                  className="w-full pl-8 pr-3.5 py-2.5 text-sm font-mono font-black border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-zinc-900"
                />
              </div>
            </div>

            {/* Optional Store Arrival Time & Units Sold So Far */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  Store Arrival Time (`arrivalTime`)
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="date"
                    value={arrivalTimeDate}
                    onChange={(e) => setArrivalTimeDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-[11px] font-mono border border-zinc-200 rounded-lg text-zinc-800"
                  />
                  <input
                    type="time"
                    value={arrivalTimeTime}
                    onChange={(e) => setArrivalTimeTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-[11px] font-mono border border-zinc-200 rounded-lg text-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Units Sold So Far (`unitsSoldSoFar`)</label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={unitsSoldSoFar}
                  onChange={(e) => setUnitsSoldSoFar(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-zinc-200 rounded-xl text-zinc-800"
                />
              </div>
            </div>

            {/* Expiry Date & Time */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                Expiry Date &amp; Time (`expiryTime`) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-rose-200 rounded-xl bg-rose-50/30 text-zinc-900"
                />
                <input
                  type="time"
                  required
                  value={expiryTime}
                  onChange={(e) => setExpiryTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-rose-200 rounded-xl bg-rose-50/30 text-zinc-900"
                />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Hours Until Expiry: <strong className="text-zinc-700 font-mono">{hoursUntilExpiry.toFixed(1)}h</strong> (Shelf Life: <strong className="text-zinc-700 font-mono">{totalShelfLifeHours.toFixed(1)}h</strong>)
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Live Multi-Factor Calculation & Interactive Price Slider */}
        <div className="pt-4 border-t border-zinc-200 space-y-6">
          <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-200 space-y-5">
            
            {/* Header: Recommended Clearance Price + Single Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">Dynamic Pricing Recommendation</span>
                <div className="flex items-center gap-3 mt-1">
                  <h3 className="text-2xl font-black text-zinc-900">
                    {formatINR(pricingResult.recommendedPrice)}
                  </h3>
                  <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                    -{pricingResult.discountPct}% OFF
                  </span>

                  {/* Single simple status badge next to recommended price */}
                  <span className={`px-3 py-1 rounded-full border text-xs font-black flex items-center gap-1.5 shadow-sm ${
                    pricingResult.riskLevel === 'Critical' || pricingResult.riskLevel === 'High'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : pricingResult.riskLevel === 'Moderate'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    <span>
                      {pricingResult.riskLevel === 'Critical' || pricingResult.riskLevel === 'High' ? '🔴' : pricingResult.riskLevel === 'Moderate' ? '🟡' : '🟢'}
                    </span>
                    <span>
                      {pricingResult.riskLevel === 'Critical' || pricingResult.riskLevel === 'High' ? 'High Urgency' : pricingResult.riskLevel === 'Moderate' ? 'Moderate Urgency' : 'Low Urgency'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="text-xs text-zinc-500 font-medium sm:text-right">
                <div>Original Price: <strong className="text-zinc-800 font-mono">{formatINR(originalPrice)}</strong></div>
                <div>Recommended Markdown: <strong className="text-emerald-700 font-mono">{formatINR(pricingResult.recommendedPrice)}</strong></div>
              </div>
            </div>

            {/* Interactive Price Control Slider */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>Interactive Price Control Slider</span>
                </div>
                <div className="text-xs">
                  <span className="text-zinc-500">Selected Final Price: </span>
                  <span className="font-mono font-black text-base text-emerald-800">{formatINR(finalPrice)}</span>
                  <span className="text-xs font-bold text-rose-600 ml-1.5">({discountPct}% off)</span>
                </div>
              </div>

              <input
                type="range"
                min={Math.round(originalPrice * 0.20)}
                max={originalPrice}
                step={1}
                value={finalPrice}
                onChange={(e) => setManualPrice(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium pt-1">
                <span>Floor (20%): {formatINR(Math.round(originalPrice * 0.20))}</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Recommended: {formatINR(pricingResult.recommendedPrice)}
                </span>
                <span>Original Ceiling: {formatINR(originalPrice)}</span>
              </div>
            </div>

          </div>

          {/* Prominent Publish Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-zinc-500">
              Item will immediately go live on the <strong>Consumer Deals Feed</strong> for walk-in counter purchase.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-5 h-5 fill-current text-white" />
              <span>Publish New Surplus Item (₹{finalPrice}) ➔</span>
            </button>
          </div>
        </div>

      </form>

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-950 text-white px-6 py-4 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div>
            <h4 className="font-extrabold text-sm">Surplus Item Published Live!</h4>
            <p className="text-xs text-emerald-200">Broadcasted to nearby consumer feeds immediately.</p>
          </div>
        </div>
      )}
    </div>
  );
}