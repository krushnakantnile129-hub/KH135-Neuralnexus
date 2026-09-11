"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Store as StoreIcon, 
  ShoppingBag, 
  PlusCircle, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { POPULAR_LOCATIONS } from '@/lib/geo';
import { resetDemoState } from '@/lib/store';

export function Navbar({ 
  currentLocation, 
  onLocationChange 
}: { 
  currentLocation?: { name: string; lat: number; lng: number }; 
  onLocationChange?: (loc: { name: string; lat: number; lng: number }) => void;
}) {
  const pathname = usePathname();
  const [showLocModal, setShowLocModal] = useState(false);
  const [customLat, setCustomLat] = useState('18.5204');
  const [customLng, setCustomLng] = useState('73.8567');
  const [activeLoc, setActiveLoc] = useState(currentLocation || POPULAR_LOCATIONS[0]);

  useEffect(() => {
    if (currentLocation) {
      setActiveLoc(currentLocation);
      setCustomLat(currentLocation.lat.toString());
      setCustomLng(currentLocation.lng.toString());
    }
  }, [currentLocation]);

  const handleSelectPreset = (loc: { name: string; lat: number; lng: number }) => {
    setActiveLoc(loc);
    setCustomLat(loc.lat.toString());
    setCustomLng(loc.lng.toString());
    if (onLocationChange) onLocationChange(loc);
    setShowLocModal(false);
  };

  const handleApplyCustom = () => {
    const lat = parseFloat(customLat) || 18.5204;
    const lng = parseFloat(customLng) || 73.8567;
    const loc = { name: `Custom (${lat.toFixed(4)}, ${lng.toFixed(4)})`, lat, lng };
    setActiveLoc(loc);
    if (onLocationChange) onLocationChange(loc);
    setShowLocModal(false);
  };

  const handleResetData = () => {
    if (confirm('Reset all demo surplus data to default seed listings?')) {
      resetDemoState();
      window.location.reload();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 bg-white/95 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <span className="text-xl">🌿</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xl tracking-tight text-zinc-900">SAVE-BITE</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">Zero-Checkout</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium leading-none hidden sm:block">Hyper-Local Surplus Food Marketplace</p>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-zinc-200">
                <Link
                  href="/"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/' 
                      ? 'bg-emerald-50 text-emerald-800 font-semibold' 
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  Consumer Deals Feed
                </Link>
                <Link
                  href="/merchant"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/merchant') && pathname !== '/merchant/add-deal'
                      ? 'bg-emerald-50 text-emerald-800 font-semibold' 
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <StoreIcon className="w-4 h-4 text-emerald-600" />
                  Merchant Control Center
                </Link>
                <Link
                  href="/merchant/add-deal"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/merchant/add-deal'
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Surplus (+60 FPS Slider)
                </Link>
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/admin'
                      ? 'bg-zinc-800 text-white font-semibold' 
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-zinc-400" />
                  Admin / RBAC
                </Link>
              </nav>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Location Pill */}
              <button
                onClick={() => setShowLocModal(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-all"
                title="Change your GPS Coordinates / Proximity Area"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span className="max-w-[130px] sm:max-w-[180px] truncate">{activeLoc.name}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>

              {/* Reset Seed Button */}
              <button
                onClick={handleResetData}
                className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
                title="Reset Seed Demo Data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation Row */}
          <div className="flex md:hidden items-center justify-around py-2 border-t border-zinc-100 text-xs font-medium overflow-x-auto gap-1">
            <Link
              href="/"
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
                pathname === '/' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-zinc-600'
              }`}
            >
              🛍️ Deals
            </Link>
            <Link
              href="/merchant"
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
                pathname.startsWith('/merchant') && pathname !== '/merchant/add-deal' 
                  ? 'bg-emerald-100 text-emerald-900 font-bold' 
                  : 'text-zinc-600'
              }`}
            >
              🏪 Merchant Hub
            </Link>
            <Link
              href="/merchant/add-deal"
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
                pathname === '/merchant/add-deal' ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              ✨ Add Surplus
            </Link>
            <Link
              href="/admin"
              className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
                pathname === '/admin' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-600'
              }`}
            >
              🛡️ Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Location Modal */}
      {showLocModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-zinc-900 text-base">Select GPS Proximity Location</h3>
              </div>
              <button 
                onClick={() => setShowLocModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-zinc-600">
                SAVE-BITE dynamically indexes and ranks deals using the <strong>Haversine Distance Equation</strong> strictly within a 5 km radial threshold of your coordinates.
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Quick Preset Geocodes:</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {POPULAR_LOCATIONS.map((loc, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectPreset(loc)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all ${
                        activeLoc.lat === loc.lat && activeLoc.lng === loc.lng
                          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-semibold'
                          : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800'
                      }`}
                    >
                      <span>{loc.name}</span>
                      <span className="text-[11px] text-zinc-500 font-mono">{loc.lat}, {loc.lng}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100">
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Manual Lat/Lng Input (Zero-GPS Fallback):</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-medium">Latitude:</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="18.5204"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-medium">Longitude:</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="73.8567"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowLocModal(false)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyCustom}
                    className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                  >
                    Apply Coordinates
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
