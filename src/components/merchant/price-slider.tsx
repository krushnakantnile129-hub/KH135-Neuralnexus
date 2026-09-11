"use client";

import React from 'react';
import { formatINR } from '@/lib/utils';
import { Sliders, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

interface Props {
  originalPrice: number;
  selectedPrice: number;
  recommendedPrice: number;
  recommendedDiscountPct: number;
  onChangePrice: (price: number) => void;
  wasteRiskScore: number;
}

export function PriceSlider({
  originalPrice,
  selectedPrice,
  recommendedPrice,
  recommendedDiscountPct,
  onChangePrice,
  wasteRiskScore,
}: Props) {
  // Bounds strictly enforced: Floor 20% of base price to Ceiling 100% of base price
  const floorPrice = Math.max(5, Math.round(originalPrice * 0.20));
  const ceilingPrice = originalPrice;
  const currentDiscountPct = Math.round(((originalPrice - selectedPrice) / originalPrice) * 100);

  const isOverrideUpward = selectedPrice > recommendedPrice;
  const isRecommendedExact = selectedPrice === recommendedPrice;

  const estimatedSellThrough = Math.min(98, Math.max(15, Math.round(100 - wasteRiskScore * 0.75 + currentDiscountPct * 0.4)));

  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-sm text-zinc-900">Interactive Price Control Slider (60 FPS)</h3>
        </div>
        <button
          type="button"
          onClick={() => onChangePrice(recommendedPrice)}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 transition-colors"
          title="Snap to algorithmic clearance price"
        >
          <Sparkles className="w-3 h-3" />
          <span>Snap to Suggested ({formatINR(recommendedPrice)})</span>
        </button>
      </div>

      {/* Main Big Price Display */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Base Price</span>
          <span className="text-base font-bold text-zinc-500 line-through">{formatINR(originalPrice)}</span>
        </div>
        <div className="bg-white rounded-lg p-1.5 shadow-sm border border-zinc-200/80">
          <span className="text-[10px] text-emerald-700 uppercase font-extrabold block">Published Price</span>
          <span className="text-xl font-black text-emerald-700">{formatINR(selectedPrice)}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Discount</span>
          <span className="text-base font-extrabold text-rose-600">-{currentDiscountPct}%</span>
        </div>
      </div>

      {/* Range Slider Track */}
      <div className="space-y-2 pt-2">
        <div className="relative">
          <input
            type="range"
            min={floorPrice}
            max={ceilingPrice}
            step={1}
            value={selectedPrice}
            onChange={(e) => onChangePrice(Number(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-lg appearance-none cursor-pointer accent-emerald-700"
          />

          {/* Recommended Tick Mark */}
          <div
            className="absolute -top-1 pointer-events-none flex flex-col items-center"
            style={{
              left: `${Math.min(95, Math.max(5, ((recommendedPrice - floorPrice) / (ceilingPrice - floorPrice || 1)) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="w-2 h-4 bg-emerald-800 rounded-full shadow-sm" />
          </div>
        </div>

        <div className="flex justify-between text-xs font-semibold text-zinc-500">
          <span>Floor: {formatINR(floorPrice)} (20%)</span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            Suggested: {formatINR(recommendedPrice)} ({recommendedDiscountPct}% off)
          </span>
          <span>Ceiling: {formatINR(ceilingPrice)} (0%)</span>
        </div>
      </div>

      {/* State Feedback Banner (PRD Section 09 State A vs State B) */}
      <div className="pt-2">
        {isRecommendedExact ? (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">
                <strong>State A (Algorithmic Baseline):</strong> {recommendedDiscountPct}% markdown clears inventory at ~{estimatedSellThrough}% probability.
              </span>
            </div>
            <span className="font-mono font-bold text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              OPTIMAL
            </span>
          </div>
        ) : isOverrideUpward ? (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>State B (Merchant Human Override - Margin Protection)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-normal pl-5">
              ⚠️ You priced ₹{selectedPrice - recommendedPrice} above suggestion. Estimated sell-through drops to ~{estimatedSellThrough}%. You maintain 100% price sovereignty.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>
              <strong>Deep Clearance State:</strong> Heavy markdown (-{currentDiscountPct}%) accelerates walk-in footfall sell-out.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
