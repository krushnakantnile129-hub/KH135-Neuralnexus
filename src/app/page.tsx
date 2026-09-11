"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/navbar';
import { CategoryFilter } from '@/components/consumer/category-filter';
import { DealCard } from '@/components/consumer/deal-card';
import { DealModal } from '@/components/consumer/deal-modal';
import { Deal } from '@/shared/types';
import { loadDeals } from '@/lib/store';
import { calculateHaversineDistance, POPULAR_LOCATIONS } from '@/lib/geo';
import { 
  Sparkles, 
  Search, 
  MapPin, 
  ShieldCheck, 
  Footprints,
  Compass
} from 'lucide-react';

export default function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [userLocation, setUserLocation] = useState(POPULAR_LOCATIONS[0]);
  const [maxRadiusKm, setMaxRadiusKm] = useState(5.0);
  const [isLocating, setIsLocating] = useState(false);

  // Load and subscribe to deals
  useEffect(() => {
    setDeals(loadDeals());

    const interval = setInterval(() => {
      setDeals(loadDeals());
    }, 10000);
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
          name: 'My Current Location (Live GPS)',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert('Location permission denied or unavailable. Falling back to default commercial district.');
      },
      { timeout: 8000 }
    );
  };

  const { filteredDeals, categoryCounts } = useMemo(() => {
    const now = Date.now();
    const counts: Record<string, number> = {};

    const listWithDist = deals
      .filter((d) => {
        const isNotExpired = new Date(d.deadline).getTime() > now;
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
      .sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));

    const maxMeters = maxRadiusKm * 1000;
    const filtered = listWithDist.filter((d) => {
      if ((d.distanceMeters || 0) > maxMeters) return false;
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

    return { filteredDeals: filtered, categoryCounts: counts };
  }, [deals, userLocation, maxRadiusKm, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar currentLocation={userLocation} onLocationChange={(loc) => setUserLocation(loc)} />

      {/* Hero Banner with Proximity Context */}
      <section className="bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white py-10 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        
        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero-Checkout Hyper-Local Surplus Discovery</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Rescue Fresh Surplus Food <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                  At 30% to 50% Off Nearby.
                </span>
              </h1>
              <p className="text-zinc-300 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
                Local bakeries, cafés, and restaurants price end-of-day batches for immediate walk-in counter redemption. No app fees, no middleman cart, no delivery wait.
              </p>
            </div>

            {/* GPS & Distance Radius Controller */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-200">
                  <Footprints className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">Proximity Radius:</span>
                </div>
                <span className="font-mono font-bold bg-emerald-500/30 px-2 py-0.5 rounded text-white">
                  {maxRadiusKm} km radius
                </span>
              </div>

              <div className="flex items-center gap-2">
                {[1, 2, 5, 10].map((r) => (
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
                  title="Fetch current browser GPS coordinates"
                >
                  <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'GPS...' : 'Use My GPS'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Search & Category Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sourdough, pizza slices, bakeries, cafes..."
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

            {/* Active Proximity Summary */}
            <div className="text-xs text-zinc-500 flex items-center gap-2 self-end sm:self-auto">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Center: <strong>{userLocation.name}</strong></span>
              <span>•</span>
              <span className="font-bold text-emerald-700">{filteredDeals.length} active deals</span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={categoryCounts}
          />
        </div>

        {/* Deals Grid */}
        {filteredDeals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onOpenDetails={(d) => setSelectedDeal(d)}
              />
            ))}
          </div>
        ) : (
          /* Empty State / Out of Radius Fallback (SRS EC-06) */
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-zinc-200 shadow-sm max-w-lg mx-auto space-y-4 my-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🌿
            </div>
            <h3 className="text-xl font-bold text-zinc-900">No Surplus Rescues in {maxRadiusKm} km Radius</h3>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              No registered surplus inventory currently active within {maxRadiusKm} km of <em>{userLocation.name}</em>.
              Try increasing your radius slider or recommend <strong>SAVE-BITE</strong> to your local neighborhood bakeries!
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                onClick={() => setMaxRadiusKm(10)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Expand to 10 km
              </button>
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                  setUserLocation(POPULAR_LOCATIONS[0]);
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all"
              >
                Reset to Pune Central (PRD Base)
              </button>
            </div>
          </div>
        )}

        {/* Bottom Educational / Transparency Notice */}
        <section className="bg-white rounded-2xl p-5 border border-zinc-200/80 text-xs text-zinc-600 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-zinc-800 text-sm">How SAVE-BITE Works</p>
              <p className="text-zinc-500 text-xs">1. Discover Deal ➔ 2. Check Distance &amp; Time ➔ 3. Get Directions ➔ 4. Walk-in &amp; Buy Cash/POS.</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold bg-zinc-100 px-3 py-1.5 rounded-lg text-zinc-700 whitespace-nowrap">
            Zero Cart • Zero Commission
          </span>
        </section>
      </main>

      {/* Deal Details Modal */}
      {selectedDeal && (
        <DealModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
        />
      )}
    </div>
  );
}
