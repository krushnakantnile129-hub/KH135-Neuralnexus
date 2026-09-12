"use client";

import React, { useState, useEffect } from 'react';
import { Deal } from '@/shared/types';
import { formatExpiryCountdown } from '@/lib/utils';
import { formatDistance } from '@/lib/geo';
import { MapPin, Clock, Store } from 'lucide-react';

interface Props {
  deal: Deal;
  onOpenDetails: (deal: Deal) => void;
}

export function DealCard({ deal, onOpenDetails }: Props) {
  const [countdown, setCountdown] = useState(
    deal.expiryCountdownFormatted || formatExpiryCountdown(deal.expiryDate || deal.deadline).text
  );

  // Live countdown updated every 10 seconds
  useEffect(() => {
    const updateCountdown = () => {
      const res = formatExpiryCountdown(deal.expiryDate || deal.deadline);
      setCountdown(res.text);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 10000);
    return () => clearInterval(timer);
  }, [deal.expiryDate, deal.deadline]);

  const discountPercent = Math.round(((deal.originalPrice - deal.publishedPrice) / deal.originalPrice) * 100);
  const distanceFormatted = deal.distanceMeters !== undefined ? formatDistance(deal.distanceMeters) : '1.4 km';
  const isExpired = countdown === 'EXPIRED' || deal.status === 'EXPIRED';

  return (
    <div 
      onClick={() => onOpenDetails(deal)}
      className={`group relative bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col cursor-pointer ${
        isExpired 
          ? 'border-zinc-200 opacity-60 bg-zinc-50 pointer-events-none' 
          : 'border-zinc-200/90 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-950/10 active:scale-[0.99]'
      }`}
    >
      {/* 1. Product Photo & Badges */}
      <div className="relative h-48 w-full bg-zinc-100 overflow-hidden">
        {deal.imageUrl ? (
          <img
            src={deal.imageUrl}
            alt={deal.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-tr from-emerald-100 to-teal-50">
            🥪
          </div>
        )}

        {/* 3. Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-zinc-950/80 backdrop-blur text-white text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg">
            {deal.category}
          </span>
        </div>

        {/* 4. Discount Badge */}
        <div className="absolute top-3 right-3 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
          <span>🔥 {discountPercent}% OFF</span>
        </div>

        {/* 6. Distance Badge */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur text-zinc-900 text-xs font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 border border-zinc-200/60">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>📍 {distanceFormatted}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* 7. Vendor Name */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">🏪 {deal.storeName}</span>
          </div>

          {/* 2. Product Name */}
          <h3 className="font-black text-lg text-zinc-900 mt-1 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {deal.productName}
          </h3>
        </div>

        {/* 5. Time Left (Reverse Countdown) */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-zinc-500 font-medium">Time Left:</span>
            <span className={`font-mono ${isExpired ? 'text-rose-600 font-extrabold' : 'text-emerald-700 font-black'}`}>
              ⏳ {countdown}
            </span>
          </div>

          <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
            View Location ➔
          </span>
        </div>
      </div>
    </div>
  );
}
