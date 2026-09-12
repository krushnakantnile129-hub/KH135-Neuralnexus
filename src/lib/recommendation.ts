import { Deal } from '@/shared/types';
import { calculateHaversineDistance } from './geo';

export type UrgencyLevel = 'CRITICAL' | 'URGENT' | 'SAFE' | 'EXPIRED';

export interface UrgencyInfo {
  level: UrgencyLevel;
  label: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  markerBg: string;
  markerBorder: string;
  glowClass: string;
  remainingMinutes: number;
  remainingHours: number;
  remainingLifePct: number;
  isExpired: boolean;
}

/**
 * Evaluates urgency based on remaining shelf life and percentage
 * - 🔴 Critical: <= 2 hours or <= 10% remaining life
 * - 🟠 Urgent: 2 - 6 hours or 10% - 25% remaining life
 * - 🟢 Safe: > 6 hours or > 25% remaining life
 */
export function getDealUrgency(deal: Deal): UrgencyInfo {
  const now = Date.now();
  
  let expiryMs: number;
  if (deal.expiryDate && deal.expiryDate.includes('T')) {
    expiryMs = new Date(deal.expiryDate).getTime();
  } else if (deal.expiryDate && /^\d{4}-\d{2}-\d{2}$/.test(deal.expiryDate)) {
    const timeStr = deal.hasExpiryTime && deal.expiryTime ? deal.expiryTime : '23:59';
    expiryMs = new Date(`${deal.expiryDate}T${timeStr}:59.999`).getTime();
  } else {
    expiryMs = new Date(deal.deadline).getTime();
  }

  const diffMs = expiryMs - now;

  if (diffMs <= 0 || deal.status === 'EXPIRED') {
    return {
      level: 'EXPIRED',
      label: 'EXPIRED',
      icon: '⚫',
      badgeBg: 'bg-zinc-800',
      badgeText: 'text-zinc-300',
      badgeBorder: 'border-zinc-700',
      markerBg: 'bg-zinc-800',
      markerBorder: 'border-zinc-600',
      glowClass: '',
      remainingMinutes: 0,
      remainingHours: 0,
      remainingLifePct: 0,
      isExpired: true,
    };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const remainingHours = totalMinutes / 60;

  // Compute total lifespan if manufacturing date is present
  let totalLifespanMs = 24 * 3600000; // default 24h fallback
  if (deal.manufacturingDate) {
    const mfgTime = deal.hasManufacturingTime && deal.manufacturingTime ? deal.manufacturingTime : '00:00';
    const mfgMs = new Date(`${deal.manufacturingDate}T${mfgTime}:00`).getTime();
    if (!isNaN(mfgMs) && expiryMs > mfgMs) {
      totalLifespanMs = expiryMs - mfgMs;
    }
  }

  const remainingLifePct = Math.min(100, Math.max(0, Math.round((diffMs / totalLifespanMs) * 100)));

  // Critical: <= 2 hours OR <= 10% remaining life
  if (remainingHours <= 2 || remainingLifePct <= 10) {
    return {
      level: 'CRITICAL',
      label: 'Critical Rescue',
      icon: '🔴',
      badgeBg: 'bg-rose-500/20',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/50',
      markerBg: 'bg-rose-600',
      markerBorder: 'border-rose-300',
      glowClass: 'shadow-lg shadow-rose-500/70 animate-pulse',
      remainingMinutes: totalMinutes,
      remainingHours,
      remainingLifePct,
      isExpired: false,
    };
  }

  // Urgent: 2 - 6 hours OR 10% - 25% remaining life
  if (remainingHours <= 6 || remainingLifePct <= 25) {
    return {
      level: 'URGENT',
      label: 'Urgent Rescue',
      icon: '🟠',
      badgeBg: 'bg-amber-500/20',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/50',
      markerBg: 'bg-amber-500',
      markerBorder: 'border-amber-300',
      glowClass: 'shadow-md shadow-amber-500/50',
      remainingMinutes: totalMinutes,
      remainingHours,
      remainingLifePct,
      isExpired: false,
    };
  }

  // Safe: > 6 hours AND > 25% remaining life
  return {
    level: 'SAFE',
    label: 'Safe Window',
    icon: '🟢',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/50',
    markerBg: 'bg-emerald-600',
    markerBorder: 'border-emerald-300',
    glowClass: 'shadow-md shadow-emerald-500/30',
    remainingMinutes: totalMinutes,
    remainingHours,
    remainingLifePct,
    isExpired: false,
  };
}

export interface BestDealEvaluation {
  deal: Deal;
  score: number;
  discountScore: number;
  urgencyScore: number;
  proximityScore: number;
  reason: string;
}

/**
 * Evaluates best deal near user using multi-factor formula:
 * Score = (0.45 * DiscountPct) + (0.35 * UrgencyScore) + (0.20 * ProximityScore)
 */
export function evaluateDealForRecommendation(
  deal: Deal,
  userLat: number,
  userLng: number
): BestDealEvaluation {
  const urgency = getDealUrgency(deal);
  
  if (urgency.isExpired) {
    return {
      deal,
      score: -1,
      discountScore: 0,
      urgencyScore: 0,
      proximityScore: 0,
      reason: 'Expired deal',
    };
  }

  const distanceM = deal.distanceMeters !== undefined
    ? deal.distanceMeters
    : calculateHaversineDistance(userLat, userLng, deal.latitude, deal.longitude);

  const distanceKm = distanceM / 1000;

  // Strict 10km cutoff
  if (distanceKm > 10) {
    return {
      deal,
      score: -1,
      discountScore: 0,
      urgencyScore: 0,
      proximityScore: 0,
      reason: 'Outside 10 KM Rescue Zone',
    };
  }

  // 1. Discount score (0 to 100)
  const discountPct = Math.min(100, Math.max(0, Math.round(((deal.originalPrice - deal.publishedPrice) / deal.originalPrice) * 100)));
  const discountScore = discountPct;

  // 2. Urgency score (0 to 100)
  let urgencyScore = 30; // default safe
  if (urgency.level === 'CRITICAL') urgencyScore = 100;
  else if (urgency.level === 'URGENT') urgencyScore = 70;

  // 3. Proximity score (0 to 100, closer is higher)
  const proximityScore = Math.max(0, Math.round((1 - distanceKm / 10) * 100));

  // Multi-factor weighted composite
  const score = Math.round(
    0.45 * discountScore +
    0.35 * urgencyScore +
    0.20 * proximityScore
  );

  const distText = distanceKm < 1 ? `${Math.round(distanceM)} m` : `${distanceKm.toFixed(1)} km`;
  const timeText = urgency.remainingHours >= 1 
    ? `${Math.round(urgency.remainingHours)}h left`
    : `${urgency.remainingMinutes}m left`;

  const reason = `${discountPct}% OFF • ${distText} away • ${urgency.label} (${timeText})`;

  return {
    deal: { ...deal, distanceMeters: distanceM },
    score,
    discountScore,
    urgencyScore,
    proximityScore,
    reason,
  };
}

/**
 * Finds top recommended deal within 10 km
 */
export function findBestDealNearMe(
  deals: Deal[],
  userLat: number,
  userLng: number
): BestDealEvaluation | null {
  const evaluated = deals
    .map((d) => evaluateDealForRecommendation(d, userLat, userLng))
    .filter((e) => e.score > 0);

  if (evaluated.length === 0) return null;

  evaluated.sort((a, b) => b.score - a.score);
  return evaluated[0];
}
