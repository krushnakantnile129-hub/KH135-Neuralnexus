export type UserRole = 'CONSUMER' | 'SHOPKEEPER' | 'ADMIN';

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface MerchantKyc {
  age: number;
  dob: string;
  state: string; // Must be Maharashtra
  city: string;
  streetAddress: string;
  govtIdType: 'AADHAAR' | 'PAN' | 'PASSPORT';
  govtIdNumber: string;
  fssaiLicense: string;
  gstin?: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  verifiedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  storeId?: string;
  authProvider?: 'EMAIL' | 'GOOGLE';
  kycStatus?: KycStatus;
  kycData?: MerchantKyc;
}

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
  bestBeforeDate?: string;
  bestBeforeTime?: string;
  expiryDateTime?: string;
  deadline: string; // ISO Selling Deadline
  
  // Sales & Risk Information
  salesVelocity: SalesVelocity;
  unitsSoldToday?: number;
  expectedDemand?: number;
  wasteRiskScore: number;
  riskLevel?: RiskLevel;
  riskReasons?: string[];
  
  // Legacy & dynamic property aliases for multi-region schema matching
  shopName?: string;
  title?: string;
  locationName?: string;
  discountedPrice?: number;
  image?: string;
  pickupWindow?: string;

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
  unitsSoldToday?: number;
  expectedDemand?: number;
  prepDate?: string;
  category?: StoreCategory;
}

export interface RiskEvaluationResult {
  wasteRiskScore: number;
  riskLevel: RiskLevel;
  recommendedPrice: number;
  recommendedDiscountPct: number;
  explanation: string;
  reasons: string[];
  warningNotice?: string;
  timeRemainingMinutes: number;
  timeRemainingFormatted: string;
  windowStatus: 'safe' | 'warning' | 'critical' | 'expired';
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
  dealsPublished: number;
  dealsSoldOut: number;
  totalUnitsRescued: number;
}