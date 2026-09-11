import assert from 'node:assert';
import { evaluateWasteRisk } from '../shared/engine/wasteRisk';
import { calculateHaversineDistance, getGoogleMapsUrl, formatDistance } from '../lib/geo';

console.log('--- STARTING SAVE-BITE ACCEPTANCE SUITE ---');

// SCENARIO 1: Risk Engine Calculation & Natural Language Explanation
console.log('\n[TEST 1] SRS Scenario 1: High-Risk Sourdough Loaf Entry');
const deadline60Min = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const result1 = evaluateWasteRisk({
  quantity: 15,
  originalPrice: 120,
  selectedPrice: 120, // before markdown
  deadlineIso: deadline60Min,
  salesVelocity: 'LOW',
});

console.log('Result 1:', {
  wasteRiskScore: result1.wasteRiskScore,
  riskLevel: result1.riskLevel,
  recommendedPrice: result1.recommendedPrice,
  recommendedDiscountPct: result1.recommendedDiscountPct,
  explanation: result1.explanation,
});

assert(result1.wasteRiskScore >= 70 && result1.wasteRiskScore <= 100, 'Score W must be between 70 and 100');
assert.strictEqual(result1.riskLevel, 'HIGH', 'Risk level must be HIGH');
assert.strictEqual(result1.recommendedPrice, 60, 'Recommended price must be 60.00 (50% markdown)');
assert.strictEqual(result1.recommendedDiscountPct, 50, 'Recommended discount must be 50%');
assert(result1.explanation.includes('15 units remain with only 60 minutes under LOW footfall velocity'), 'Explanation must match format');
console.log('? Scenario 1 PASSED: Waste Risk Engine computed accurate high risk score and 50% markdown suggestion.');

// SCENARIO 2: Interactive Slider Override & Consequence Feedback
console.log('\n[TEST 2] SRS Scenario 2: Merchant Human Price Override (Veggie Club ?60 -> ?50)');
const deadline50Min = new Date(Date.now() + 50 * 60 * 1000).toISOString();
const result2Override = evaluateWasteRisk({
  quantity: 18,
  originalPrice: 60,
  selectedPrice: 50, // Human override upwards
  deadlineIso: deadline50Min,
  salesVelocity: 'LOW',
});

console.log('Result 2 (Override to ?50):', {
  wasteRiskScore: result2Override.wasteRiskScore,
  riskLevel: result2Override.riskLevel,
  recommendedPrice: result2Override.recommendedPrice,
  warningNotice: result2Override.warningNotice,
});

assert(result2Override.wasteRiskScore >= 75, 'Recalculated risk score must be high/critical');
assert(result2Override.warningNotice !== undefined, 'Warning notice must be triggered when price > recommended');
console.log('? Scenario 2 PASSED: Merchant override was preserved and amber consequence warning generated.');

// SCENARIO 3: Proximity Discovery & Navigation Handoff
console.log('\n[TEST 3] SRS Scenario 3: Proximity Discovery & Deep Link Launch');
const consumerLat = 18.5204;
const consumerLng = 73.8567;
const storeLat = 18.5255;
const storeLng = 73.8595;

const distanceMeters = calculateHaversineDistance(consumerLat, consumerLng, storeLat, storeLng);
const distanceString = formatDistance(distanceMeters);
const gmapsUrl = getGoogleMapsUrl(storeLat, storeLng, 'ABC Gourmet Bakery & Caf�');

console.log('Distance computed:', distanceMeters, 'm ->', distanceString);
console.log('Google Maps URL:', gmapsUrl);

assert(distanceMeters > 0 && distanceMeters < 1000, 'Distance must be < 1000m (in meters)');
assert(gmapsUrl.includes('api=1&destination=18.5255,73.8595'), 'Google Maps intent URL must contain destination coordinates');
console.log('? Scenario 3 PASSED: Haversine distance and Google Maps navigation intent verified.');

console.log('\n=============================================');
console.log('?? ALL FORMAL ACCEPTANCE CRITERIA PASSED! ??');
console.log('=============================================');
