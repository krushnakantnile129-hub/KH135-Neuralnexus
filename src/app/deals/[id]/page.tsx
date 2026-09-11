"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Deal } from '@/shared/types';
import { loadDeals } from '@/lib/store';
import { formatINR, formatTimeRemaining } from '@/lib/utils';
import { formatDistance, getGoogleMapsUrl, getAppleMapsUrl } from '@/lib/geo';
import { 
  ChevronLeft, 
  MapPin, 
  Clock, 
  Phone, 
  Store, 
  Navigation, 
  ShieldAlert, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params?.id as string;
  const [deal, setDeal] = useState<Deal | null>(null);

  useEffect(() => {
    if (!dealId) return;
    const allDeals = loadDeals();
    const found = allDeals.find(d => d.id === dealId);
    if (found) {
      setDeal(found);
    }
  }, [dealId]);

  if (!deal) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center border border-zinc-200">
          <p className="text-zinc-500 text-sm">Deal listing not found or expired.</p>
          <Link href="/" className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
            Back to Consumer Feed
          </Link>
        </div>
      </div>
    );
  }

  const timeLeft = formatTimeRemaining(deal.deadline);
  const discountPercent = Math.round(((deal.originalPrice - deal.publishedPrice) / deal.originalPrice) * 100);
  const googleMapsUrl = getGoogleMapsUrl(deal.latitude, deal.longitude, deal.storeName);
  const appleMapsUrl = getAppleMapsUrl(deal.latitude, deal.longitude, deal.storeName);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Proximity Deals</span>
        </Link>

        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200 grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-6 relative bg-zinc-900 min-h-[300px]">
            {deal.imageUrl ? (
              <img src={deal.imageUrl} alt={deal.productName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl">🥐</div>
            )}
            <div className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
              {discountPercent}% OFF SURPLUS
            </div>
          </div>

          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                <Store className="w-4 h-4" />
                <span>{deal.storeName}</span>
                <span className="text-zinc-300">•</span>
                <span className="uppercase tracking-wider text-[10px] bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded font-mono">
                  {deal.storeCategory}
                </span>
              </div>

              <h1 className="text-2xl font-black text-zinc-900 mt-1">{deal.productName}</h1>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{deal.storeAddress}</span>
              </p>

              <div className="mt-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Surplus Cash Price</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-emerald-900">{formatINR(deal.publishedPrice)}</span>
                    <span className="text-sm text-zinc-400 line-through">{formatINR(deal.originalPrice)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Available</span>
                  <p className="text-xl font-black text-zinc-900">{deal.remainingUnits} units</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-zinc-600 font-medium">
                <div className="flex items-center gap-1 text-rose-600 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeLeft.text}</span>
                </div>
                {deal.freshnessTag && (
                  <div className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{deal.freshnessTag}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero-Checkout:</strong> Pay physically at the store counter. No online booking required.
                </span>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
              >
                <Navigation className="w-4 h-4 fill-current" />
                <span>Launch Google Maps Turn-by-Turn</span>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={appleMapsUrl}
                  className="py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>🍎 Apple Maps</span>
                </a>
                <a
                  href={`tel:${deal.phoneContact}`}
                  className="py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Call Store</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}