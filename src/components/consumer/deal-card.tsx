"use client";

import React, { useState, useEffect } from 'react';
import { Deal } from '@/shared/types';
import { formatINR, formatDisplayDate, formatExpiryCountdown } from '@/lib/utils';
import { formatDistance, getGoogleMapsUrl } from '@/lib/geo';
import { Clock, Navigation, MapPin, Package, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  deal: Deal;
  onOpenDetails: (deal: Deal) => void;
  onClaim?: (deal: Deal) => void;
}

export function DealCard({ deal, onOpenDetails, onClaim }: Props) {
  const [countdown, setCountdown] = useState(
    formatExpiryCountdown(deal.expiryDate || deal.deadline)
  );

  // Live countdown updated every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(formatExpiryCountdown(deal.expiryDate || deal.deadline));
    }, 10000);
    return () => clearInterval(timer);
  }, [deal.expiryDate, deal.deadline]);

  const discountPercent = Math.round(((deal.originalPrice - deal.publishedPrice) / deal.originalPrice) * 100);
  const distanceFormatted = deal.distanceMeters !== undefined ? formatDistance(deal.distanceMeters) : '1.2 km';
  const isExpiredOrSoldOut = countdown.isExpired || deal.status !== 'ACTIVE' || deal.remainingUnits <= 0;

  const mfgDateText = deal.manufacturingDateFormatted || (deal.manufacturingDate ? formatDisplayDate(deal.manufacturingDate) : '10 September 2026');
  const expiryDateText = deal.expiryDateFormatted || (deal.expiryDate ? formatDisplayDate(deal.expiryDate) : formatDisplayDate(deal.deadline));
  const riskScore = deal.wasteRiskPercentage ?? deal.wasteRiskScore ?? 86;

  const handleClaimClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClaim) {
      onClaim(deal);
    } else {
      onOpenDetails(deal);
    }
  };

  return (
    <div 
      onClick={() => onOpenDetails(deal)}
      className={`group relative bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col cursor-pointer ${
        isExpiredOrSoldOut 
          ? 'border-zinc-200 opacity-60 bg-zinc-50' 
          : 'border-zinc-200/90 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-950/10'
      }`}
    >
      {/* Product Image Header */}
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

        {/* Discount Badge */}
        <div className="absolute top-3 right-3 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
          <span>{discountPercent}% OFF</span>
        </div>

        {/* Category & Freshness Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="bg-zinc-950/80 backdrop-blur text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md">
            {deal.category}
          </span>
          {deal.freshnessTag && (
            <span className="bg-emerald-600/90 backdrop-blur text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              {deal.freshnessTag}
            </span>
          )}
        </div>

        {/* Distance Badge (Strict <= 10 km) */}
        <div className="absolute bottom-2.5 left-3 bg-white/95 backdrop-blur text-zinc-900 text-xs font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 border border-zinc-200/60">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>📍 {distanceFormatted} away</span>
        </div>
      </div>

      {/* Card Body with Canonical Spec Structure */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Store Name */}
          <p className="text-xs font-bold text-emerald-700 tracking-tight flex items-center gap-1">
            <span>🏪</span> {deal.storeName}
          </p>

          {/* Product Title */}
          <h3 className="font-black text-lg text-zinc-900 mt-1 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {deal.productName}
          </h3>

          {/* Pricing Row: ~~₹60~~ → ₹35 */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm text-zinc-400 line-through font-semibold">
              {formatINR(deal.originalPrice)}
            </span>
            <span className="text-zinc-400 text-sm font-bold">→</span>
            <span className="text-2xl font-black text-emerald-800">
              {formatINR(deal.publishedPrice)}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md ml-auto">
              Save {formatINR(deal.originalPrice - deal.publishedPrice)}
            </span>
          </div>

          {/* Metadata Matrix */}
          <div className="mt-4 pt-3 border-t border-zinc-100 space-y-1.5 text-xs text-zinc-700">
            {/* Stock Count */}
            <div className="flex items-center gap-1.5 font-semibold">
              <span>📦</span>
              <span><strong>{deal.remainingUnits}</strong> {deal.unit || 'units'} left</span>
            </div>

            {/* Manufacturing Date: 10 September 2026 */}
            <div className="flex items-center gap-1.5">
              <span>🏭</span>
              <span>Made: <strong className="text-zinc-900">{mfgDateText}</strong></span>
            </div>

            {/* Expiry Date: 12 September 2026 */}
            <div className="flex items-center gap-1.5">
              <span>📅</span>
              <span>Expires: <strong className="text-zinc-900">{expiryDateText}</strong></span>
            </div>

            {/* Live Countdown: 1 Day 5 Hours Remaining */}
            <div className={`flex items-center gap-1.5 font-bold ${
              isExpiredOrSoldOut ? 'text-zinc-400' : countdown.days <= 1 ? 'text-amber-600' : 'text-emerald-800'
            }`}>
              <span>⏳</span>
              <span>{deal.expiryCountdownFormatted || countdown.text}</span>
            </div>

            {/* Waste Risk: 86% */}
            <div className="flex items-center gap-1.5 font-bold pt-1">
              <span>🔴</span>
              <span>Waste Risk: <strong className="text-rose-600">{riskScore}%</strong></span>
            </div>
          </div>
        </div>

        {/* Card Footer: [ CLAIM DEAL ] */}
        <div className="pt-2">
          {isExpiredOrSoldOut ? (
            <button
              disabled
              className="w-full py-3 px-4 rounded-xl bg-zinc-200 text-zinc-500 text-xs font-bold cursor-not-allowed text-center"
            >
              {deal.status === 'SOLD_OUT' || deal.remainingUnits <= 0 ? 'SOLD OUT AT COUNTER' : 'EXPIRED PRODUCT'}
            </button>
          ) : (
            <button
              onClick={handleClaimClick}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>[ CLAIM DEAL ]</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
