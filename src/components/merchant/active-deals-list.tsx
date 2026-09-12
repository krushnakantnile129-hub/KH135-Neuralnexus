"use client";

import React from 'react';
import Link from 'next/link';
import { Deal } from '@/shared/types';
import { formatINR, formatDisplayDate, formatExpiryCountdown } from '@/lib/utils';
import { Check, XCircle, Clock, ShoppingBag, Eye, Store, AlertTriangle, ShieldCheck, Flame, Sliders, Calendar, Zap, AlertCircle } from 'lucide-react';

interface Props {
  deals: Deal[];
  onSellOne: (dealId: string) => void;
  onSellAll: (dealId: string) => void;
  onCancel: (dealId: string) => void;
}

export function ActiveDealsList({ deals, onSellOne, onSellAll, onCancel }: Props) {
  if (deals.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-zinc-200 shadow-sm">
        <span className="text-4xl block mb-2">📦</span>
        <h4 className="font-bold text-zinc-900 text-sm">No Active Surplus Listings</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          When closing windows approach, publish flash deals to clear inventory and prevent food loss.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-zinc-900 text-sm">Surplus Inventory &amp; Waste Risk Cards</h3>
          <p className="text-xs text-zinc-500">Real-time status, date-based expiry countdowns, and physical counter tracking</p>
        </div>
        <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
          {deals.filter(d => d.status === 'ACTIVE').length} Live Deals
        </span>
      </div>

      <div className="divide-y divide-zinc-100">
        {deals.map((deal) => {
          const countdown = formatExpiryCountdown(deal.expiryDate || deal.deadline);
          const isExpired = countdown.isExpired || deal.status === 'EXPIRED';
          const isFinished = isExpired || deal.status !== 'ACTIVE' || deal.remainingUnits === 0;
          const riskScore = deal.wasteRiskPercentage ?? deal.wasteRiskScore ?? 50;
          const unit = deal.unit || 'units';

          // Format Risk Badge
          const getRiskBadge = (score: number) => {
            if (isExpired) {
              return { label: `100% 🔴 (EXPIRED)`, bg: 'bg-rose-100 text-rose-900 border-rose-300' };
            }
            if (score <= 30) {
              return { label: `${score}% 🟢 (Low)`, bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
            } else if (score <= 60) {
              return { label: `${score}% 🟡 (Medium)`, bg: 'bg-amber-100 text-amber-800 border-amber-300' };
            } else if (score <= 80) {
              return { label: `${score}% 🟠 (High)`, bg: 'bg-orange-100 text-orange-800 border-orange-300' };
            } else {
              return { label: `${score}% 🔴 (Critical)`, bg: 'bg-rose-100 text-rose-800 border-rose-300' };
            }
          };

          const riskBadge = getRiskBadge(riskScore);
          const mfgFormatted = deal.manufacturingDateFormatted || (deal.manufacturingDate ? formatDisplayDate(deal.manufacturingDate) : '10 September 2026');
          const expiryFormatted = deal.expiryDateFormatted || (deal.expiryDate ? formatDisplayDate(deal.expiryDate) : formatDisplayDate(deal.deadline));
          const discountPct = Math.round(((deal.originalPrice - deal.publishedPrice) / deal.originalPrice) * 100);

          return (
            <div
              key={deal.id}
              className={`p-5 flex flex-col gap-4 transition-colors ${
                isExpired ? 'bg-rose-50/40 border-l-4 border-rose-500' : isFinished ? 'bg-zinc-50/70 opacity-65' : 'hover:bg-zinc-50/50'
              }`}
            >
              {/* Expired Banner Alert for Merchant */}
              {isExpired && (
                <div className="p-3 bg-rose-100/80 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>EXPIRED WARNING:</strong> This product reached its expiry date ({expiryFormatted}) and has been automatically removed from customer discovery.
                  </span>
                </div>
              )}

              {/* Top Row: Title, Category, Status & Risk */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                    {deal.imageUrl ? (
                      <img src={deal.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🥐</div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-base text-zinc-900">{deal.productName}</h4>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold border border-zinc-200">
                        {deal.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isExpired
                          ? 'bg-rose-600 text-white'
                          : deal.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : deal.status === 'SOLD_OUT' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-zinc-100 text-zinc-800'
                      }`}>
                        {isExpired ? 'EXPIRED' : deal.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 mt-1">
                      <span>📦 Stock: <strong className="text-zinc-900">{deal.remainingUnits} {unit}</strong> remaining (of {deal.initialUnits})</span>
                      <span>•</span>
                      <span>Sold: <strong className="text-emerald-700">{deal.soldUnits} {unit}</strong></span>
                      {(deal.salesVelocityNumeric !== undefined || deal.salesVelocity) && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-zinc-600">
                            <Zap className="w-3 h-3 text-amber-500" />
                            Velocity: <strong>{deal.salesVelocityNumeric ?? (deal.salesVelocity === 'HIGH' ? 4.5 : deal.salesVelocity === 'MEDIUM' ? 2.5 : 1.5)} {unit}/hr</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Waste Risk Badge */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-sm ${riskBadge.bg}`}>
                    Waste Risk: {riskBadge.label}
                  </span>
                </div>
              </div>

              {/* Middle Section: Pricing & Date Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-3.5 rounded-xl border border-zinc-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Current Price</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-black text-zinc-900">{formatINR(deal.publishedPrice)}</span>
                    <span className="text-[11px] text-zinc-400 line-through">{formatINR(deal.originalPrice)}</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-600">({discountPct}% OFF)</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Manufacturing Date</span>
                  <p className="font-semibold text-zinc-800 mt-0.5 truncate">
                    🏭 {mfgFormatted}
                  </p>
                  <span className="text-[10px] text-zinc-400">Batch Origin</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Expiry Date</span>
                  <p className="font-semibold text-zinc-800 mt-0.5 truncate">
                    📅 {expiryFormatted}
                  </p>
                  <span className="text-[10px] text-zinc-400">Strict Expiry Date</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Time Remaining</span>
                  <p className={`font-bold mt-0.5 flex items-center gap-1 ${isExpired ? 'text-rose-600 font-black' : countdown.days <= 1 ? 'text-amber-600' : 'text-zinc-800'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {deal.expiryCountdownFormatted || countdown.text}
                  </p>
                  <span className="text-[10px] text-zinc-400">Live countdown</span>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <Link
                    href="/merchant/add-deal"
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Adjust Price / Restock</span>
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  {!isExpired && deal.status === 'ACTIVE' && deal.remainingUnits > 0 ? (
                    <>
                      <button
                        onClick={() => onSellOne(deal.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        title="Register 1 physical counter purchase"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Sold 1 {unit === 'units' || unit === 'pieces' || unit === 'packs' ? 'Unit' : unit}</span>
                      </button>

                      <button
                        onClick={() => onSellAll(deal.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                        title="Clear all remaining inventory immediately"
                      >
                        <span>Mark All Sold</span>
                      </button>

                      <button
                        onClick={() => onCancel(deal.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Cancel listing"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-zinc-400 italic px-2 py-1">
                      {isExpired ? 'Archived (Expired)' : 'Archived in Telemetry'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
