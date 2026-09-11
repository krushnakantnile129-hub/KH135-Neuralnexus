import { RiskInput, RiskEvaluationResult, RiskLevel } from '../types';

/**
 * SAVE-BITE Rule-Based Explainable Waste Risk & Pricing Engine
 * 
 * 1. Remaining Life = Expiry Date/Time − Current Date/Time
 *    Total Life = Expiry Date/Time − Prepared Date/Time
 *    Remaining Life % = clamp((Remaining Life / Total Life) * 100, 0, 100)
 * 
 * 2. Urgency Score (50% Weight):
 *    - > 50% life remaining  → Low urgency (Score: ~15-25)
 *    - 25–50% life remaining → Medium urgency (Score: ~40-55)
 *    - 10–25% life remaining → High urgency (Score: ~65-80)
 *    - < 10% life remaining  → Critical urgency (Score: ~85-95)
 *    - 0% or expired         → Expired (Score: 100)
 * 
 * 3. Stock Pressure Score (30% Weight):
 *    - Expected Sales = Sales Velocity (units/hr) × Remaining Hours
 *    - Stock Pressure Ratio = Quantity / max(Expected Sales, 1)
 *    - Stock Pressure Score = clamp(round(Stock Pressure Ratio × 50), 0, 100)
 * 
 * 4. Sales Velocity Risk Score (20% Weight):
 *    - LOW (< 2 units/hr)    → Score: 85
 *    - MEDIUM (2-5 units/hr) → Score: 50
 *    - HIGH (> 5 units/hr)   → Score: 15
 * 
 * 5. Waste Risk Score = (Urgency × 0.50) + (Stock Pressure × 0.30) + (Sales Risk × 0.20)
 *    - 0–30  → Low Risk   (Recommend 5–10% discount)
 *    - 31–60 → Medium Risk (Recommend 10–20% discount)
 *    - 61–80 → High Risk   (Recommend 20–35% discount)
 *    - 81–100 → Critical Risk (Recommend 35–50% discount)
 */
export function evaluateWasteRisk(input: RiskInput): RiskEvaluationResult {
  const now = Date.now();
  const expiryMs = new Date(input.deadlineIso).getTime();
  const remainingMs = Math.max(0, expiryMs - now);
  const remainingMinutes = Math.round(remainingMs / 60000);
  const remainingHours = Math.max(0.05, remainingMinutes / 60);

  // Derive preparation timestamp
  let prepMs: number;
  if (input.prepDateTimeIso) {
    prepMs = new Date(input.prepDateTimeIso).getTime();
  } else if (input.prepDate && input.prepTime) {
    prepMs = new Date(`${input.prepDate}T${input.prepTime}:00`).getTime();
  } else if (input.prepDate) {
    prepMs = new Date(`${input.prepDate}T08:00:00`).getTime();
  } else {
    // Default fallback: prepared 4 hours ago
    prepMs = now - (4 * 60 * 60 * 1000);
  }

  // Ensure prepMs is strictly before expiryMs
  if (isNaN(prepMs) || prepMs >= expiryMs) {
    prepMs = expiryMs - (6 * 60 * 60 * 1000); // 6 hours total window fallback
  }

  const totalLifeMs = Math.max(60000, expiryMs - prepMs);
  const totalLifeMinutes = Math.round(totalLifeMs / 60000);
  const rawRemainingLifePct = (remainingMs / totalLifeMs) * 100;
  const remainingLifePct = Math.min(100, Math.max(0, Math.round(rawRemainingLifePct)));

  // 1. Time formatting
  let timeRemainingFormatted = '0m';
  if (remainingMinutes <= 0) {
    timeRemainingFormatted = 'Expired';
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
  }

  // 2. Calculate Urgency Level & Score (50% Weight)
  let urgencyLevel: 'Low' | 'Medium' | 'High' | 'Critical' | 'Expired';
  let urgencyScore: number;
  let windowStatus: 'safe' | 'warning' | 'critical' | 'expired';

  if (remainingMinutes <= 0 || remainingLifePct <= 0) {
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
    windowStatus = remainingMinutes <= 60 ? 'critical' : 'warning';
  } else if (remainingLifePct <= 50) {
    urgencyLevel = 'Medium';
    urgencyScore = Math.min(64, Math.max(35, Math.round(65 - ((remainingLifePct - 25) / 25) * 30)));
    windowStatus = 'warning';
  } else {
    urgencyLevel = 'Low';
    urgencyScore = Math.min(34, Math.max(5, Math.round(35 - ((remainingLifePct - 50) / 50) * 30)));
    windowStatus = 'safe';
  }

  // 3. Calculate Stock Pressure Score (30% Weight)
  const velRates: Record<string, number> = { LOW: 1.5, MEDIUM: 3.5, HIGH: 6.0 };
  const effectiveVelocity = typeof input.salesVelocityNumeric === 'number' && input.salesVelocityNumeric > 0
    ? input.salesVelocityNumeric
    : (velRates[input.salesVelocity] || 2.5);

  const expectedSalesUntilExpiry = Math.max(0.1, Math.round(effectiveVelocity * remainingHours * 10) / 10);
  const stockPressureRatio = input.quantity / Math.max(expectedSalesUntilExpiry, 1);
  const stockPressureScore = Math.min(100, Math.max(0, Math.round(stockPressureRatio * 50)));

  // 4. Calculate Sales Risk Score (20% Weight)
  let salesRiskScore = 50;
  if (effectiveVelocity < 2.0) {
    salesRiskScore = 85;
  } else if (effectiveVelocity <= 5.0) {
    salesRiskScore = 50;
  } else {
    salesRiskScore = 15;
  }

  // 5. Calculate Base Waste Risk Score (0-100)
  const rawBaseRisk = (urgencyScore * 0.50) + (stockPressureScore * 0.30) + (salesRiskScore * 0.20);
  const wasteRiskScore = Math.min(100, Math.max(0, Math.round(rawBaseRisk)));

  // Risk Level Classification (SRS 0–30 Low, 31–60 Medium, 61–80 High, 81–100 Critical)
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

  // 6. Recommend Discount & Price Based on Waste Risk Score
  let recDiscountPct = 0.10;
  if (wasteRiskScore >= 81) {
    recDiscountPct = 0.45; // 45% discount for critical risk
  } else if (wasteRiskScore >= 61) {
    recDiscountPct = 0.30; // 30% discount for high risk (e.g. ₹60 -> ₹42)
  } else if (wasteRiskScore >= 31) {
    recDiscountPct = 0.20; // 20% discount for medium risk
  } else {
    recDiscountPct = 0.10; // 10% discount for low risk
  }

  const recommendedPrice = Math.max(
    Math.round(input.originalPrice * 0.20),
    Math.round(input.originalPrice * (1 - recDiscountPct))
  );

  // 7. Dynamic Estimated Risk Recalculation (Price Slider Sensitivity)
  const selectedDiscountPct = Math.max(0, (input.originalPrice - input.selectedPrice) / input.originalPrice);
  const discountDelta = selectedDiscountPct - recDiscountPct;
  const estimatedRiskScore = Math.min(100, Math.max(0, Math.round(wasteRiskScore - (discountDelta * 50))));

  // Explanatory Pricing Feedback
  let pricingExplanation = '';
  let warningNotice: string | undefined;

  if (input.selectedPrice === recommendedPrice) {
    pricingExplanation = 'Recommended Price — Calibrated to optimal market clearance benchmark.';
  } else if (input.selectedPrice > recommendedPrice) {
    pricingExplanation = `Your selected price is ₹${input.selectedPrice}. Estimated Waste Risk may increase because the discount is smaller.`;
    warningNotice = `Selected price (₹${input.selectedPrice}) is higher than recommended (₹${recommendedPrice}). Higher price decreases estimated clearance velocity (Estimated risk: ${estimatedRiskScore}/100).`;
  } else {
    pricingExplanation = `Your selected price is ₹${input.selectedPrice}. A larger discount may improve the chance of selling the remaining stock before the deadline.`;
  }

  // 8. Concrete Explainable Reasons List
  const reasons: string[] = [];
  reasons.push(`Only ${remainingLifePct}% of the product's selling life remains (${timeRemainingFormatted}).`);
  reasons.push(`${input.quantity} units are still available.`);
  if (effectiveVelocity < 2) {
    reasons.push(`Current sales velocity (${effectiveVelocity} units/hr) may not clear the remaining stock before the deadline.`);
  } else {
    reasons.push(`Sales velocity is ${effectiveVelocity} units/hr (expected sales: ~${Math.round(expectedSalesUntilExpiry)} units).`);
  }

  if (input.selectedPrice > recommendedPrice) {
    reasons.push(`Current price (₹${input.selectedPrice}) is above suggested clearance price (₹${recommendedPrice}).`);
  } else if (input.selectedPrice < recommendedPrice) {
    reasons.push(`Deep discount (₹${input.selectedPrice}) significantly improves sell-through likelihood.`);
  }

  const explanation = `Recommended ₹${recommendedPrice} (${Math.round(recDiscountPct * 100)}% off) because the product has ${riskLevel.toLowerCase()} waste risk (${wasteRiskScore}/100): only ${remainingLifePct}% of selling window remains and ${input.quantity} units are available.`;

  return {
    wasteRiskScore,
    estimatedRiskScore,
    riskLevel,
    urgencyLevel,
    recommendedPrice,
    recommendedDiscountPct: Math.round(recDiscountPct * 100),
    explanation,
    pricingExplanation,
    reasons,
    warningNotice,
    remainingLifeMinutes: remainingMinutes,
    remainingLifeFormatted: timeRemainingFormatted,
    timeRemainingFormatted,
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