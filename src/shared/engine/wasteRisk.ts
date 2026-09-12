import { RiskInput, RiskEvaluationResult, RiskLevel } from '../types';

/**
 * Enhanced Explainable Waste Risk Engine
 * 
 * Formula:
 * W = clamp[0, 100]( 0.40 * S_time + 0.35 * S_stock + 0.25 * S_velocity - 0.25 * S_discount )
 */
export function evaluateWasteRisk(input: RiskInput): RiskEvaluationResult {
  const now = Date.now();
  const deadlineMs = new Date(input.deadlineIso).getTime();
  const diffMs = deadlineMs - now;
  const remainingMinutes = Math.round(diffMs / 60000);
  const remainingHours = Math.max(0.2, remainingMinutes / 60);

  // Time remaining string formatting
  let timeRemainingFormatted = '0m';
  let windowStatus: 'safe' | 'warning' | 'critical' | 'expired' = 'safe';

  if (diffMs <= 0 || remainingMinutes <= 0) {
    timeRemainingFormatted = 'Expired';
    windowStatus = 'expired';
  } else {
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    if (hours > 0 && mins > 0) {
      timeRemainingFormatted = `${hours}h ${mins}m`;
    } else if (hours > 0) {
      timeRemainingFormatted = `${hours}h`;
    } else {
      timeRemainingFormatted = `${mins}m`;
    }

    if (remainingMinutes > 180) {
      windowStatus = 'safe'; // 🟢 > 3h
    } else if (remainingMinutes >= 60) {
      windowStatus = 'warning'; // 🟡 1h - 3h
    } else {
      windowStatus = 'critical'; // 🔴 < 1h
    }
  }

  // 1. Time Urgency Vector S_time (w_t = 0.40)
  let sTime = 30;
  if (remainingMinutes <= 0) {
    sTime = 100;
  } else if (remainingMinutes <= 60) {
    sTime = 90;
  } else if (remainingMinutes <= 120) {
    sTime = 65;
  } else if (remainingMinutes <= 180) {
    sTime = 45;
  } else {
    sTime = Math.min(100, Math.max(0, Math.round((1 - remainingMinutes / 360) * 100)));
  }

  // 2. Volume Overhang Vector S_stock (w_q = 0.35)
  const velRates = { LOW: 1.5, MEDIUM: 3.5, HIGH: 6.0 };
  const nominalRate = velRates[input.salesVelocity] || 2.5;
  const effectiveHours = Math.max(0.5, remainingHours);
  const capacity = nominalRate * effectiveHours;
  const sStock = Math.min(100, Math.max(0, Math.round((input.quantity / capacity) * 50)));

  // 3. Footfall Penalty Vector S_velocity (w_v = 0.25)
  const velocityWeights = { LOW: 90, MEDIUM: 50, HIGH: 15 };
  const sVelocity = velocityWeights[input.salesVelocity] ?? 50;

  // Baseline Risk (excluding price discount)
  const baselineRisk = (0.40 * sTime) + (0.35 * sStock) + (0.25 * sVelocity);

  // Derive Recommended Markdown D_rec
  let recDiscountPct = 0.20;
  if (baselineRisk >= 75) {
    recDiscountPct = 0.50; // 50% discount for critical/high risk
  } else if (baselineRisk >= 50) {
    recDiscountPct = 0.333; // 33.3% discount
  } else if (baselineRisk >= 35) {
    recDiscountPct = 0.25;
  } else {
    recDiscountPct = 0.20;
  }

  const recommendedPrice = Math.max(
    Math.round(input.originalPrice * 0.20),
    Math.round(input.originalPrice * (1 - recDiscountPct))
  );

  // 4. Price Elasticity Credit Vector S_discount (w_d = 0.25)
  const discountRatio = Math.max(0, (input.originalPrice - input.selectedPrice) / input.originalPrice);
  const sDiscount = discountRatio * 100;
  const discountCredit = 0.25 * sDiscount;

  const rawScore = baselineRisk - discountCredit;
  const wasteRiskScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Risk level mapping
  let riskLevel: RiskLevel = 'Low';
  if (wasteRiskScore >= 80) {
    riskLevel = 'Critical';
  } else if (wasteRiskScore >= 65) {
    riskLevel = 'High';
  } else if (wasteRiskScore >= 40) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  // Concrete Explainable Reasons List (User Requirement)
  const reasons: string[] = [];
  reasons.push(`${input.quantity} units remaining in inventory`);

  if (input.salesVelocity === 'LOW') {
    reasons.push('Low sales velocity (< 2 units/hr)');
  } else if (input.salesVelocity === 'MEDIUM') {
    reasons.push('Moderate sales velocity (2–5 units/hr)');
  } else {
    reasons.push('High sales velocity (> 5 units/hr)');
  }

  if (remainingMinutes <= 0) {
    reasons.push('Selling deadline has expired');
  } else if (remainingMinutes < 60) {
    reasons.push(`Only ${timeRemainingFormatted} remaining before end-of-sale deadline`);
  } else {
    reasons.push(`${timeRemainingFormatted} remaining in selling horizon`);
  }

  if (input.selectedPrice > recommendedPrice) {
    reasons.push(`Current price (₹${input.selectedPrice}) is relatively high compared to suggested (₹${recommendedPrice})`);
  } else if (input.selectedPrice < recommendedPrice) {
    reasons.push(`Deep discount (₹${input.selectedPrice}) significantly boosts clearance probability`);
  } else {
    reasons.push(`Price is calibrated to optimal market clearance benchmark (₹${recommendedPrice})`);
  }

  const explanation = `${input.quantity} units remain with ${timeRemainingFormatted} left under ${input.salesVelocity} footfall velocity.`;

  let warningNotice: string | undefined;
  if (input.selectedPrice > recommendedPrice) {
    const diff = Math.round(((input.selectedPrice - recommendedPrice) / input.originalPrice) * 30);
    warningNotice = `Selected price (₹${input.selectedPrice}) is higher than suggested (₹${recommendedPrice}). Higher price decreases estimated sell-through probability (Risk rises by +${Math.max(1, diff)} pts).`;
  }

  return {
    wasteRiskScore,
    riskLevel,
    recommendedPrice,
    recommendedDiscountPct: Math.round(recDiscountPct * 100),
    explanation,
    reasons,
    warningNotice,
    timeRemainingMinutes: remainingMinutes,
    timeRemainingFormatted,
    windowStatus,
    subScores: {
      sTime,
      sStock,
      sVelocity,
      sDiscount: Math.round(discountCredit),
      baselineRisk: Math.round(baselineRisk),
    }
  };
}

export interface MultiFactorPricingInput {
  originalPrice: number;
  hoursUntilExpiry: number;
  totalShelfLifeHours?: number; // default: 12
  stockRemaining: number;
  unitsSoldSoFar?: number; // default: 0
}

export interface MultiFactorPricingResult {
  urgencyScore: number;
  stockPressureScore: number;
  velocityDeficitScore: number;
  compositeScore: number;
  wasteRiskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  discountPct: number;
  recommendedPrice: number;
  badgeColorClass: string;
  badgeLabel: string;
}

/**
 * Multi-Factor Dynamic Pricing Engine
 * Computes waste risk score and recommended clearance price based on:
 * - Time Urgency Score (w_u = 0.45)
 * - Stock Pressure Score (w_s = 0.30)
 * - Velocity Deficit Score (w_v = 0.25)
 */
export function calculateRecommendedPrice(input: MultiFactorPricingInput): MultiFactorPricingResult {
  const originalPrice = Math.max(5, input.originalPrice || 0);
  const totalShelfLifeHours = input.totalShelfLifeHours && input.totalShelfLifeHours > 0 ? input.totalShelfLifeHours : 12;
  const hoursUntilExpiry = Math.max(0.01, input.hoursUntilExpiry);
  const stockRemaining = Math.max(1, input.stockRemaining);
  const unitsSoldSoFar = Math.max(0, input.unitsSoldSoFar || 0);

  // a. Time Urgency Score (0-100)
  const urgencyScore = Math.min(100, Math.max(0, (1 - (hoursUntilExpiry / totalShelfLifeHours)) * 100));

  // b. Stock Pressure Score (0-100)
  const stockPressureScore = stockRemaining > 10 ? 90 : (stockRemaining >= 5 ? 60 : 30);

  // c. Velocity Deficit Score (0-100)
  const hoursElapsed = Math.max(0.5, totalShelfLifeHours - hoursUntilExpiry);
  const requiredSalesRate = stockRemaining / Math.max(0.5, hoursUntilExpiry);
  const actualSalesRate = unitsSoldSoFar / Math.max(0.5, hoursElapsed);
  const velocityDeficitScore = requiredSalesRate > actualSalesRate
    ? Math.min(100, (requiredSalesRate - actualSalesRate) * 30)
    : 10;

  // d. Combined Waste Risk Score (0-100)
  const compositeScore = Math.min(100, Math.max(0, (urgencyScore * 0.45) + (stockPressureScore * 0.30) + (velocityDeficitScore * 0.25)));
  const wasteRiskScore = Math.round(compositeScore);

  // Discount Mapping & Risk Level
  let riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
  let discountPct = 20;
  let badgeColorClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  if (compositeScore <= 25) {
    riskLevel = 'Low';
    discountPct = 20;
    badgeColorClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (compositeScore <= 55) {
    riskLevel = 'Moderate';
    discountPct = 35;
    badgeColorClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
  } else if (compositeScore <= 80) {
    riskLevel = 'High';
    discountPct = 55;
    badgeColorClass = 'bg-amber-100 text-amber-900 border-amber-300';
  } else {
    riskLevel = 'Critical';
    discountPct = 70;
    badgeColorClass = 'bg-rose-100 text-rose-800 border-rose-300';
  }

  const rawRecPrice = originalPrice * (1 - discountPct / 100);
  const recommendedPrice = Math.max(Math.round(originalPrice * 0.20), Math.round(rawRecPrice));

  return {
    urgencyScore: Math.round(urgencyScore),
    stockPressureScore: Math.round(stockPressureScore),
    velocityDeficitScore: Math.round(velocityDeficitScore),
    compositeScore: Math.round(compositeScore * 10) / 10,
    wasteRiskScore,
    riskLevel,
    discountPct,
    recommendedPrice,
    badgeColorClass,
    badgeLabel: `${riskLevel} (${wasteRiskScore})`,
  };
}