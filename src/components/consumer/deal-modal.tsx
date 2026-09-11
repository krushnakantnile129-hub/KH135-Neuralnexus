"use client";

import React from 'react';
import { Deal } from '@/shared/types';
import { formatINR, formatTimeRemaining } from '@/lib/utils';
import { formatDistance, getGoogleMapsUrl, getAppleMapsUrl } from '@/lib/geo';
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
  Share2
} from 'lucide-react';

interface Props {
  deal: Deal;
  onClose: () => void;
}

export function DealModal({ deal, onClose }: Props) {
  const timeLeft = formatTimeRemaining(deal.deadline);
  const distanceFormatted = deal.distanceMeters !== undefined ? formatDistance(deal.distanceMeters) : '< 1.5 km';
  const discountPercent = Math.round(((deal.originalPrice - deal.publishedPrice) / deal.originalPrice) * 100);

  const googleMapsUrl = getGoogleMapsUrl(deal.latitude, deal.longitude, deal.storeName);
  const appleMapsUrl = getAppleMapsUrl(deal.latitude, deal.longitude, deal.storeName);

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
              🥐
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
              <span>{distanceFormatted} away</span>
            </div>
            <div className="bg-emerald-600/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft.text}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
              <Store className="w-4 h-4" />
              <span>{deal.storeName}</span>
              <span className="text-zinc-300">•</span>
              <span className="uppercase tracking-wider text-[10px] bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded font-mono">
                {deal.storeCategory}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-zinc-900 mt-1">{deal.productName}</h2>
            <p className="text-xs text-zinc-500 mt-1 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span>{deal.storeAddress}</span>
            </p>
          </div>

          {/* Pricing Highlight Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wide">Surplus Clearance Price</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-emerald-800">{formatINR(deal.publishedPrice)}</span>
                <span className="text-base text-zinc-400 line-through font-medium">{formatINR(deal.originalPrice)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase">Stock Remaining</span>
              <p className="text-xl font-extrabold text-zinc-900 mt-0.5">{deal.remainingUnits} units</p>
            </div>
          </div>

          {/* Description */}
          {deal.description && (
            <div className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
              <strong className="text-zinc-800">Merchant Notes: </strong>
              {deal.description}
            </div>
          )}

          {/* Zero-Checkout Physical Buy Info */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Zero-Checkout Walk-In Model (BR-01):</strong> No in-app payment or reservation. Items are sold first-come, first-served directly at the merchant's physical cash counter before the selling deadline.
            </div>
          </div>

          {/* Direction Launch Buttons */}
          <div className="space-y-2 pt-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Navigation className="w-4 h-4 fill-current" />
              <span>Launch Turn-by-Turn in Google Maps</span>
              <ExternalLink className="w-4 h-4 opacity-70" />
            </a>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={appleMapsUrl}
                className="py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>🍎 Apple Maps</span>
              </a>

              <a
                href={`tel:${deal.phoneContact}`}
                className="py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-zinc-600" />
                <span>Call Store</span>
              </a>
            </div>
          </div>

          {/* Section 17 Statutory Food Safety Disclaimer */}
          <div className="text-[10px] text-zinc-400 border-t border-zinc-100 pt-3 leading-normal">
            <strong>Statutory Disclaimer:</strong> SAVE-BITE operates solely as a technological information discovery conduit. All warranties regarding edible safety, freshness standards, and hygienic handling remain strictly with the registered merchant.
          </div>
        </div>
      </div>
    </div>
  );
}
