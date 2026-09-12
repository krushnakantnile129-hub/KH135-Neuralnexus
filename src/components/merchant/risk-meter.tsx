"use client";

import React from 'react';
import { RiskEvaluationResult } from '@/shared/types';
import { AlertTriangle, CheckCircle2, Flame, Info, Clock, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  evaluation: RiskEvaluationResult;
}

export function RiskMeter({ evaluation }: Props) {
  const { wasteRiskScore, riskLevel, explanation, reasons, warningNotice, subScores, timeRemainingFormatted, windowStatus } = evaluation;

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
    if (wasteRiskScore >= 80) return 'bg-rose-600';
    if (wasteRiskScore >= 65) return 'bg-orange-500';
    if (wasteRiskScore >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getWindowBadge = () => {
    switch (windowStatus) {
      case 'safe':
        return {
          icon: '🟢',
          text: `Safe selling window (${timeRemainingFormatted})`,
          cls: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        };
      case 'warning':
        return {
          icon: '🟡',
          text: `Approaching expiry (${timeRemainingFormatted})`,
          cls: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'critical':
        return {
          icon: '🔴',
          text: `Critical risk (${timeRemainingFormatted})`,
          cls: 'bg-rose-50 text-rose-800 border-rose-200'
        };
      case 'expired':
      default:
        return {
          icon: '⛔',
          text: 'Selling horizon expired',
          cls: 'bg-zinc-100 text-zinc-700 border-zinc-300'
        };
    }
  };

  const winBadge = getWindowBadge();

  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-sm text-zinc-900">Explainable Waste Risk Engine</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full border ${getBadgeClass()}`}>
            {wasteRiskScore}/100 • {riskLevel} Risk
          </span>
        </div>
      </div>

      {/* Selling Window Status Indicator */}
      <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${winBadge.cls}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">{winBadge.icon}</span>
          <span>{winBadge.text}</span>
        </div>
        <span className="text-[11px] font-mono font-bold uppercase">
          {windowStatus === 'safe' ? '> 3h Safe' : windowStatus === 'warning' ? '1h–3h Warning' : '< 1h Urgent'}
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
          <span>0 (Low Risk)</span>
          <span>40 (Medium)</span>
          <span>65 (High)</span>
          <span>80+ (Critical)</span>
        </div>
      </div>

      {/* Concrete Explainable Reasons List */}
      {reasons && reasons.length > 0 && (
        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
          <div className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Why this score? (Explainability Factors)</span>
          </div>
          <ul className="space-y-1 text-xs text-zinc-600 pl-4 list-disc">
            {reasons.map((r, idx) => (
              <li key={idx} className="leading-snug">{r}</li>
            ))}
          </ul>
        </div>
      )}

      {warningNotice && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{warningNotice}</span>
        </div>
      )}

      {/* Subscores Vector Transparency */}
      {subScores && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-zinc-100 text-[11px]">
          <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
            <span className="text-zinc-400 block text-[10px]">Time Urgency (40%)</span>
            <span className="font-bold text-zinc-800 font-mono">{subScores.sTime} pts</span>
          </div>
          <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
            <span className="text-zinc-400 block text-[10px]">Batch Stock (35%)</span>
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
