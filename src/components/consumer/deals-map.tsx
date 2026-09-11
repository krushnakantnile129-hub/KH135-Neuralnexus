"use client";

import React, { useState, useEffect } from 'react';
import { Deal } from '@/shared/types';
import { formatINR, formatDisplayDate } from '@/lib/utils';
import { formatDistance, getGoogleMapsUrl } from '@/lib/geo';
import { MapPin, Navigation, Store as StoreIcon, Clock, Sparkles, ExternalLink, Compass, ShieldCheck } from 'lucide-react';

interface Props {
  deals: Deal[];
  userLocation: { name: string; lat: number; lng: number };
  maxRadiusKm: number;
  onSelectDeal: (deal: Deal) => void;
}

export function DealsMap({ deals, userLocation, maxRadiusKm, onSelectDeal }: Props) {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  // Group deals by store
  const storeMap: Record<string, { storeName: string; storeAddress: string; lat: number; lng: number; deals: Deal[]; minDistance?: number }> = {};

  deals.forEach((d) => {
    if (!storeMap[d.storeId]) {
      storeMap[d.storeId] = {
        storeName: d.storeName,
        storeAddress: d.storeAddress,
        lat: d.latitude,
        lng: d.longitude,
        deals: [],
        minDistance: d.distanceMeters,
      };
    }
    storeMap[d.storeId].deals.push(d);
    if (d.distanceMeters !== undefined && (storeMap[d.storeId].minDistance === undefined || d.distanceMeters < storeMap[d.storeId].minDistance!)) {
      storeMap[d.storeId].minDistance = d.distanceMeters;
    }
  });

  const stores = Object.entries(storeMap);

  // Default selected store to first if none selected
  useEffect(() => {
    if (!selectedShopId && stores.length > 0) {
      setSelectedShopId(stores[0][0]);
    }
  }, [stores.length]);

  const activeStoreEntry = selectedShopId ? storeMap[selectedShopId] : null;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden flex flex-col lg:flex-row h-[620px]">
      {/* Interactive Map Visual Panel */}
      <div className="relative flex-1 bg-slate-900 overflow-hidden flex items-center justify-center select-none">
        {/* Map Grid and Pulse Styling */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-15" />
        
        {/* Concentric 10km search radius rings */}
        <div className="absolute w-[460px] h-[460px] rounded-full border border-emerald-500/25 animate-pulse" />
        <div className="absolute w-[320px] h-[320px] rounded-full border border-teal-500/30" />
        <div className="absolute w-[180px] h-[180px] rounded-full border border-emerald-400/40" />

        {/* User Location Center Marker */}
        <div className="relative z-20 flex flex-col items-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-8 h-8 rounded-full bg-sky-500/40 animate-ping" />
            <div className="w-5 h-5 rounded-full bg-sky-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
              ●
            </div>
          </div>
          <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-sky-950/90 border border-sky-400/40 text-sky-200 text-[10px] font-bold backdrop-blur">
            You ({userLocation.name.split('(')[0].trim()})
          </div>
        </div>

        {/* 10km Search Range Label */}
        <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur border border-white/20 text-white text-xs px-3 py-1.5 rounded-xl flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Google Maps Discovery: <strong>Max {maxRadiusKm} KM Radius</strong></span>
        </div>

        {/* Render Nearby Shop Markers around center */}
        {stores.map(([storeId, store], idx) => {
          // Calculate polar visual offsets for simulated geo projection
          const angle = (idx / Math.max(stores.length, 1)) * 2 * Math.PI - Math.PI / 2;
          const distNormalized = Math.min(180, Math.max(65, ((store.minDistance || 1200) / 10000) * 190 + 50));
          const offsetX = Math.cos(angle) * distNormalized;
          const offsetY = Math.sin(angle) * distNormalized;
          const isSelected = selectedShopId === storeId;

          return (
            <div
              key={storeId}
              style={{
                transform: `translate(${offsetX}px, ${offsetY}px)`,
              }}
              onClick={() => setSelectedShopId(storeId)}
              className={`absolute z-30 cursor-pointer group transition-all duration-300 ${
                isSelected ? 'scale-110 z-40' : 'hover:scale-105'
              }`}
            >
              <div className="relative flex flex-col items-center">
                {/* Marker Pin */}
                <div className={`px-2.5 py-1 rounded-xl shadow-xl flex items-center gap-1.5 border transition-all ${
                  isSelected 
                    ? 'bg-emerald-500 text-slate-950 font-black border-white shadow-emerald-500/50 scale-105' 
                    : 'bg-slate-900/90 text-white font-bold border-emerald-500/50 hover:border-emerald-400'
                }`}>
                  <span className="text-sm">🏪</span>
                  <span className="text-xs truncate max-w-[110px]">{store.storeName.split(' ')[0]}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-white/20">
                    {store.deals.length}
                  </span>
                </div>

                {/* Distance subtitle pill */}
                <div className="text-[9px] font-mono font-semibold text-emerald-300 mt-0.5 bg-black/80 px-1.5 py-0.2 rounded-md border border-white/10">
                  {store.minDistance ? formatDistance(store.minDistance) : 'Nearby'}
                </div>

                {/* Pin pointer needle */}
                <div className={`w-2 h-2 rotate-45 -mt-1 ${isSelected ? 'bg-emerald-500' : 'bg-slate-900'}`} />
              </div>
            </div>
          );
        })}

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-950/80 backdrop-blur border border-white/10 text-white text-[11px] p-2.5 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Your GPS Location</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Participating ResQFood Outlets</span>
          </div>
        </div>
      </div>

      {/* Selected Shop & Available Deals Sidebar */}
      <div className="w-full lg:w-96 bg-zinc-50 border-t lg:border-t-0 lg:border-l border-zinc-200 flex flex-col h-[320px] lg:h-full overflow-hidden">
        {activeStoreEntry ? (
          <div className="flex flex-col h-full">
            {/* Store Header */}
            <div className="p-4 bg-white border-b border-zinc-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Open Now • Verified Store
                  </span>
                  <h3 className="font-extrabold text-zinc-900 text-base mt-1 line-clamp-1">
                    {activeStoreEntry.storeName}
                  </h3>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{activeStoreEntry.storeAddress}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg block">
                    📍 {activeStoreEntry.minDistance ? formatDistance(activeStoreEntry.minDistance) : '1.2 km'}
                  </span>
                </div>
              </div>

              {/* Navigation button */}
              <a
                href={getGoogleMapsUrl(activeStoreEntry.lat, activeStoreEntry.lng, activeStoreEntry.storeName)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Navigation className="w-3.5 h-3.5 fill-current" />
                <span>Get Directions (Google Maps)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>

            {/* List of active deals in this store */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold px-1">
                <span>Available Surplus Food ({activeStoreEntry.deals.length})</span>
                <span>Max 10km Filter</span>
              </div>

              {activeStoreEntry.deals.map((deal) => {
                const discountPct = Math.round(((deal.originalPrice - deal.publishedPrice) / deal.originalPrice) * 100);
                const expiryText = deal.expiryDateFormatted || formatDisplayDate(deal.deadline);

                return (
                  <div
                    key={deal.id}
                    onClick={() => onSelectDeal(deal)}
                    className="p-3 bg-white rounded-2xl border border-zinc-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {deal.productName}
                        </h4>
                        <span className="text-[10px] text-zinc-500">
                          📦 {deal.remainingUnits} {deal.unit || 'left'} • 📅 Expires: {expiryText}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full shrink-0">
                        {discountPct}% OFF
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-black text-zinc-900">
                          {formatINR(deal.publishedPrice)}
                        </span>
                        <span className="text-xs text-zinc-400 line-through">
                          {formatINR(deal.originalPrice)}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDeal(deal);
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-600 group-hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                      >
                        Claim Deal ➔
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
            <StoreIcon className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">Click on any shop marker on the map to view available discounted surplus food.</p>
          </div>
        )}
      </div>
    </div>
  );
}
