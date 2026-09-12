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

export function formatTimeRemaining(deadlineIso: string): { 
  text: string; 
  isExpired: boolean; 
  minutes: number;
  status: 'safe' | 'warning' | 'critical' | 'expired';
} {
  const now = Date.now();
  const deadlineMs = new Date(deadlineIso).getTime();
  const diffMs = deadlineMs - now;

  if (diffMs <= 0) {
    return { text: 'EXPIRED', isExpired: true, minutes: 0, status: 'expired' };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  let text = '';
  if (hours > 0 && mins > 0) {
    text = `${hours}h ${mins}m left`;
  } else if (hours > 0) {
    text = `${hours}h left`;
  } else {
    text = `${mins}m left`;
  }

  let status: 'safe' | 'warning' | 'critical' | 'expired' = 'safe';
  if (totalMinutes > 180) {
    status = 'safe'; // 🟢 Safe selling window (> 3 hours)
  } else if (totalMinutes >= 60) {
    status = 'warning'; // 🟡 Selling deadline approaching (1h - 3h)
  } else {
    status = 'critical'; // 🔴 Deadline approaching (< 1h)
  }

  return {
    text,
    isExpired: false,
    minutes: totalMinutes,
    status,
  };
}

export function formatDateTimeNice(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (isToday) {
    return `Today, ${timeStr}`;
  }
  return `${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}, ${timeStr}`;
}