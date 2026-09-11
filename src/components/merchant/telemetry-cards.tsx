"use client";

import React from 'react';
import { MerchantMetrics } from '@/shared/types';
import { formatINR } from '@/lib/utils';
import { IndianRupee, ShoppingBag, Package } from 'lucide-react';

interface Props {
  metrics: MerchantMetrics;
}

export function TelemetryCards({ metrics }: Props) {
  const cards = [
    {
      title: 'Revenue Recovered',
      value: formatINR(metrics.revenueRecovered),
      subtitle: 'Liquid cash from surplus clearance',
      icon: IndianRupee,
      color: 'text-emerald-700',
      bgLight: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      title: 'Units Sold',
      value: `${metrics.totalUnitsRescued}`,
      subtitle: `Across ${metrics.dealsPublished} published listing${metrics.dealsPublished !== 1 ? 's' : ''}`,
      icon: ShoppingBag,
      color: 'text-blue-700',
      bgLight: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      title: 'Sold-Out Deals',
      value: `${metrics.dealsSoldOut}`,
      subtitle: `Out of ${metrics.dealsPublished} total deal${metrics.dealsPublished !== 1 ? 's' : ''} published`,
      icon: Package,
      color: 'text-amber-700',
      bgLight: 'bg-amber-50',
      border: 'border-amber-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white rounded-2xl p-5 border ${card.border} shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-xl ${card.bgLight} flex items-center justify-center ${card.color}`}>
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
