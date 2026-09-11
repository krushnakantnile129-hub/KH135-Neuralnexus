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
  unit?: ProductUnit;
  
  // Pricing Information
  originalPrice: number;
  recommendedPrice: number;
  publishedPrice: number;
  discountPct: number;
  
  // Time & Expiry Information
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
  deadlineIso: string;
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
  estimatedRiskScore: number;
  riskLevel: RiskLevel;
  urgencyLevel: 'Low' | 'Medium' | 'High' | 'Critical' | 'Expired';
  recommendedPrice: number;
  recommendedDiscountPct: number;
  explanation: string;
  pricingExplanation: string;
  reasons: string[];
  warningNotice?: string;
  
  // Remaining life metrics
  remainingLifeMinutes: number;
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