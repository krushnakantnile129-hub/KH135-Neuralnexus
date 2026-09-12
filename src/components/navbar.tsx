"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Store as StoreIcon, 
  ShoppingBag, 
  PlusCircle, 
  MapPin, 
  ShieldCheck, 
  ChevronDown,
  User as UserIcon,
  LogOut,
  LogIn,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { POPULAR_LOCATIONS } from '@/lib/geo';
import { subscribeAuth, logoutUser } from '@/lib/auth-store';
import { User, UserRole } from '@/shared/types';
import { AuthModal } from '@/components/auth/auth-modal';
import { AddSurplusModal } from '@/components/merchant/add-surplus-modal';

export function Navbar({ 
  currentLocation, 
  onLocationChange 
}: { 
  currentLocation?: { name: string; lat: number; lng: number }; 
  onLocationChange?: (loc: { name: string; lat: number; lng: number }) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modals state
  const [showLocModal, setShowLocModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddSurplusModal, setShowAddSurplusModal] = useState(false);
  const [authRolePreset, setAuthRolePreset] = useState<UserRole>('CONSUMER');
  const [authPromptMsg, setAuthPromptMsg] = useState<string | undefined>();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Location state
  const [customLat, setCustomLat] = useState('18.5204');
  const [customLng, setCustomLng] = useState('73.8567');
  const [activeLoc, setActiveLoc] = useState(currentLocation || POPULAR_LOCATIONS[0]);

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = subscribeAuth((u) => {
      setCurrentUser(u);
    });
    return () => unsubscribe();
  }, []);

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

  const triggerAuthForRole = (role: UserRole, prompt?: string) => {
    setAuthRolePreset(role);
    setAuthPromptMsg(prompt);
    setShowAuthModal(true);
  };

  // Determine active view roles for Navigation Bar Isolation
  const isConsumerView = !currentUser || currentUser.role === 'CONSUMER';
  const isShopkeeperView = currentUser?.role === 'SHOPKEEPER';
  const isAdminView = currentUser?.role === 'ADMIN';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 bg-white/95 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href={isShopkeeperView ? "/merchant" : isAdminView ? "/admin" : "/"} className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <span className="text-xl">🌿</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xl tracking-tight text-zinc-900">SAVE-BITE</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {isShopkeeperView ? 'Merchant Portal' : isAdminView ? 'Admin Console' : 'Zero-Checkout'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium leading-none hidden sm:block">
                    {isShopkeeperView ? 'Store Surplus Clearance Engine' : isAdminView ? 'Platform Governance & RBAC' : 'Hyper-Local Surplus Food Marketplace'}
                  </p>
                </div>
              </Link>

              {/* Navigation Links (STRICT ROLE ISOLATION) */}
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-zinc-200">
                {/* 1. CONSUMER / GUEST NAVIGATION */}
                {isConsumerView && (
                  <Link
                    href="/"
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      pathname === '/' 
                        ? 'bg-emerald-50 text-emerald-800 font-semibold' 
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    Consumer Deals Feed
                  </Link>
                )}

                {/* 2. SHOPKEEPER NAVIGATION */}
                {isShopkeeperView && (
                  <>
                    <Link
                      href="/merchant"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        pathname.startsWith('/merchant')
                          ? 'bg-blue-50 text-blue-900 font-bold' 
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      }`}
                    >
                      <StoreIcon className="w-4 h-4 text-blue-600" />
                      Merchant Hub
                    </Link>

                    <button
                      type="button"
                      onClick={() => setShowAddSurplusModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-white" />
                      + Add Surplus
                    </button>
                  </>
                )}

                {/* 3. ADMIN NAVIGATION */}
                {isAdminView && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                      pathname === '/admin'
                        ? 'bg-zinc-900 text-white shadow-sm' 
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Platform Admin Console
                  </Link>
                )}
              </nav>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Location Pill (Consumer Mode) */}
              {isConsumerView && (
                <button
                  onClick={() => setShowLocModal(true)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-all"
                  title="Change your GPS Coordinates / Proximity Area"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span className="max-w-[110px] sm:max-w-[150px] truncate">{activeLoc.name}</span>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </button>
              )}

              {/* User Authentication Badge / Dropdown */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-all"
                  >
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden shrink-0">
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        currentUser.name.charAt(0)
                      )}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-bold text-zinc-900 leading-none truncate max-w-[120px]">{currentUser.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded ${
                          currentUser.role === 'SHOPKEEPER' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                          currentUser.role === 'ADMIN' ? 'bg-zinc-900 text-white' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {currentUser.role === 'SHOPKEEPER' ? 'Verified Merchant' : currentUser.role}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-zinc-200 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2 border-b border-zinc-100">
                        <p className="text-xs font-bold text-zinc-900">{currentUser.name}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{currentUser.email}</p>
                        
                        {/* Verified Merchant Badge */}
                        {currentUser.role === 'SHOPKEEPER' && (
                          <div className="mt-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                            <FileCheck className="w-3 h-3 text-blue-600" />
                            <span>FSSAI License &amp; MH Verified</span>
                          </div>
                        )}
                        {currentUser.role === 'ADMIN' && (
                          <div className="mt-1 text-[10px] font-bold text-emerald-400 bg-zinc-900 px-2 py-0.5 rounded flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Platform Admin</span>
                          </div>
                        )}
                      </div>

                      <div className="py-1">
                        <Link
                          href={currentUser.role === 'ADMIN' ? "/admin" : "/profile"}
                          onClick={() => setShowUserDropdown(false)}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 flex items-center gap-2"
                        >
                          <UserIcon className="w-4 h-4 text-emerald-600" />
                          {currentUser.role === 'SHOPKEEPER' ? 'Manage Business Profile & Products' : currentUser.role === 'ADMIN' ? 'Admin Console' : 'My Account Profile'}
                        </Link>
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            triggerAuthForRole(currentUser.role, 'Switch profile or role');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <UserIcon className="w-4 h-4 text-zinc-400" />
                          Switch Account / Profile
                        </button>
                      </div>

                      <div className="border-t border-zinc-100 pt-1">
                        <button
                          onClick={() => {
                            logoutUser();
                            setShowUserDropdown(false);
                            router.push('/');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => triggerAuthForRole('CONSUMER')}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation Row (ROLE ISOLATED) */}
          <div className="flex md:hidden items-center justify-around py-2 border-t border-zinc-100 text-xs font-medium overflow-x-auto gap-1">
            {isConsumerView && (
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-md whitespace-nowrap font-bold ${
                  pathname === '/' ? 'bg-emerald-100 text-emerald-900' : 'text-zinc-600'
                }`}
              >
                🛍️ Deals Feed
              </Link>
            )}

            {isShopkeeperView && (
              <>
                <Link
                  href="/merchant"
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap font-bold ${
                    pathname.startsWith('/merchant')
                      ? 'bg-blue-100 text-blue-900' 
                      : 'text-zinc-600'
                  }`}
                >
                  🏪 Merchant Hub
                </Link>
                <button
                  type="button"
                  onClick={() => setShowAddSurplusModal(true)}
                  className="px-3 py-1.5 rounded-md whitespace-nowrap font-bold bg-emerald-600 text-white shadow-sm"
                >
                  ✨ + Add Surplus
                </button>
              </>
            )}

            {isAdminView && (
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-md whitespace-nowrap font-bold ${
                  pathname === '/admin' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
                }`}
              >
                🛡️ Platform Admin
              </Link>
            )}
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

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialRole={authRolePreset}
        customPrompt={authPromptMsg}
      />

      {/* Global Add Surplus Modal */}
      <AddSurplusModal
        isOpen={showAddSurplusModal}
        onClose={() => setShowAddSurplusModal(false)}
      />
    </>
  );
}
