export type StoreCategory = 
  | 'Bakery'
  | 'Prepared Food'
  | 'Dairy'
  | 'Snacks'
  | 'Beverages'
  | 'Other'
  | 'BAKERY'
  | 'DAIRY'
  | 'PREPARED_FOOD'
  | 'SNACKS'
  | 'BEVERAGES'
  | 'RESTAURANT'
  | 'CANTEEN'
  | 'CAFE'
  | 'GROCERY'
  | 'OTHER';

export type ProductUnit = 'pieces' | 'kg' | 'litres' | 'packs' | 'plates' | 'portions' | 'boxes';

export type SalesVelocity = 'LOW' | 'MEDIUM' | 'HIGH';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type DealStatus = 'ACTIVE' | 'SOLD_OUT' | 'EXPIRED' | 'CANCELLED';

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  category: StoreCategory;
  streetAddress: string;
  latitude: number;
  longitude: number;
  phoneContact: string;
  isActive: boolean;
  openingHours?: string;
  imageUrl?: string;
  rating?: number;
  createdAt: string;
}

export interface DealClaim {
  id: string;
  dealId: string;
  claimToken: string;
  productName: string;
  storeName: string;
  storeAddress: string;
  quantity: number;
  discountedPrice: number;
  claimedAt: string;
  expiresAt: string;
  status: 'RESERVED' | 'COLLECTED' | 'EXPIRED';
}

export interface Deal {
  id: string;
  storeId: string;
  storeName: string;
  storeCategory: StoreCategory;
  storeAddress: string;
  latitude: number;
  longitude: number;
  phoneContact: string;
  
  // Product Information
  productName: string;
  category: StoreCategory;
  description?: string;
  imageUrl?: string;
  initialUnits: number;
  remainingUnits: number;
  soldUnits: number;
  claimedUnits?: number;
  unit?: ProductUnit;
  
  // Pricing Information
  originalPrice: number;
  recommendedPrice: number;
  publishedPrice: number;
  discountPct: number;
  
  // Date & Expiry Information (DD Month YYYY)
  manufacturingDate?: string; // YYYY-MM-DD
  manufacturingDateFormatted?: string; // e.g. 10 September 2026
  expiryDate?: string; // YYYY-MM-DD or ISO
  expiryDateFormatted?: string; // e.g. 12 September 2026
  expiryCountdownFormatted?: string; // e.g. 1 Day 5 Hours Remaining
  isExpired?: boolean;
  
  // Legacy / granular time support
  prepDate?: string;
  prepTime?: string;
  prepDateTimeIso?: string;
  bestBeforeDate?: string;
  bestBeforeTime?: string;
  expiryDateTime?: string;
  deadline: string; // ISO Selling Deadline
  remainingLifeFormatted?: string;
  remainingLifePct?: number;
  
  // Sales & Risk Information
  salesVelocity: SalesVelocity;
  salesVelocityNumeric?: number; // e.g. 2 units/hour
  unitsSoldToday?: number;
  expectedDemand?: number;
  wasteRiskScore: number;
  wasteRiskPercentage?: number; // e.g. 86
  estimatedRiskScore?: number;
  riskLevel?: RiskLevel;
  urgencyLevel?: 'Low' | 'Medium' | 'High' | 'Critical' | 'Expired';
  riskReasons?: string[];
  
  status: DealStatus;
  freshnessTag?: string;
  createdAt: string;
  updatedAt: string;
  distanceMeters?: number;
}

export interface RiskInput {
  quantity: number;
  originalPrice: number;
  selectedPrice: number;
  deadlineIso?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  salesVelocity: SalesVelocity;
  salesVelocityNumeric?: number;
  unitsSoldToday?: number;
  expectedDemand?: number;
  prepDate?: string;
  prepTime?: string;
  prepDateTimeIso?: string;
  category?: StoreCategory;
}

export interface RiskEvaluationResult {
  wasteRiskScore: number;
  wasteRiskPercentage: number;
  estimatedRiskScore: number;
  riskLevel: RiskLevel;
  urgencyLevel: 'Low' | 'Medium' | 'High' | 'Critical' | 'Expired';
  recommendedPrice: number;
  recommendedDiscountPct: number;
  explanation: string;
  pricingExplanation: string;
  reasons: string[];
  primaryReason: string;
  warningNotice?: string;
  
  // Date & Remaining life metrics
  manufacturingDateFormatted: string;
  expiryDateFormatted: string;
  expiryCountdownFormatted: string;
  isExpired: boolean;
  remainingLifeMinutes: number;
  remainingLifeDays: number;
  totalLifeDays: number;
  remainingLifeFormatted: string;
  timeRemainingFormatted?: string;
  remainingLifePct: number;
  totalLifeMinutes: number;
  windowStatus: 'safe' | 'warning' | 'critical' | 'expired';
  
  // Subscore breakdown
  urgencyScore: number; // 50%
  stockPressureScore: number; // 30%
  salesRiskScore: number; // 20%
  expectedSalesUntilExpiry: number;
  stockPressureRatio: number;
  
  subScores?: {
    sTime: number;
    sStock: number;
    sVelocity: number;
    sDiscount: number;
    baselineRisk: number;
  };
}

export interface MerchantMetrics {
  revenueRecovered: number;
  diversionWeightKg: number;
  avoidedCo2eKg: number;
  rescueConversionRatio: number;
  dealsPublished: number;
  dealsSoldOut: number;
  totalUnitsRescued: number;
}