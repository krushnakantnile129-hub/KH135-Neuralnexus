import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTimeRemaining(deadlineIso: string): { text: string; isExpired: boolean; minutes: number } {
  const now = Date.now();
  const deadlineMs = new Date(deadlineIso).getTime();
  const diffMs = deadlineMs - now;

  if (diffMs <= 0) {
    return { text: 'EXPIRED', isExpired: true, minutes: 0 };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours > 0) {
    return {
      text: `${hours}h ${mins}m left`,
      isExpired: false,
      minutes: totalMinutes,
    };
  }
  return {
    text: `${mins}m left`,
    isExpired: false,
    minutes: totalMinutes,
  };
}

/**
 * Standard category nominal mass per unit in kg
 */
export const CATEGORY_MASS_KG: Record<string, number> = {
  BAKERY: 0.35,
  CAFE: 0.25,
  RESTAURANT: 0.50,
  CANTEEN: 0.40,
  GROCERY: 0.60,
};
