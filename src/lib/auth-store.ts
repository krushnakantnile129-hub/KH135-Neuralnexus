import { User, UserRole, MerchantKyc } from '../shared/types';

const AUTH_KEY = 'savebite_current_user_v1';

export const SINGLE_ADMIN_EMAIL = 'admin.governance@savebite.com';

export function getDefaultAvatar(seed: string): string {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`;
}

export const DEMO_USERS: Record<UserRole, User> = {
  CONSUMER: {
    id: 'usr_consumer_01',
    name: 'Rohan Sharma',
    email: 'rohan.consumer@gmail.com',
    role: 'CONSUMER',
    avatar: getDefaultAvatar('rohan.consumer@gmail.com'),
    bio: 'Food rescue enthusiast based in Pune. Loving fresh bakery deals!',
    authProvider: 'GOOGLE',
  },
  SHOPKEEPER: {
    id: 'usr_shopkeeper_01',
    name: 'Priya Patel (German Bakery)',
    email: 'priya.bakery@gmail.com',
    role: 'SHOPKEEPER',
    storeId: 'store_01',
    avatar: getDefaultAvatar('priya.bakery@gmail.com'),
    bio: 'German Bakery Koregaon Park owner committed to zero food waste clearance.',
    authProvider: 'GOOGLE',
    kycStatus: 'VERIFIED',
    kycData: {
      age: 29,
      dob: '1997-04-12',
      state: 'Maharashtra',
      city: 'Pune',
      streetAddress: '78 North Main Road, Koregaon Park',
      govtIdType: 'PAN',
      govtIdNumber: 'ABCDE1234F',
      fssaiLicense: '21523011000456',
      gstin: '27ABCDE1234F1Z5',
      bankName: 'HDFC Bank',
      accountHolder: 'Priya Patel',
      accountNumber: '50100234567890',
      ifscCode: 'HDFC0000140',
      verifiedAt: new Date().toISOString(),
    }
  },
  ADMIN: {
    id: 'usr_admin_01',
    name: 'Platform Administrator',
    email: SINGLE_ADMIN_EMAIL,
    role: 'ADMIN',
    avatar: getDefaultAvatar(SINGLE_ADMIN_EMAIL),
    bio: 'System Governance Administrator overseeing RBAC matrices and algorithm tuning.',
    authProvider: 'EMAIL',
  },
};

let inMemoryUser: User | null = null;
const listeners: Set<(user: User | null) => void> = new Set();

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getCurrentUser(): User | null {
  if (isBrowser()) {
    const cached = localStorage.getItem(AUTH_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached user', e);
      }
    }
  }
  return inMemoryUser;
}

export function setCurrentUser(user: User | null): void {
  inMemoryUser = user;
  if (isBrowser()) {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }
  listeners.forEach(cb => cb(user));
}

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  listeners.add(callback);
  callback(getCurrentUser());
  return () => {
    listeners.delete(callback);
  };
}

export function loginWithEmail(email: string, role: UserRole): User {
  const cleanEmail = email.trim().toLowerCase();

  // Admin Check: Only single admin profile allowed
  if (role === 'ADMIN' || cleanEmail === SINGLE_ADMIN_EMAIL) {
    if (cleanEmail !== SINGLE_ADMIN_EMAIL) {
      throw new Error('Only the designated Single Admin Profile (admin.governance@savebite.com) can log in as Admin.');
    }
    const adminUser = DEMO_USERS.ADMIN;
    setCurrentUser(adminUser);
    return adminUser;
  }

  // Check matching seed email
  const targetSeed = Object.values(DEMO_USERS).find(
    u => u.email.toLowerCase() === cleanEmail
  );

  const user: User = targetSeed ? { ...targetSeed, role } : {
    id: `usr_${Date.now()}`,
    name: cleanEmail.split('@')[0].replace('.', ' ').replace(/^./, c => c.toUpperCase()),
    email: cleanEmail,
    role,
    avatar: getDefaultAvatar(cleanEmail),
    authProvider: 'EMAIL',
    kycStatus: role === 'SHOPKEEPER' ? 'PENDING' : undefined,
  };

  setCurrentUser(user);
  return user;
}

export function loginWithGoogle(
  role: UserRole = 'SHOPKEEPER', 
  customEmail?: string, 
  customName?: string,
  customAvatar?: string
): User {
  const email = (customEmail && customEmail.trim()) 
    ? customEmail.trim().toLowerCase()
    : (role === 'CONSUMER' ? 'rohan.consumer@gmail.com' : 'priya.bakery@gmail.com');

  if (role === 'ADMIN' || email === SINGLE_ADMIN_EMAIL) {
    setCurrentUser(DEMO_USERS.ADMIN);
    return DEMO_USERS.ADMIN;
  }

  const defaultName = email.split('@')[0].replace(/[\._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const name = (customName && customName.trim()) ? customName.trim() : defaultName;
  const avatar = customAvatar || getDefaultAvatar(email);

  const user: User = {
    id: `usr_google_${Date.now()}`,
    name,
    email,
    role,
    avatar,
    authProvider: 'GOOGLE',
    storeId: role === 'SHOPKEEPER' ? 'store_01' : undefined,
    kycStatus: role === 'SHOPKEEPER' ? 'VERIFIED' : undefined,
  };

  setCurrentUser(user);
  return user;
}

export function signupUser(
  name: string, 
  email: string, 
  role: UserRole,
  kyc?: MerchantKyc
): User {
  const cleanEmail = email.trim().toLowerCase();

  if (role === 'ADMIN' || cleanEmail === SINGLE_ADMIN_EMAIL) {
    throw new Error('Registration as Admin is strictly restricted. Only 1 fixed Admin profile exists in the platform.');
  }

  if (role === 'SHOPKEEPER') {
    if (!kyc) {
      throw new Error('Merchant Identity Verification (KYC) is required for Shopkeeper registration.');
    }
    if (kyc.age < 18) {
      throw new Error('Merchant eligibility failure: You must be at least 18 years old to register as a Shopkeeper.');
    }
    if (!kyc.state || kyc.state.trim().toLowerCase() !== 'maharashtra') {
      throw new Error('Geographic eligibility failure: SAVE-BITE Merchant operations are currently restricted to Maharashtra, India.');
    }
    if (!kyc.govtIdNumber || kyc.govtIdNumber.length < 5) {
      throw new Error('Identity verification failure: Please provide a valid Government ID Number (Aadhaar/PAN).');
    }
    if (!kyc.fssaiLicense || kyc.fssaiLicense.length < 10) {
      throw new Error('Food safety compliance failure: Valid FSSAI License Number is required for food surplus clearance.');
    }
    if (!kyc.accountNumber || !kyc.ifscCode) {
      throw new Error('Financial verification failure: Bank account number and IFSC code are required for payout settlement.');
    }
  }

  const user: User = {
    id: `usr_${Date.now()}`,
    name: name.trim() || cleanEmail.split('@')[0],
    email: cleanEmail,
    role,
    avatar: getDefaultAvatar(cleanEmail),
    authProvider: 'EMAIL',
    storeId: role === 'SHOPKEEPER' ? 'store_01' : undefined,
    kycStatus: role === 'SHOPKEEPER' ? 'VERIFIED' : undefined,
    kycData: kyc ? { ...kyc, verifiedAt: new Date().toISOString() } : undefined,
  };

  setCurrentUser(user);
  return user;
}

export function updateUserProfile(updates: Partial<User>): User | null {
  const current = getCurrentUser();
  if (!current) return null;

  const updatedUser: User = {
    ...current,
    ...updates,
  };

  setCurrentUser(updatedUser);
  return updatedUser;
}

export function updateMerchantKyc(kycUpdates: Partial<MerchantKyc>): User | null {
  const current = getCurrentUser();
  if (!current || !current.kycData) return null;

  const updatedKyc: MerchantKyc = {
    ...current.kycData,
    ...kycUpdates,
  };

  const updatedUser: User = {
    ...current,
    kycData: updatedKyc,
  };

  setCurrentUser(updatedUser);
  return updatedUser;
}

export function logoutUser(): void {
  setCurrentUser(null);
}

export function quickSwitchDemoRole(role: UserRole): User {
  const user = DEMO_USERS[role];
  setCurrentUser(user);
  return user;
}
