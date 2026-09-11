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