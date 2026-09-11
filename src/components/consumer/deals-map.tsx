"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Deal } from '@/shared/types';
import { formatINR, formatDisplayDate } from '@/lib/utils';
import { formatDistance, getGoogleMapsUrl } from '@/lib/geo';
import { getDealUrgency, findBestDealNearMe } from '@/lib/recommendation';
import { 
  MapPin, 
  Navigation, 
  Store as StoreIcon, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  Compass, 
  Flame, 
  AlertTriangle,
  Zap,
  Info
} from 'lucide-react';

interface Props {
  deals: Deal[];
  userLocation: { name: string; lat: number; lng: number };
  maxRadiusKm: number;
  onSelectDeal: (deal: Deal) => void;
}

export function DealsMap({ deals, userLocation, maxRadiusKm, onSelectDeal }: Props) {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  // Group deals by store and evaluate worst-case urgency for each store
  const storeMap: Record<
    string,
    {
      storeName: string;
      storeAddress: string;
      lat: number;
      lng: number;
      deals: Deal[];
      minDistance?: number;
      highestUrgency: 'CRITICAL' | 'URGENT' | 'SAFE';
    }
  > = {};

  deals.forEach((d) => {
    if (!storeMap[d.storeId]) {
      storeMap[d.storeId] = {
        storeName: d.storeName,
        storeAddress: d.storeAddress,
        lat: d.latitude,
        lng: d.longitude,
        deals: [],
        minDistance: d.distanceMeters,
        highestUrgency: 'SAFE',
      };
    }
    storeMap[d.storeId].deals.push(d);

    if (
      d.distanceMeters !== undefined &&
      (storeMap[d.storeId].minDistance === undefined || d.distanceMeters < storeMap[d.storeId].minDistance!)
    ) {
      storeMap[d.storeId].minDistance = d.distanceMeters;
    }

    const urgency = getDealUrgency(d);
    if (urgency.level === 'CRITICAL') {
      storeMap[d.storeId].highestUrgency = 'CRITICAL';
    } else if (urgency.level === 'URGENT' && storeMap[d.storeId].highestUrgency !== 'CRITICAL') {
      storeMap[d.storeId].highestUrgency = 'URGENT';
    }
  });

  const stores = Object.entries(storeMap);

  // Best deal recommendation
  const bestDealRec = useMemo(() => {
    return findBestDealNearMe(deals, userLocation.lat, userLocation.lng);
  }, [deals, userLocation]);

  // Default selected store to first if none selected
  useEffect(() => {
    if (!selectedShopId && stores.length > 0) {
      setSelectedShopId(stores[0][0]);
    }
  }, [stores.length]);

  const activeStoreEntry = selectedShopId ? storeMap[selectedShopId] : null;

  return (
    <div className="space-y-3">
      {/* Smart Rescue Map Header Tagline */}
      <div className="bg-gradient-to-r from-zinc-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-4 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-xl shrink-0">
            🗺️
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-emerald-300">
              Smart Rescue Map &amp; 10 KM Rescue Zone
            </h3>
            <p className="text-xs text-zinc-300 italic">
              &ldquo;Our map doesn&apos;t just show where food is. It shows where food needs to be rescued.&rdquo;
            </p>
          </div>
        </div>

        {bestDealRec && (
          <button
            onClick={() => onSelectDeal(bestDealRec.deal)}
            className="w-full md:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-zinc-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-current text-zinc-950" />
            <span>✨ Best Deal Near Me (Score {bestDealRec.score}/100)</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden flex flex-col lg:flex-row h-[620px]">
        {/* Interactive Map Visual Panel */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center select-none">
          {/* Map Grid and Radar Rings */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-15" />
          
          {/* Visible 10 KM Rescue Zone boundary circle */}
          <div className="absolute w-[470px] h-[470px] rounded-full border-2 border-dashed border-emerald-400/35 animate-[spin_120s_linear_infinite]" />
          <div className="absolute w-[340px] h-[340px] rounded-full border border-teal-500/25" />
          <div className="absolute w-[200px] h-[200px] rounded-full border border-emerald-400/35" />

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
          <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur border border-white/20 text-white text-xs px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Strict 10 KM Rescue Boundary: <strong>Max {maxRadiusKm} KM Active</strong></span>
          </div>

          {/* Urgency Color-Coded Shop Markers */}
          {stores.map(([storeId, store], idx) => {
            // Calculate polar visual offsets for simulated geo projection
            const angle = (idx / Math.max(stores.length, 1)) * 2 * Math.PI - Math.PI / 2;
            const distNormalized = Math.min(185, Math.max(65, ((store.minDistance || 1200) / 10000) * 190 + 50));
            const offsetX = Math.cos(angle) * distNormalized;
            const offsetY = Math.sin(angle) * distNormalized;
            const isSelected = selectedShopId === storeId;

            // Marker styling based on urgency level: 🔴 Critical, 🟠 Urgent, 🟢 Safe
            let markerBg = 'bg-emerald-600 border-emerald-300 text-white';
            let pinDot = '🟢';
            let pulseClass = '';

            if (store.highestUrgency === 'CRITICAL') {
              markerBg = 'bg-rose-600 border-rose-300 text-white';
              pinDot = '🔴';
              pulseClass = 'animate-bounce';
            } else if (store.highestUrgency === 'URGENT') {
              markerBg = 'bg-amber-500 border-amber-200 text-zinc-950 font-black';
              pinDot = '🟠';
            }

            if (isSelected) {
              markerBg = 'bg-white text-zinc-950 border-emerald-400 shadow-2xl scale-110';
            }

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
                  <div className={`px-2.5 py-1 rounded-xl shadow-2xl flex items-center gap-1.5 border transition-all ${markerBg} ${pulseClass}`}>
                    <span className="text-xs">{pinDot}</span>
                    <span className="text-xs font-black truncate max-w-[110px]">{store.storeName.split(' ')[0]}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-black/20 font-mono">
                      {store.deals.length}
                    </span>
                  </div>

                  {/* Distance subtitle pill */}
                  <div className="text-[9px] font-mono font-semibold text-emerald-300 mt-0.5 bg-black/90 px-1.5 py-0.2 rounded-md border border-white/10">
                    {store.minDistance ? formatDistance(store.minDistance) : 'Nearby'}
                  </div>

                  {/* Pin pointer needle */}
                  <div className={`w-2 h-2 rotate-45 -mt-1 ${isSelected ? 'bg-white' : store.highestUrgency === 'CRITICAL' ? 'bg-rose-600' : store.highestUrgency === 'URGENT' ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                </div>
              </div>
            );
          })}

          {/* Smart Urgency Legend */}
          <div className="absolute bottom-4 left-4 z-20 bg-slate-950/90 backdrop-blur border border-white/10 text-white text-[11px] p-3 rounded-2xl space-y-1.5 shadow-xl">
            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Urgency Status</div>
            <div className="flex items-center gap-2 text-zinc-200">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>🔴 <strong>Critical</strong> (&lt; 2h or &lt; 10% life left)</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>🟠 <strong>Urgent</strong> (2–6h or 10–25% life left)</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>🟢 <strong>Safe</strong> (&gt; 6h or &gt; 25% life left)</span>
            </div>
          </div>
        </div>

        {/* Selected Shop & Available Deals Sidebar */}
        <div className="w-full lg:w-96 bg-zinc-50 border-t lg:border-t-0 lg:border-l border-zinc-200 flex flex-col h-[340px] lg:h-full overflow-hidden">
          {activeStoreEntry ? (
            <div className="flex flex-col h-full">
              {/* Store Header */}
              <div className="p-4 bg-white border-b border-zinc-200">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Verified Store • Max 10 KM
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

                {/* Google Maps Direction Button */}
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
                  <span>Surplus Deals ({activeStoreEntry.deals.length})</span>
                  <span>Direct Counter Purchase</span>
                </div>

                {activeStoreEntry.deals.map((deal) => {
                  const discountPct = Math.round(((deal.originalPrice - deal.publishedPrice) / deal.originalPrice) * 100);
                  const expiryText = deal.expiryCountdownFormatted || (deal.expiryDateFormatted || formatDisplayDate(deal.deadline));
                  const urgency = getDealUrgency(deal);

                  return (
                    <div
                      key={deal.id}
                      onClick={() => onSelectDeal(deal)}
                      className="p-3 bg-white rounded-2xl border border-zinc-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full border ${urgency.badgeBg} ${urgency.badgeText} ${urgency.badgeBorder}`}>
                              {urgency.icon} {urgency.label}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                            {deal.productName}
                          </h4>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>⏳ {expiryText}</span>
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full shrink-0">
                          🔥 {discountPct}% OFF
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                        <span className="text-xs font-bold text-emerald-700">
                          📍 {activeStoreEntry.minDistance ? formatDistance(activeStoreEntry.minDistance) : '1.4 km'}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDeal(deal);
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-600 group-hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <span>View Deal ➔</span>
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
    </div>
  );
}

