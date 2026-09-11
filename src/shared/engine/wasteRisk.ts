import { RiskInput, RiskEvaluationResult, RiskLevel } from '../types';
import { formatDisplayDate, formatExpiryCountdown } from '@/lib/utils';

/**
 * ResQFood Rule-Based Explainable Waste Risk & Pricing Engine
 * 
 * Evaluates:
 * - Manufacturing date & Expiry date
 * - Remaining shelf life percentage & multi-day countdown
 * - Current stock quantity & selling velocity
 * - Original price vs discounted clearance price
 */
export function evaluateWasteRisk(input: RiskInput): RiskEvaluationResult {
  const now = Date.now();
  
  // 1. Resolve Expiry Date/Time
  let expiryMs: number;
  if (input.expiryDate) {
    if (input.expiryDate.includes('T')) {
      expiryMs = new Date(input.expiryDate).getTime();
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(input.expiryDate)) {
      const [y, m, d] = input.expiryDate.split('-').map(Number);
      expiryMs = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
    } else {
      expiryMs = new Date(input.expiryDate).getTime();
    }
  } else if (input.deadlineIso) {
    expiryMs = new Date(input.deadlineIso).getTime();
  } else {
    // Default 2 days from now
    expiryMs = now + (2 * 24 * 60 * 60 * 1000);
  }

  // 2. Resolve Manufacturing Date/Time
  let mfgMs: number;
  if (input.manufacturingDate) {
    if (input.manufacturingDate.includes('T')) {
      mfgMs = new Date(input.manufacturingDate).getTime();
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(input.manufacturingDate)) {
      const [y, m, d] = input.manufacturingDate.split('-').map(Number);
      mfgMs = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
    } else {
      mfgMs = new Date(input.manufacturingDate).getTime();
    }
  } else if (input.prepDateTimeIso) {
    mfgMs = new Date(input.prepDateTimeIso).getTime();
  } else if (input.prepDate) {
    mfgMs = new Date(`${input.prepDate}T00:00:00`).getTime();
  } else {
    // Default 2 days before expiry
    mfgMs = expiryMs - (4 * 24 * 60 * 60 * 1000);
  }

  // Safety check: if mfgMs is invalid or >= expiryMs, set default 2-day window
  if (isNaN(mfgMs) || mfgMs >= expiryMs) {
    mfgMs = expiryMs - (2 * 24 * 60 * 60 * 1000);
  }

  const remainingMs = Math.max(0, expiryMs - now);
  const remainingMinutes = Math.round(remainingMs / 60000);
  const remainingHours = Math.max(0.1, remainingMinutes / 60);
  const remainingDays = Math.round((remainingMs / (24 * 60 * 60 * 1000)) * 10) / 10;

  const totalLifeMs = Math.max(60000, expiryMs - mfgMs);
  const totalLifeMinutes = Math.round(totalLifeMs / 60000);
  const totalLifeDays = Math.round((totalLifeMs / (24 * 60 * 60 * 1000)) * 10) / 10;

  const rawRemainingLifePct = (remainingMs / totalLifeMs) * 100;
  const remainingLifePct = Math.min(100, Math.max(0, Math.round(rawRemainingLifePct)));

  // 3. Formatted Date Outputs
  const manufacturingDateFormatted = formatDisplayDate(new Date(mfgMs));
  const expiryDateFormatted = formatDisplayDate(new Date(expiryMs));
  const countdownResult = formatExpiryCountdown(new Date(expiryMs));
  const expiryCountdownFormatted = countdownResult.text;
  const isExpired = countdownResult.isExpired || remainingMinutes <= 0;

  // 4. Calculate Urgency Level & Score (50% Weight)
  let urgencyLevel: 'Low' | 'Medium' | 'High' | 'Critical' | 'Expired';
  let urgencyScore: number;
  let windowStatus: 'safe' | 'warning' | 'critical' | 'expired';

  if (isExpired || remainingLifePct <= 0) {
    urgencyLevel = 'Expired';
    urgencyScore = 100;
    windowStatus = 'expired';
  } else if (remainingLifePct < 10) {
    urgencyLevel = 'Critical';
    urgencyScore = Math.min(100, Math.max(85, Math.round(100 - remainingLifePct * 1.5)));
    windowStatus = 'critical';
  } else if (remainingLifePct <= 25) {
    urgencyLevel = 'High';
    urgencyScore = Math.min(84, Math.max(65, Math.round(85 - ((remainingLifePct - 10) / 15) * 20)));
    windowStatus = remainingHours <= 12 ? 'critical' : 'warning';
  } else if (remainingLifePct <= 50) {
    urgencyLevel = 'Medium';
    urgencyScore = Math.min(64, Math.max(35, Math.round(65 - ((remainingLifePct - 25) / 25) * 30)));
    windowStatus = 'warning';
  } else {
    urgencyLevel = 'Low';
    urgencyScore = Math.min(34, Math.max(5, Math.round(35 - ((remainingLifePct - 50) / 50) * 30)));
    windowStatus = 'safe';
  }

  // 5. Calculate Stock Pressure Score (30% Weight)
  const velRates: Record<string, number> = { LOW: 1.5, MEDIUM: 3.5, HIGH: 6.0 };
  const effectiveVelocity = typeof input.salesVelocityNumeric === 'number' && input.salesVelocityNumeric > 0
    ? input.salesVelocityNumeric
    : (velRates[input.salesVelocity] || 2.5);

  const expectedSalesUntilExpiry = Math.max(0.1, Math.round(effectiveVelocity * remainingHours * 10) / 10);
  const stockPressureRatio = input.quantity / Math.max(expectedSalesUntilExpiry, 1);
  const stockPressureScore = Math.min(100, Math.max(0, Math.round(stockPressureRatio * 50)));

  // 6. Calculate Sales Risk Score (20% Weight)
  let salesRiskScore = 50;
  if (effectiveVelocity < 2.0) {
    salesRiskScore = 85;
  } else if (effectiveVelocity <= 5.0) {
    salesRiskScore = 50;
  } else {
    salesRiskScore = 15;
  }

  // 7. Base Waste Risk Score (0-100)
  const rawBaseRisk = (urgencyScore * 0.50) + (stockPressureScore * 0.30) + (salesRiskScore * 0.20);
  const wasteRiskScore = isExpired ? 100 : Math.min(100, Math.max(0, Math.round(rawBaseRisk)));

  // Risk Level Classification (0–30 Low, 31–60 Medium, 61–80 High, 81–100 Critical)
  let riskLevel: RiskLevel = 'Low';
  if (wasteRiskScore >= 81) {
    riskLevel = 'Critical';
  } else if (wasteRiskScore >= 61) {
    riskLevel = 'High';
  } else if (wasteRiskScore >= 31) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  // 8. Recommend Discount & Price Based on Waste Risk Score
  // Avoids unnecessary discounts when sufficient shelf life remains
  let recDiscountPct = 0.10;
  if (wasteRiskScore >= 81) {
    recDiscountPct = 0.45; // 45% - 50% discount for critical risk
  } else if (wasteRiskScore >= 61) {
    recDiscountPct = 0.35; // 35% discount for high risk (e.g. ₹60 -> ₹35-₹39)
  } else if (wasteRiskScore >= 31) {
    recDiscountPct = 0.20; // 20% discount for medium risk
  } else {
    recDiscountPct = 0.10; // 10% discount for low risk / plenty of shelf life
  }

  const recommendedPrice = Math.max(
    Math.round(input.originalPrice * 0.20),
    Math.round(input.originalPrice * (1 - recDiscountPct))
  );

  // 9. Dynamic Estimated Risk Recalculation
  const selectedDiscountPct = Math.max(0, (input.originalPrice - input.selectedPrice) / input.originalPrice);
  const discountDelta = selectedDiscountPct - recDiscountPct;
  const estimatedRiskScore = isExpired ? 100 : Math.min(100, Math.max(0, Math.round(wasteRiskScore - (discountDelta * 50))));

  // Explanatory Pricing Feedback
  let pricingExplanation = '';
  let warningNotice: string | undefined;

  if (input.selectedPrice === recommendedPrice) {
    pricingExplanation = 'Recommended Price — Calibrated to maximize sales velocity while protecting merchant revenue.';
  } else if (input.selectedPrice > recommendedPrice) {
    pricingExplanation = `Selected price is ₹${input.selectedPrice}. Lower discounts may slow down clearance velocity as expiry nears.`;
    warningNotice = `Price ₹${input.selectedPrice} is higher than recommended ₹${recommendedPrice}. Estimated waste risk: ${estimatedRiskScore}%.`;
  } else {
    pricingExplanation = `Selected price is ₹${input.selectedPrice}. A higher discount accelerates inventory clearance before expiry.`;
  }

  // 10. Primary & Detail Explainable Reasons
  let primaryReason = 'Sufficient shelf life remaining with balanced stock.';
  if (isExpired) {
    primaryReason = 'Product has reached its expiry date.';
  } else if (wasteRiskScore >= 81) {
    primaryReason = 'High stock remaining with limited shelf life.';
  } else if (stockPressureScore >= 70) {
    primaryReason = 'High inventory volume relative to current sales velocity.';
  } else if (remainingLifePct <= 25) {
    primaryReason = 'Product is approaching expiry date soon.';
  } else if (effectiveVelocity < 2) {
    primaryReason = 'Low sales velocity indicates clearance discount is recommended.';
  }

  const reasons: string[] = [];
  reasons.push(`Expires on ${expiryDateFormatted} (${expiryCountdownFormatted}).`);
  reasons.push(`Only ${remainingLifePct}% of shelf life remains.`);
  reasons.push(`${input.quantity} units remaining in stock.`);
  if (effectiveVelocity < 2) {
    reasons.push(`Sales velocity (${effectiveVelocity} units/hr) is slower than optimal for this stock volume.`);
  } else {
    reasons.push(`Sales velocity is ${effectiveVelocity} units/hr (expected demand: ~${Math.round(expectedSalesUntilExpiry)} units).`);
  }

  const explanation = `Waste Risk: ${wasteRiskScore}% (${riskLevel}) — ${primaryReason}`;

  return {
    wasteRiskScore,
    wasteRiskPercentage: wasteRiskScore,
    estimatedRiskScore,
    riskLevel,
    urgencyLevel,
    recommendedPrice,
    recommendedDiscountPct: Math.round(recDiscountPct * 100),
    explanation,
    pricingExplanation,
    reasons,
    primaryReason,
    warningNotice,
    manufacturingDateFormatted,
    expiryDateFormatted,
    expiryCountdownFormatted,
    isExpired,
    remainingLifeMinutes: remainingMinutes,
    remainingLifeDays: remainingDays,
    totalLifeDays,
    remainingLifeFormatted: expiryCountdownFormatted,
    timeRemainingFormatted: expiryCountdownFormatted,
    remainingLifePct,
    totalLifeMinutes,
    windowStatus,
    urgencyScore,
    stockPressureScore,
    salesRiskScore,
    expectedSalesUntilExpiry,
    stockPressureRatio: Math.round(stockPressureRatio * 100) / 100,
    subScores: {
      sTime: Math.round(urgencyScore * 0.50),
      sStock: Math.round(stockPressureScore * 0.30),
      sVelocity: Math.round(salesRiskScore * 0.20),
      sDiscount: Math.round(discountDelta * 50),
      baselineRisk: wasteRiskScore,
    }
  };
}