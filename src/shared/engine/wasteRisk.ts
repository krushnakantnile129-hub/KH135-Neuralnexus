import { RiskInput, RiskEvaluationResult } from '../types';

/**
 * Waste Risk Engine & Mathematical Scoring (FR-ENG / SAD 11 / PRD 07)
 * 
 * Formula:
 * W = clamp[0,100]( w_t * S_time + w_q * S_stock + w_v * S_velocity - w_d * S_discount )
 * 
 * Weights:
 * w_t = 0.40 (Time Urgency)
 * w_q = 0.35 (Volume Overhang)
 * w_v = 0.25 (Footfall Penalty)
 * w_d = 0.25 (Price Elasticity Credit)
 */
export function evaluateWasteRisk(input: RiskInput): RiskEvaluationResult {
  const now = Date.now();
  const deadlineMs = new Date(input.deadlineIso).getTime();
  const remainingMinutes = Math.max(1, Math.round((deadlineMs - now) / 60000));
  const remainingHours = Math.max(0.5, remainingMinutes / 60);

  // 1. Time Urgency Vector S_time (w_t = 0.40)
  // Inverse non-linear decay: <= 60m => 90; 60m-120m => 65; else continuous/30
  let sTime = 30;
  if (remainingMinutes <= 60) {
    sTime = 90;
  } else if (remainingMinutes <= 120) {
    sTime = 65;
  } else {
    sTime = Math.min(100, Math.max(0, Math.round((1 - remainingMinutes / 240) * 100)));
  }

  // 2. Volume Overhang Vector S_stock (w_q = 0.35)
  // Capacity clearance rate by velocity bucket: LOW = 1.5/hr, MED = 3.5/hr, HIGH = 6.0/hr
  const velocityRates = { LOW: 1.5, MEDIUM: 3.5, HIGH: 6.0 };
  const nominalRate = velocityRates[input.salesVelocity] || 2.5;
  const capacity = nominalRate * remainingHours;
  const sStock = Math.min(100, Math.max(0, Math.round((input.quantity / capacity) * 50)));

  // 3. Footfall Penalty Vector S_velocity (w_v = 0.25)
  const velocityWeights = { LOW: 90, MEDIUM: 50, HIGH: 15 };
  const sVelocity = velocityWeights[input.salesVelocity] ?? 50;

  // Baseline Risk (excluding price discount effects)
  const baselineRisk = (0.40 * sTime) + (0.35 * sStock) + (0.25 * sVelocity);

  // Derive Recommended Markdown D_rec
  let recDiscountPct = 0.20;
  if (baselineRisk >= 70) {
    recDiscountPct = 0.50; // 50% markdown for high threat
  } else if (baselineRisk >= 40) {
    recDiscountPct = 0.333; // 33.3% clearance markdown
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

  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 
    wasteRiskScore >= 70 ? 'HIGH' : wasteRiskScore >= 40 ? 'MEDIUM' : 'LOW';

  const explanation = `${input.quantity} units remain with only ${remainingMinutes} minutes under ${input.salesVelocity} footfall velocity.`;

  let warningNotice: string | undefined;
  if (input.selectedPrice > recommendedPrice) {
    const diff = Math.round(((input.selectedPrice - recommendedPrice) / input.originalPrice) * 30);
    warningNotice = `Selected price (?${input.selectedPrice}) is higher than suggested (?${recommendedPrice}). Higher price decreases estimated sell-through probability (Risk rises by +${Math.max(1, diff)} pts).`;
  }

  return {
    wasteRiskScore,
    riskLevel,
    recommendedPrice,
    recommendedDiscountPct: Math.round(recDiscountPct * 100),
    explanation,
    warningNotice,
    subScores: {
      sTime,
      sStock,
      sVelocity,
      sDiscount: Math.round(discountCredit),
      baselineRisk: Math.round(baselineRisk),
    }
  };
}
