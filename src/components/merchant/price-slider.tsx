"use client";

import React from 'react';
import { formatINR } from '@/lib/utils';
import { Sliders, Sparkles, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  originalPrice: number;
  selectedPrice: number;
  recommendedPrice: number;
  recommendedDiscountPct: number;
  onChangePrice: (price: number) => void;
  wasteRiskScore: number;
  estimatedRiskScore?: number;
}

export function PriceSlider({
  originalPrice,
  selectedPrice,
  recommendedPrice,
  recommendedDiscountPct,
  onChangePrice,
  wasteRiskScore,
  estimatedRiskScore,
}: Props) {
  // Bounds strictly enforced: Floor 20% to Ceiling 100% of base price
  const floorPrice = Math.max(5, Math.round(originalPrice * 0.20));
  const ceilingPrice = originalPrice;
  const currentDiscountPct = Math.max(0, Math.round(((originalPrice - selectedPrice) / originalPrice) * 100));

  const isOverrideUpward = selectedPrice > recommendedPrice;
  const isRecommendedExact = selectedPrice === recommendedPrice;
  const isOverrideDownward = selectedPrice < recommendedPrice;

  const currentEstRisk = typeof estimatedRiskScore === 'number'
    ? estimatedRiskScore
    : Math.min(100, Math.max(0, Math.round(wasteRiskScore - ((currentDiscountPct - recommendedDiscountPct) * 0.5))));

  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-sm text-zinc-900">Shopkeeper Price Slider (60 FPS)</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
            Estimated Risk: {currentEstRisk}/100
          </span>
          <button
            type="button"
            onClick={() => onChangePrice(recommendedPrice)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 transition-colors"
            title="Snap to recommended price"
          >
            <Sparkles className="w-3 h-3" />
            <span>Recommended ({formatINR(recommendedPrice)})</span>
          </button>
        </div>
      </div>

      {/* Main Big Price Display */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Original Price</span>
          <span className="text-base font-bold text-zinc-500 line-through">{formatINR(originalPrice)}</span>
        </div>
        <div className="bg-white rounded-lg p-1.5 shadow-sm border border-zinc-200/80">
          <span className="text-[10px] text-emerald-700 uppercase font-extrabold block">Current Price</span>
          <span className="text-xl font-black text-emerald-700">{formatINR(selectedPrice)}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Discount</span>
          <span className="text-base font-extrabold text-rose-600">-{currentDiscountPct}%</span>
        </div>
      </div>

      {/* Range Slider Track */}
      <div className="space-y-2 pt-1">
        <div className="relative">
          <input
            type="range"
            min={floorPrice}
            max={ceilingPrice}
            step={1}
            value={selectedPrice}
            onChange={(e) => onChangePrice(Number(e.target.value))}
            className="w-full h-2.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-lg appearance-none cursor-pointer accent-emerald-700"
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
          <span>Floor: {formatINR(floorPrice)} (80% off)</span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            Recommended: {formatINR(recommendedPrice)} ({recommendedDiscountPct}% off)
          </span>
          <span>Ceiling: {formatINR(ceilingPrice)} (0% off)</span>
        </div>
      </div>

      {/* Philosophy Banner: AI recommends -> Human decides -> System explains */}
      <div className="pt-1">
        {isRecommendedExact ? (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">
                <strong>Recommended Price:</strong> Optimal discount (-{recommendedDiscountPct}%) to clear remaining stock before the safety deadline.
              </span>
            </div>
            <span className="font-mono font-bold text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              OPTIMAL
            </span>
          </div>
        ) : isOverrideUpward ? (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Your selected price is {formatINR(selectedPrice)}</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed pl-5">
              Estimated Waste Risk may increase (to {currentEstRisk}/100) because the discount is smaller (-{currentDiscountPct}% vs suggested -{recommendedDiscountPct}%). You retain 100% price sovereignty.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Your selected price is {formatINR(selectedPrice)}</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed pl-5">
              A larger discount (-{currentDiscountPct}%) may improve the chance of selling the remaining stock before the deadline (Estimated Risk drops to {currentEstRisk}/100).
            </p>
          </div>
        )}

        <p className="text-[10px] text-zinc-400 italic text-center mt-2">
          System recommends → Human decides → System explains (Risk scores represent estimated risk, not guaranteed sales).
        </p>
      </div>
    </div>
  );
}

