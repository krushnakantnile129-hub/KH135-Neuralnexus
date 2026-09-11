"use client";

import React from 'react';
import { RiskEvaluationResult } from '@/shared/types';
import { AlertTriangle, CheckCircle2, Flame, Info } from 'lucide-react';

interface Props {
  evaluation: RiskEvaluationResult;
}

export function RiskMeter({ evaluation }: Props) {
  const { wasteRiskScore, riskLevel, explanation, warningNotice, subScores } = evaluation;

  // Determine colors based on waste risk score
  const getBadgeClass = () => {
    if (wasteRiskScore >= 70) {
      return 'bg-rose-500/10 text-rose-700 border-rose-300';
    }
    if (wasteRiskScore >= 40) {
      return 'bg-amber-500/10 text-amber-700 border-amber-300';
    }
    return 'bg-emerald-500/10 text-emerald-700 border-emerald-300';
  };

  const getMeterColor = () => {
    if (wasteRiskScore >= 70) return 'bg-rose-600';
    if (wasteRiskScore >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-sm text-zinc-900">Explainable Waste Risk Engine</h3>
        </div>
        <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full border ${getBadgeClass()}`}>
          {wasteRiskScore}/100 • {riskLevel} RISK
        </span>
      </div>

      {/* Risk Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200">
          <div
            className={`h-full rounded-full transition-all duration-150 ${getMeterColor()}`}
            style={{ width: `${Math.max(4, wasteRiskScore)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
          <span>0 (Safe Low Risk)</span>
          <span>40 (Moderate)</span>
          <span>70 (Critical Risk)</span>
          <span>100</span>
        </div>
      </div>

      {/* Natural Language Explanation Box (PRD US-02 / SRS FR-ENG) */}
      <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-700 space-y-1.5">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="font-medium">{explanation}</span>
        </div>

        {warningNotice && (
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-start gap-1.5 animate-in fade-in">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>{warningNotice}</span>
          </div>
        )}
      </div>

      {/* Subscores Vector Transparency (SRS 07) */}
      {subScores && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-zinc-100 text-[11px]">
          <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
            <span className="text-zinc-400 block text-[10px]">Time Urgency (40%)</span>
            <span className="font-bold text-zinc-800 font-mono">{subScores.sTime} pts</span>
          </div>
          <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
            <span className="text-zinc-400 block text-[10px]">Batch Volume (35%)</span>
            <span className="font-bold text-zinc-800 font-mono">{subScores.sStock} pts</span>
          </div>
          <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
            <span className="text-zinc-400 block text-[10px]">Velocity Penalty (25%)</span>
            <span className="font-bold text-zinc-800 font-mono">{subScores.sVelocity} pts</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="text-emerald-700 block text-[10px]">Discount Credit</span>
            <span className="font-bold text-emerald-800 font-mono">-{Math.round(subScores.sDiscount)} pts</span>
          </div>
        </div>
      )}
    </div>
  );
}
