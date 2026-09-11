"use client";

import React, { useState } from 'react';
import { Deal, DealClaim } from '@/shared/types';
import { formatINR, formatDisplayDate, formatExpiryCountdown } from '@/lib/utils';
import { formatDistance, getGoogleMapsUrl, getAppleMapsUrl } from '@/lib/geo';
import { claimDeal } from '@/lib/store';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  Clock, 
  Package, 
  ShieldAlert, 
  Store, 
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Calendar,
  Zap,
  Ticket
} from 'lucide-react';

interface Props {
  deal: Deal;
  onClose: () => void;
  onClaimSuccess?: () => void;
}

export function DealModal({ deal, onClose, onClaimSuccess }: Props) {
  const [claimResult, setClaimResult] = useState<DealClaim | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [currentRemaining, setCurrentRemaining] = useState(deal.remainingUnits);

  const countdown = formatExpiryCountdown(deal.expiryDate || deal.deadline);
  const distanceFormatted = deal.distanceMeters !== undefined ? formatDistance(deal.distanceMeters) : '1.2 km';
  const discountPercent = Math.round(((deal.originalPrice - deal.publishedPrice) / deal.originalPrice) * 100);

  const googleMapsUrl = getGoogleMapsUrl(deal.latitude, deal.longitude, deal.storeName);
  const appleMapsUrl = getAppleMapsUrl(deal.latitude, deal.longitude, deal.storeName);

  const mfgDateText = deal.manufacturingDateFormatted || (deal.manufacturingDate ? formatDisplayDate(deal.manufacturingDate) : '10 September 2026');
  const expiryDateText = deal.expiryDateFormatted || (deal.expiryDate ? formatDisplayDate(deal.expiryDate) : formatDisplayDate(deal.deadline));
  const riskScore = deal.wasteRiskPercentage ?? deal.wasteRiskScore ?? 86;

  const handleClaim = () => {
    setIsClaiming(true);
    const res = claimDeal(deal.id, 1);
    setIsClaiming(false);
    if (res.success && res.claim) {
      setClaimResult(res.claim);
      setCurrentRemaining(res.deal.remainingUnits);
      if (onClaimSuccess) onClaimSuccess();
    } else {
      alert(res.message || 'Could not claim deal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header Image */}
        <div className="relative h-56 w-full bg-zinc-900">
          {deal.imageUrl ? (
            <img
              src={deal.imageUrl}
              alt={deal.productName}
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🥪
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors font-bold text-sm"
          >
            ✕
          </button>

          <div className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
            {discountPercent}% OFF SURPLUS
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white drop-shadow-md">
            <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>📍 {distanceFormatted} away</span>
            </div>
            <div className="bg-emerald-600/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{countdown.text}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* If claim was successful, show the voucher claim card */}
          {claimResult ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-500 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xl shadow-md">
                  ✓
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-800">
                  Deal Claimed &amp; Reserved
                </span>
                <h3 className="text-2xl font-mono font-black text-emerald-950 tracking-wider">
                  {claimResult.claimToken}
                </h3>
                <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                  Show this reservation token at the cash counter of <strong>{deal.storeName}</strong> to collect your item at ₹{deal.publishedPrice}.
                </p>
              </div>

              <div className="space-y-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Navigation className="w-4 h-4 fill-current" />
                  <span>Open Turn-by-Turn Navigation (Google Maps)</span>
                  <ExternalLink className="w-4 h-4 opacity-70" />
                </a>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                  <Store className="w-4 h-4" />
                  <span>{deal.storeName}</span>
                  <span className="text-zinc-300">•</span>
                  <span className="uppercase tracking-wider text-[10px] bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded font-mono font-bold">
                    {deal.category}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-zinc-900 mt-1">{deal.productName}</h2>
                <p className="text-xs text-zinc-500 mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{deal.storeAddress}</span>
                </p>
              </div>

              {/* Pricing Highlight Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">Surplus Clearance Price</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-emerald-800">{formatINR(deal.publishedPrice)}</span>
                    <span className="text-base text-zinc-400 line-through font-medium">{formatINR(deal.originalPrice)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase">Stock Remaining</span>
                  <p className="text-xl font-extrabold text-zinc-900 mt-0.5">{currentRemaining} {deal.unit || 'units'}</p>
                </div>
              </div>

              {/* Date & Waste Risk Breakdown Grid */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium flex items-center gap-1">
                    <span>🏭</span> Manufacturing Date:
                  </span>
                  <span className="font-bold text-zinc-900">{mfgDateText}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium flex items-center gap-1">
                    <span>📅</span> Expiry Date:
                  </span>
                  <span className="font-bold text-zinc-900">{expiryDateText}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-medium flex items-center gap-1">
                    <span>⏳</span> Remaining Window:
                  </span>
                  <span className="font-bold text-emerald-700 font-mono">{deal.expiryCountdownFormatted || countdown.text}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
                  <span className="text-zinc-600 font-medium flex items-center gap-1">
                    <span>🔴</span> Waste Risk Score:
                  </span>
                  <span className="font-extrabold text-rose-600">{riskScore}%</span>
                </div>
              </div>

              {/* Description */}
              {deal.description && (
                <div className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                  <strong className="text-zinc-800">Product Notes: </strong>
                  {deal.description}
                </div>
              )}

              {/* Claim & Direction Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleClaim}
                  disabled={isClaiming || currentRemaining <= 0 || countdown.isExpired}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Ticket className="w-4 h-4" />
                  <span>[ CLAIM DEAL FOR {formatINR(deal.publishedPrice)} ]</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Get Directions</span>
                  </a>

                  <a
                    href={`tel:${deal.phoneContact}`}
                    className="py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Call Store</span>
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Statutory Food Safety Disclaimer */}
          <div className="text-[10px] text-zinc-400 border-t border-zinc-100 pt-3 leading-normal">
            <strong>ResQFood Platform Notice:</strong> ResQFood connects consumers to local food merchants to prevent food waste. All items meet quality standards before sale.
          </div>
        </div>
      </div>
    </div>
  );
}
