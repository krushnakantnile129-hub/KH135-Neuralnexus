"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/navbar';
import { CategoryFilter } from '@/components/consumer/category-filter';
import { DealCard } from '@/components/consumer/deal-card';
import { DealModal } from '@/components/consumer/deal-modal';
import { AuthModal } from '@/components/auth/auth-modal';
import { Deal, User } from '@/shared/types';
import { loadDeals } from '@/lib/store';
import { subscribeAuth } from '@/lib/auth-store';
import { calculateHaversineDistance, POPULAR_LOCATIONS } from '@/lib/geo';
import { 
  Sparkles, 
  Search, 
  MapPin, 
  ShieldCheck, 
  Footprints,
  Compass,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [userLocation, setUserLocation] = useState(POPULAR_LOCATIONS[0]);
  const [maxRadiusKm, setMaxRadiusKm] = useState(5.0);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  // Auth state & Product gate modal
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuth((u) => {
      setCurrentUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Load and subscribe to deals
  useEffect(() => {
    const handleUpdate = () => {
      setDeals(loadDeals());
    };
    setDeals(loadDeals());

    if (typeof window !== 'undefined') {
      window.addEventListener('deals-updated', handleUpdate);
    }
    const interval = setInterval(handleUpdate, 3000);
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deals-updated', handleUpdate);
      }
      clearInterval(interval);
    };
  }, []);

  const handleGetBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please select your area manually from the top location dropdown.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        let locName = `Live GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          if (res.ok) {
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.suburb || data.address?.county;
            const road = data.address?.road || data.address?.neighbourhood;
            if (city) {
              locName = road ? `${road}, ${city} (Live GPS)` : `${city} (Live GPS)`;
            }
          }
        } catch (err) {
          // Fallback to lat/lng format
        }

        const newLoc = { name: locName, lat, lng };
        setUserLocation(newLoc);
        setIsLocating(false);
        setLocationSuccess(`Location set to ${locName}`);
        setTimeout(() => setLocationSuccess(null), 4000);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Location permission was denied or unavailable. Please manually select your area from the top location dropdown.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied by your browser. Please allow location access or manually select your area from the top dropdown.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'GPS signal unavailable. Please manually select your location from the top dropdown.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'GPS lookup timed out. Please try again or select your location manually.';
        }
        setLocationError(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleDealClick = (deal: Deal) => {
    if (!currentUser) {
      // Intercept guest action with Auth Modal
      setShowAuthModal(true);
    } else {
      setSelectedDeal(deal);
    }
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

      // Dynamic category matching (e.g. DAIRY, Dairy & Farm, Bakeries, etc.)
      if (selectedCategory !== 'ALL') {
        const selCat = selectedCategory.toLowerCase();
        const dealCat = (d.category || '').toLowerCase();
        const dealStoreCat = (d.storeCategory || '').toLowerCase();

        const isDairy = selCat.includes('dairy') || selCat.includes('farm');
        const isBakery = selCat.includes('baker');
        const isCafe = selCat.includes('cafe') || selCat.includes('café');
        const isRestaurant = selCat.includes('restaurant');
        const isCanteen = selCat.includes('canteen');
        const isGrocery = selCat.includes('grocer');

        const matchesCategory =
          dealCat === selCat ||
          dealStoreCat === selCat ||
          (isDairy && (dealCat.includes('dairy') || dealStoreCat.includes('dairy'))) ||
          (isBakery && (dealCat.includes('baker') || dealStoreCat.includes('baker'))) ||
          (isCafe && (dealCat.includes('cafe') || dealStoreCat.includes('cafe'))) ||
          (isRestaurant && (dealCat.includes('rest') || dealStoreCat.includes('rest'))) ||
          (isCanteen && (dealCat.includes('cant') || dealStoreCat.includes('cant'))) ||
          (isGrocery && (dealCat.includes('groc') || dealStoreCat.includes('groc')));

        if (!matchesCategory) return false;
      }

      // Dynamic search query matching across title, shop, category, description, address
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pName = (d.productName || d.title || '').toLowerCase();
        const sName = (d.storeName || d.shopName || '').toLowerCase();
        const catName = (d.category || d.storeCategory || '').toLowerCase();
        const desc = (d.description || '').toLowerCase();
        const addr = (d.storeAddress || d.locationName || '').toLowerCase();

        return (
          pName.includes(q) ||
          sName.includes(q) ||
          catName.includes(q) ||
          desc.includes(q) ||
          addr.includes(q)
        );
      }
      return true;
    });

    return { filteredDeals: filtered, categoryCounts: counts };
  }, [deals, userLocation, maxRadiusKm, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar currentLocation={userLocation} onLocationChange={(loc) => setUserLocation(loc)} />

      {/* Hero Banner with Background Image & Readability Overlay */}
      <section 
        className="relative py-12 px-4 sm:px-6 overflow-hidden bg-cover bg-center text-white min-h-[340px] flex items-center"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      >
        {/* Dark Gradient Readability Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/85 to-black/75 z-0" />
        
        {/* Subtle dot accent pattern over gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:24px_24px] opacity-15 z-0 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 w-full space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-xs font-semibold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Checkout Hyper-Local Surplus Discovery</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="drop-shadow-md">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Rescue Fresh Surplus Food <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-100">
                  At 30% to 50% Off Nearby.
                </span>
              </h1>
              <p className="text-zinc-200 text-sm sm:text-base max-w-2xl mt-3 leading-relaxed font-medium drop-shadow">
                Local bakeries, cafés, and restaurants price end-of-day batches for immediate walk-in counter redemption. No app fees, no middleman cart, no delivery wait.
              </p>
            </div>

            {/* GPS & Distance Radius Controller */}
            <div className="bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-2xl flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <Footprints className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">Proximity Radius:</span>
                </div>
                <span className="font-mono font-bold bg-emerald-500/40 px-2 py-0.5 rounded text-white border border-emerald-400/30">
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
                        ? 'bg-emerald-500 text-zinc-950 shadow-md font-extrabold'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
                
                <button
                  onClick={handleGetBrowserLocation}
                  disabled={isLocating}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-75"
                  title="Fetch current browser GPS coordinates"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                      <span>Fetching Location...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5" />
                      <span>Use My GPS</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Geolocation Feedback Toasts / Notifications */}
      {locationError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{locationError}</span>
            </div>
            <button
              onClick={() => setLocationError(null)}
              className="text-rose-500 hover:text-rose-700 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {locationSuccess && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{locationSuccess}</span>
            </div>
            <button
              onClick={() => setLocationSuccess(null)}
              className="text-emerald-600 hover:text-emerald-800 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Guest Auth Notice Banner if not logged in */}
        {!currentUser && (
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-sm">Guest Browsing Active</p>
                <p className="text-xs text-emerald-200">You can explore all nearby deals. Click on any item to log in via Gmail &amp; claim walk-in redemptions!</p>
              </div>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-xs shrink-0 shadow-sm transition-colors"
            >
              Sign In / Register Now ➔
            </button>
          </div>
        )}

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
                onOpenDetails={(d) => handleDealClick(d)}
              />
            ))}
          </div>
        ) : (
          /* Empty State / Out of Radius Fallback */
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

      {/* Deal Details Modal (When Authenticated) */}
      {selectedDeal && (
        <DealModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
        />
      )}

      {/* Guest Interception Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialRole="CONSUMER"
        customPrompt="Sign in or register via Gmail to view deal details, live countdowns & turn-by-turn map directions!"
        onSuccess={() => {
          if (selectedDeal) {
            // Already set
          }
        }}
      />
    </div>
  );
}
