"use client";

import React from 'react';
import { Deal } from '@/shared/types';
import { formatINR, formatTimeRemaining } from '@/lib/utils';
import { Check, XCircle, Clock, ShoppingBag, Eye, Store } from 'lucide-react';

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
          <h3 className="font-bold text-zinc-900 text-sm">Surplus Inventory Management</h3>
          <p className="text-xs text-zinc-500">Click one-tap buttons as walk-in counter purchases occur</p>
        </div>
        <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
          {deals.filter(d => d.status === 'ACTIVE').length} Live Deals
        </span>
      </div>

      <div className="divide-y divide-zinc-100">
        {deals.map((deal) => {
          const time = formatTimeRemaining(deal.deadline);
          const isFinished = deal.status !== 'ACTIVE' || deal.remainingUnits === 0;

          return (
            <div
              key={deal.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isFinished ? 'bg-zinc-50/70 opacity-65' : 'hover:bg-zinc-50/50'
              }`}
            >
              {/* Product Info */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                  {deal.imageUrl ? (
                    <img src={deal.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🥐</div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-zinc-900">{deal.productName}</h4>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold">
                      {deal.category}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      deal.status === 'ACTIVE' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : deal.status === 'SOLD_OUT' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {deal.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-1">
                    <span className="font-black text-emerald-700 text-sm">
                      {formatINR(deal.publishedPrice)}
                      <span className="text-xs text-zinc-400 font-normal line-through ml-1">{formatINR(deal.originalPrice)}</span>
                    </span>
                    <span>•</span>
                    <span>Remaining: <strong className="text-zinc-900">{deal.remainingUnits}</strong> / {deal.initialUnits}</span>
                    <span>•</span>
                    <span>Sold: <strong className="text-emerald-700">{deal.soldUnits}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {time.text}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fast 1-Click Inventory Actions (FR-DASH-01) */}
              <div className="flex items-center gap-2 shrink-0">
                {deal.status === 'ACTIVE' && deal.remainingUnits > 0 ? (
                  <>
                    <button
                      onClick={() => onSellOne(deal.id)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      title="Register 1 physical counter purchase"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Sold 1 Unit</span>
                    </button>

                    <button
                      onClick={() => onSellAll(deal.id)}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                      title="Clear all remaining inventory immediately"
                    >
                      <span>Mark All Sold</span>
                    </button>

                    <button
                      onClick={() => onCancel(deal.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Cancel listing"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-zinc-400 italic px-2 py-1">
                    Archived in Telemetry
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
