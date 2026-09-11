"use client";

import React from 'react';
import { StoreCategory } from '@/shared/types';

interface Props {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  counts: Record<string, number>;
}

export function CategoryFilter({ selectedCategory, onSelectCategory, counts }: Props) {
  const categories = [
    { id: 'ALL', label: 'All Deals', icon: '⚡' },
    { id: 'BAKERY', label: 'Bakeries', icon: '🥐' },
    { id: 'CAFE', label: 'Cafés', icon: '☕' },
    { id: 'RESTAURANT', label: 'Restaurants', icon: '🍕' },
    { id: 'CANTEEN', label: 'Canteens', icon: '🍱' },
    { id: 'GROCERY', label: 'Groceries', icon: '🥗' },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
      {categories.map((cat) => {
        const count = cat.id === 'ALL' 
          ? Object.values(counts).reduce((a, b) => a + b, 0) 
          : (counts[cat.id] || 0);
        const isActive = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-zinc-100 text-zinc-600'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
