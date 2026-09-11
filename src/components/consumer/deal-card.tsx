"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Deal } from '@/shared/types';
import { formatINR, formatTimeRemaining } from '@/lib/utils';
import { formatDistance, getGoogleMapsUrl, getAppleMapsUrl } from '@/lib/geo';
import { Clock, Navigation, MapPin, Package, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

interface Props {
  deal: Deal;
  onOpenDetails: (deal: Deal) => void;
}

export function DealCard({ deal, onOpenDetails }: Props) {
  const [timeLeft, setTimeLeft] = useState(formatTimeRemaining(deal.deadline));

  // Live decrementing timer updated every 10 seconds (FR-PUB-02 / FR-PUB-04)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(formatTimeRemaining(deal.deadline));
    }, 10000);
    return () => clearInterval(timer);
  }, [deal.deadline]);

  const discountPercent = Math.round(((deal.originalPrice - deal.publishedPrice) / deal.originalPrice) * 100);
  const distanceFormatted = deal.distanceMeters !== undefined ? formatDistance(deal.distanceMeters) : '< 1.5 km';
  const isExpiredOrSoldOut = timeLeft.isExpired || deal.status !== 'ACTIVE' || deal.remainingUnits <= 0;

  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getGoogleMapsUrl(deal.latitude, deal.longitude, deal.storeName);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      onClick={() => onOpenDetails(deal)}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col cursor-pointer ${
        isExpiredOrSoldOut 
          ? 'border-zinc-200 opacity-60 bg-zinc-50' 
          : 'border-zinc-200/80 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-950/5'
      }`}
    >
      {/* Top Image & Floating Badges */}
      <div className="relative h-44 w-full bg-zinc-100 overflow-hidden">
        {deal.imageUrl ? (
          <img
            src={deal.imageUrl}
            alt={deal.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-tr from-emerald-100 to-teal-50">
            🥐
          </div>
        )}

        {/* Discount Badge */}
        <div className="absolute top-3 right-3 bg-rose-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
          <span>{discountPercent}% OFF</span>
        </div>

        {/* Category & Freshness Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="bg-zinc-900/80 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
            {deal.category}
          </span>
          {deal.freshnessTag && (
            <span className="bg-emerald-600/90 backdrop-blur text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              {deal.freshnessTag}
            </span>
          )}
        </div>

        {/* Distance Badge Floating Bottom Left */}
        <div className="absolute bottom-2.5 left-3 bg-white/95 backdrop-blur text-zinc-900 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 border border-zinc-200/60">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>{distanceFormatted} away</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Store Commercial Title */}
          <p className="text-xs font-semibold text-emerald-700 tracking-tight flex items-center gap-1">
            <span>🏪</span> {deal.storeName}
          </p>

          {/* Product Name */}
          <h3 className="font-bold text-base text-zinc-900 mt-1 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {deal.productName}
          </h3>

          {deal.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
              {deal.description}
            </p>
          )}

          {/* Pricing Row */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">
              {formatINR(deal.publishedPrice)}
            </span>
            <span className="text-sm text-zinc-400 line-through font-medium">
              {formatINR(deal.originalPrice)}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Save {formatINR(deal.originalPrice - deal.publishedPrice)}
            </span>
          </div>
        </div>

        {/* Card Footer Metadata & Actions */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-col gap-2.5">
          {/* Status indicators */}
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className={`w-3.5 h-3.5 ${timeLeft.minutes <= 45 ? 'text-rose-500 animate-pulse' : 'text-zinc-400'}`} />
              <span className={timeLeft.minutes <= 45 ? 'text-rose-600 font-bold' : ''}>
                {timeLeft.text}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-medium bg-zinc-100 px-2 py-0.5 rounded-md">
              <Package className="w-3.5 h-3.5 text-zinc-500" />
              <span><strong>{deal.remainingUnits}</strong> units left</span>
            </div>
          </div>

          {/* Action Button: Zero-Checkout Deep-Link */}
          {isExpiredOrSoldOut ? (
            <button
              disabled
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-200 text-zinc-500 text-xs font-bold cursor-not-allowed text-center"
            >
              {deal.status === 'SOLD_OUT' || deal.remainingUnits <= 0 ? 'SOLD OUT AT COUNTER' : 'DEAL EXPIRED'}
            </button>
          ) : (
            <button
              onClick={handleDirectionsClick}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Navigation className="w-3.5 h-3.5 fill-current" />
              <span>GET DIRECTIONS ➔</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
