"use client";

import React from 'react';
import { MerchantMetrics } from '@/shared/types';
import { formatINR } from '@/lib/utils';
import { IndianRupee, Trash2, Leaf, Target, TrendingUp, CheckCircle } from 'lucide-react';

interface Props {
  metrics: MerchantMetrics;
}

export function TelemetryCards({ metrics }: Props) {
  const cards = [
    {
      title: 'Revenue Recovered',
      value: formatINR(metrics.revenueRecovered),
      subtitle: 'Liquid cash from 100% write-off risk',
      icon: IndianRupee,
      color: 'from-emerald-500 to-teal-700',
      textColor: 'text-emerald-700',
      bgLight: 'bg-emerald-50',
    },
    {
      title: 'Landfill Diversion',
      value: `${metrics.diversionWeightKg} kg`,
      subtitle: `${metrics.totalUnitsRescued} units rescued`,
      icon: Trash2,
      color: 'from-blue-500 to-indigo-700',
      textColor: 'text-blue-700',
      bgLight: 'bg-blue-50',
    },
    {
      title: 'Avoided CO₂e Footprint',
      value: `${metrics.avoidedCo2eKg} kg`,
      subtitle: '2.5 kg CO₂e per kg food saved',
      icon: Leaf,
      color: 'from-green-600 to-emerald-800',
      textColor: 'text-green-700',
      bgLight: 'bg-green-50',
    },
    {
      title: 'Rescue Conversion Rate',
      value: `${metrics.rescueConversionRatio}%`,
      subtitle: `${metrics.dealsSoldOut} sold out / ${metrics.dealsPublished} total`,
      icon: Target,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-700',
      bgLight: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-xl ${card.bgLight} flex items-center justify-center ${card.textColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight block">
                {card.value}
              </span>
              <span className="text-[11px] text-zinc-500 font-medium mt-1 block">
                {card.subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
