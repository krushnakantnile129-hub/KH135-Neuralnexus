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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format date string into strict "DD Month YYYY" format
 * e.g. "10 September 2026"
 */
export function formatDisplayDate(dateInput?: string | Date): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format expiry countdown into multi-day/hour human readable format
 * e.g. "2 Days 5 Hours Remaining" or "1 Day 5 Hours Remaining" or "5 Hours 30 Mins Remaining"
 */
export function formatExpiryCountdown(expiryInput?: string | Date): { 
  text: string; 
  isExpired: boolean; 
  days: number;
  hours: number;
  minutes: number;
  status: 'safe' | 'warning' | 'critical' | 'expired';
} {
  if (!expiryInput) {
    return { text: 'Date Not Set', isExpired: false, days: 0, hours: 0, minutes: 0, status: 'safe' };
  }

  const now = Date.now();
  let expiryMs: number;
  
  if (typeof expiryInput === 'string' && expiryInput.includes('T')) {
    expiryMs = new Date(expiryInput).getTime();
  } else if (typeof expiryInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(expiryInput)) {
    // End of day for plain YYYY-MM-DD
    const [y, m, d] = expiryInput.split('-').map(Number);
    expiryMs = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  } else {
    expiryMs = new Date(expiryInput).getTime();
  }

  const diffMs = expiryMs - now;

  if (diffMs <= 0) {
    return { text: 'EXPIRED', isExpired: true, days: 0, hours: 0, minutes: 0, status: 'expired' };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const mins = totalMinutes % 60;

  let text = '';
  if (days > 0) {
    if (remainingHours > 0) {
      text = `${days} ${days === 1 ? 'Day' : 'Days'} ${remainingHours} ${remainingHours === 1 ? 'Hour' : 'Hours'} Remaining`;
    } else {
      text = `${days} ${days === 1 ? 'Day' : 'Days'} Remaining`;
    }
  } else if (totalHours > 0) {
    if (mins > 0) {
      text = `${totalHours} ${totalHours === 1 ? 'Hour' : 'Hours'} ${mins} Mins Remaining`;
    } else {
      text = `${totalHours} ${totalHours === 1 ? 'Hour' : 'Hours'} Remaining`;
    }
  } else {
    text = `${mins} Mins Remaining`;
  }

  let status: 'safe' | 'warning' | 'critical' | 'expired' = 'safe';
  if (days >= 2) {
    status = 'safe'; // 🟢 Safe (> 48h)
  } else if (days === 1 || totalHours >= 6) {
    status = 'warning'; // 🟡 Moderate (6h - 48h)
  } else {
    status = 'critical'; // 🔴 High Urgency (< 6h)
  }

  return {
    text,
    isExpired: false,
    days,
    hours: remainingHours,
    minutes: totalMinutes,
    status,
  };
}

export function formatTimeRemaining(deadlineIso: string): { 
  text: string; 
  isExpired: boolean; 
  minutes: number;
  status: 'safe' | 'warning' | 'critical' | 'expired';
} {
  const res = formatExpiryCountdown(deadlineIso);
  return {
    text: res.text,
    isExpired: res.isExpired,
    minutes: res.minutes,
    status: res.status
  };
}

export function formatDateTimeNice(isoString: string): string {
  if (!isoString) return '';
  return formatDisplayDate(isoString);
}

export const CATEGORY_MASS_KG: Record<string, number> = {
  'Bakery': 0.35,
  'Prepared Food': 0.50,
  'Dairy': 0.50,
  'Snacks': 0.25,
  'Beverages': 0.40,
  'Other': 0.30,
  // legacy fallbacks
  'BAKERY': 0.35,
  'CAFE': 0.25,
  'RESTAURANT': 0.50,
  'CANTEEN': 0.40,
  'GROCERY': 0.60,
  'DAIRY': 0.50,
};