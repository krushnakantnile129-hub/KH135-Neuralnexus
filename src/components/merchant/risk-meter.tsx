"use client";

import React from 'react';
import { RiskEvaluationResult } from '@/shared/types';
import { AlertTriangle, CheckCircle2, Flame, Info, Clock, AlertCircle, Sparkles, HelpCircle, Activity } from 'lucide-react';
import { formatINR } from '@/lib/utils';

interface Props {
  evaluation: RiskEvaluationResult;
}

export function RiskMeter({ evaluation }: Props) {
  const {
    wasteRiskScore,
    estimatedRiskScore,
    riskLevel,
    urgencyLevel,
    urgencyScore,
    stockPressureScore,
    salesRiskScore,
    expectedSalesUntilExpiry,
    stockPressureRatio,
    explanation,
    pricingExplanation,
    reasons,
    warningNotice,
    remainingLifeFormatted,
    remainingLifePct,
    windowStatus,
    recommendedPrice,
    recommendedDiscountPct,
  } = evaluation;

  // Determine colors based on waste risk score
  const getBadgeClass = () => {
    switch (riskLevel) {
      case 'Critical':
        return 'bg-rose-500/10 text-rose-700 border-rose-300';
      case 'High':
        return 'bg-orange-500/10 text-orange-700 border-orange-300';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-700 border-amber-300';
      case 'Low':
      default:
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300';
    }
  };

  const getMeterColor = () => {
    if (wasteRiskScore >= 81) return 'bg-rose-600';
    if (wasteRiskScore >= 61) return 'bg-orange-500';
    if (wasteRiskScore >= 31) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-sm text-zinc-900">Explainable Waste Risk Engine</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${getBadgeClass()}`}>
            Waste Risk: {wasteRiskScore}/100 — {riskLevel}
          </span>
        </div>
      </div>

      {/* Risk Progress Bar (0-30 Low, 31-60 Medium, 61-80 High, 81-100 Critical) */}
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200">
          <div
            className={`h-full rounded-full transition-all duration-200 ${getMeterColor()}`}
            style={{ width: `${Math.max(4, wasteRiskScore)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
          <span>0 (Low 0-30)</span>
          <span>31 (Med 31-60)</span>
          <span>61 (High 61-80)</span>
          <span>81-100 (Critical)</span>
        </div>
      </div>

      {/* Concrete Explainable Reasons List (Prompt Section 4 & 11) */}
      {reasons && reasons.length > 0 && (
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
          <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Score Explainability Factors (Why this score?):</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-600 pl-4 list-disc">
            {reasons.map((r, idx) => (
              <li key={idx} className="leading-relaxed">{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation Explainability Card */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Why is this price recommended?</span>
        </div>
        <p className="text-[11px] leading-relaxed text-emerald-900">
          {explanation}
        </p>
      </div>

      {/* Warning Notice if Price is Overridden Upward */}
      {warningNotice && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{warningNotice}</span>
        </div>
      )}

      {/* Subscores Vector Transparency: 50% Urgency + 30% Stock Pressure + 20% Sales Risk */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-[11px]">
        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
          <span className="text-zinc-500 block text-[10px] font-semibold uppercase">Urgency (50%)</span>
          <span className="font-black text-sm text-zinc-900 font-mono block mt-0.5">{urgencyScore}/100</span>
          <span className="text-[10px] text-zinc-400 font-medium">{remainingLifePct}% life left</span>
        </div>
        
        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
          <span className="text-zinc-500 block text-[10px] font-semibold uppercase">Stock Pressure (30%)</span>
          <span className="font-black text-sm text-zinc-900 font-mono block mt-0.5">{stockPressureScore}/100</span>
          <span className="text-[10px] text-zinc-400 font-medium">exp: ~{Math.round(expectedSalesUntilExpiry)} units</span>
        </div>
        
        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
          <span className="text-zinc-500 block text-[10px] font-semibold uppercase">Sales Risk (20%)</span>
          <span className="font-black text-sm text-zinc-900 font-mono block mt-0.5">{salesRiskScore}/100</span>
          <span className="text-[10px] text-zinc-400 font-medium">{urgencyLevel} speed</span>
        </div>
      </div>
    </div>
  );
}

