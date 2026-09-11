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

export type StoreCategory = 'BAKERY' | 'CAFE' | 'RESTAURANT' | 'CANTEEN' | 'GROCERY';
export type StoreCategory = 'BAKERY' | 'CAFE' | 'RESTAURANT' | 'CANTEEN' | 'GROCERY' | 'DAIRY';

export type SalesVelocity = 'LOW' | 'MEDIUM' | 'HIGH';

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
  productName: string;
  category: StoreCategory;
  initialUnits: number;
  remainingUnits: number;
  soldUnits: number;
  originalPrice: number;
  recommendedPrice: number;
  publishedPrice: number;
  wasteRiskScore: number;
  salesVelocity: SalesVelocity;
  deadline: string;
  status: DealStatus;
  discountPct: number;
  freshnessTag?: string;
  description?: string;
  imageUrl?: string;
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
}

export interface RiskEvaluationResult {
  wasteRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedPrice: number;
  recommendedDiscountPct: number;
  explanation: string;
  warningNotice?: string;
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

export interface GeolocationState {
  lat: number;
  lng: number;
  isCustom: boolean;
  name?: string;
}