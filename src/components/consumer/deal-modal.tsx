"use client";

import React from 'react';
import { Deal } from '@/shared/types';
import { formatExpiryCountdown } from '@/lib/utils';
import { formatDistance, getGoogleMapsUrl, getAppleMapsUrl } from '@/lib/geo';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  Clock, 
  Store, 
  ExternalLink,
  Flame,
  X
} from 'lucide-react';

interface Props {
  deal: Deal;
  onClose: () => void;
}

export function DealModal({ deal, onClose }: Props) {
  const countdown = formatExpiryCountdown(deal.expiryDate || deal.deadline);
  const distanceFormatted = deal.distanceMeters !== undefined ? formatDistance(deal.distanceMeters) : '1.4 km';
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
              🥪
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors font-bold text-sm"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <span>🔥 {discountPercent}% OFF SURPLUS</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white drop-shadow-md">
            <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>📍 {distanceFormatted}</span>
            </div>
            <div className="bg-emerald-600/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>⏳ {deal.expiryCountdownFormatted || countdown.text}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
              <Store className="w-4 h-4" />
              <span>🏪 {deal.storeName}</span>
              <span className="text-zinc-300">•</span>
              <span className="uppercase tracking-wider text-[10px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-mono font-bold">
                {deal.category}
              </span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 mt-1">{deal.productName}</h2>
            <p className="text-xs text-zinc-600 mt-1 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{deal.storeAddress}</span>
            </p>
          </div>

          {/* Pricing & Savings Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Clearance Walk-in Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  ₹{deal.publishedPrice}
                </span>
                <span className="text-xs text-zinc-400 font-bold line-through font-mono">
                  ₹{deal.originalPrice}
                </span>
                <span className="text-xs font-semibold text-zinc-500">
                  / {deal.unit || 'unit'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-rose-600 block">You Save</span>
              <span className="text-sm font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                ₹{deal.originalPrice - deal.publishedPrice} (-{discountPercent}%)
              </span>
            </div>
          </div>

          {/* Direct Walk-in Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
            <h4 className="font-extrabold text-xs flex items-center gap-1.5">
              <span>🚶 Direct Counter Purchase (Zero Reservation Needed)</span>
            </h4>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Visit <strong>{deal.storeName}</strong> in person to grab this deal directly at the counter. Open Google Maps below for turn-by-turn walking / driving directions.
            </p>
          </div>

          {/* Description */}
          {deal.description && (
            <div className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
              <strong className="text-zinc-800">Product Details: </strong>
              {deal.description}
            </div>
          )}

          {/* Navigation & Contact Buttons */}
          <div className="space-y-2 pt-1">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Navigation className="w-4 h-4 fill-current" />
              <span>📍 Get Directions on Google Maps</span>
              <ExternalLink className="w-4 h-4 opacity-70" />
            </a>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${deal.phoneContact}`}
                className="py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-zinc-600" />
                <span>Call Store</span>
              </a>

              <button
                onClick={onClose}
                className="py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="text-[10px] text-zinc-400 border-t border-zinc-100 pt-3 leading-normal">
            <strong>ResQFood Proximity Notice:</strong> ResQFood connects consumers to local food vendors within 10 km to reduce surplus food waste.
          </div>
        </div>
      </div>
    </div>
  );
}
