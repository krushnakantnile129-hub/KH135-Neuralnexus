"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/navbar';
import { CategoryFilter } from '@/components/consumer/category-filter';
import { DealCard } from '@/components/consumer/deal-card';
import { DealModal } from '@/components/consumer/deal-modal';
import { DealsMap } from '@/components/consumer/deals-map';
import { Deal } from '@/shared/types';
import { loadDeals } from '@/lib/store';
import { calculateHaversineDistance, POPULAR_LOCATIONS } from '@/lib/geo';
import { 
  Sparkles, 
  Search, 
  MapPin, 
  ShieldCheck, 
  Footprints,
  Compass,
  Map as MapIcon,
  LayoutGrid,
  Filter,
  Flame,
  ArrowUpDown
} from 'lucide-react';

export default function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [userLocation, setUserLocation] = useState(POPULAR_LOCATIONS[0]);
  const [maxRadiusKm, setMaxRadiusKm] = useState(10.0); // Default and max 10 km
  const [isLocating, setIsLocating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [sortBy, setSortBy] = useState<'distance' | 'discount' | 'risk'>('distance');

  const refreshDeals = () => {
    setDeals(loadDeals());
  };

  // Load and subscribe to deals
  useEffect(() => {
    refreshDeals();
    const interval = setInterval(refreshDeals, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGetBrowserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          name: 'My Live Location (GPS)',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert('Location permission denied or unavailable. Falling back to default Pune commercial district.');
      },
      { timeout: 8000 }
    );
  };

  const { filteredDeals, categoryCounts } = useMemo(() => {
    const now = Date.now();
    const counts: Record<string, number> = {};

    // 1. Strict 10 KM max cutoff & filter out expired deals
    const listWithDist = deals
      .filter((d) => {
        const expiryMs = d.expiryDate 
          ? (d.expiryDate.includes('T') ? new Date(d.expiryDate).getTime() : new Date(`${d.expiryDate}T23:59:59.999`).getTime())
          : new Date(d.deadline).getTime();
        const isNotExpired = expiryMs > now && d.status !== 'EXPIRED';
        return d.status === 'ACTIVE' && d.remainingUnits > 0 && isNotExpired;
      })
      .map((d) => {
        const dist = calculateHaversineDistance(
          userLocation.lat,
          userLocation.lng,
          d.latitude,
          d.longitude
        );
        counts[d.category] = (counts[d.category] || 0) + 1;
        return { ...d, distanceMeters: dist };
      })
      // Strictly exclude any deal beyond 10 km (or active maxRadiusKm, max 10km)
      .filter((d) => (d.distanceMeters || 0) <= Math.min(10, maxRadiusKm) * 1000);

    // 2. Category & Search filtering
    const searchFiltered = listWithDist.filter((d) => {
      if (selectedCategory !== 'ALL' && d.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.productName.toLowerCase().includes(q) ||
          d.storeName.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
        );
      }
      return true;
    });

    // 3. Multi-factor sorting (Primary: Distance)
    searchFiltered.sort((a, b) => {
      if (sortBy === 'discount') {
        return b.discountPct - a.discountPct;
      } else if (sortBy === 'risk') {
        return (b.wasteRiskPercentage || b.wasteRiskScore) - (a.wasteRiskPercentage || a.wasteRiskScore);
      } else {
        // Distance default
        return (a.distanceMeters || 0) - (b.distanceMeters || 0);
      }
    });

    return { filteredDeals: searchFiltered, categoryCounts: counts };
  }, [deals, userLocation, maxRadiusKm, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar currentLocation={userLocation} onLocationChange={(loc) => setUserLocation(loc)} />

      {/* Hero Banner with ResQFood 10 KM Proximity Context */}
      <section className="bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white py-9 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        
        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ResQFood • 10 KM Nearby Food Surplus Network</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Rescue Fresh Surplus Food <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                  Within 10 KM Before Expiry.
                </span>
              </h1>
              <p className="text-zinc-300 text-xs sm:text-sm max-w-2xl mt-2 leading-relaxed">
                Connect directly with neighborhood bakeries, cafes, and food outlets. Discover date-tracked surplus items, claim live deals, and navigate with Google Maps.
              </p>
            </div>

            {/* GPS & Distance Radius Controller */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-200">
                  <Footprints className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">Search Radius (Max 10 KM):</span>
                </div>
                <span className="font-mono font-bold bg-emerald-500/30 px-2 py-0.5 rounded text-white">
                  {maxRadiusKm} km
                </span>
              </div>

              <div className="flex items-center gap-2">
                {[1, 3, 5, 10].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMaxRadiusKm(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      maxRadiusKm === r
                        ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
                
                <button
                  onClick={handleGetBrowserLocation}
                  disabled={isLocating}
                  className="px-3 py-1 rounded-lg bg-teal-400 hover:bg-teal-300 text-zinc-950 text-xs font-bold flex items-center gap-1 transition-colors"
                  title="Fetch current GPS location"
                >
                  <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'GPS...' : 'My GPS'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        
        {/* Search, Filter & View Mode Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fresh sandwiches, sourdough, milk, paneer, pastries..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-zinc-900 placeholder:text-zinc-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs bg-zinc-100 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Switcher & Sorter */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Sort selector */}
              <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-zinc-200 text-xs text-zinc-700">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-semibold text-zinc-500">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="font-bold outline-none bg-transparent text-zinc-900 cursor-pointer"
                >
                  <option value="distance">📍 Distance (Closest)</option>
                  <option value="discount">🔥 Highest Discount</option>
                  <option value="risk">🔴 Waste Urgency</option>
                </select>
              </div>

              {/* View toggle */}
              <div className="flex bg-zinc-200/80 p-1 rounded-xl border border-zinc-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>

                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'map'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>10 KM Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={categoryCounts}
          />
        </div>

        {/* View Mode 1: Interactive 10 KM Google Maps Platform View */}
        {viewMode === 'map' ? (
          <DealsMap
            deals={filteredDeals}
            userLocation={userLocation}
            maxRadiusKm={maxRadiusKm}
            onSelectDeal={(d) => setSelectedDeal(d)}
          />
        ) : (
          /* View Mode 2: Canonical Deals Grid */
          filteredDeals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onOpenDetails={(d) => setSelectedDeal(d)}
                  onClaim={(d) => setSelectedDeal(d)}
                />
              ))}
            </div>
          ) : (
            /* Empty State / Out of Radius Notice */
            <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-zinc-200 shadow-sm max-w-lg mx-auto space-y-4 my-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
                🌿
              </div>
              <h3 className="text-xl font-bold text-zinc-900">No Active Deals in {maxRadiusKm} KM Radius</h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                No surplus food listings found within {maxRadiusKm} km of <em>{userLocation.name}</em>.
                ResQFood strictly enforces the 10 km maximum proximity radius.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  onClick={() => setMaxRadiusKm(10)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Expand to 10 KM Limit
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                    setUserLocation(POPULAR_LOCATIONS[0]);
                  }}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all"
                >
                  Reset Location (Pune Central)
                </button>
              </div>
            </div>
          )
        )}

        {/* Bottom Educational / Transparency Notice */}
        <section className="bg-white rounded-2xl p-5 border border-zinc-200/80 text-xs text-zinc-600 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-zinc-800 text-sm">ResQFood Workflow</p>
              <p className="text-zinc-500 text-xs">
                1. Add Product ➔ 2. Manufacturing &amp; Expiry Date ➔ 3. Waste Risk ➔ 4. Smart Price ➔ 5. 10 KM Map ➔ 6. Claim Deal ➔ 7. Food Rescued.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold bg-zinc-100 px-3 py-1.5 rounded-lg text-zinc-700 whitespace-nowrap">
            Max 10 KM • Zero Commission
          </span>
        </section>
      </main>

      {/* Deal Details & Claim Modal */}
      {selectedDeal && (
        <DealModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onClaimSuccess={refreshDeals}
        />
      )}
    </div>
  );
}
