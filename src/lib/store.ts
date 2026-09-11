import { Store, Deal, MerchantMetrics, DealStatus } from '../shared/types';
import { SEED_STORES, getInitialDeals } from './seed-data';

const STORES_KEY = 'savebite_stores_v1';
const DEALS_KEY = 'savebite_deals_v1';

// In-memory singletons for server routes / fallback
let memoryStores: Store[] = [...SEED_STORES];
let memoryDeals: Deal[] = getInitialDeals();

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function loadStores(): Store[] {
  if (isBrowser()) {
    const cached = localStorage.getItem(STORES_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing stores', e);
      }
    }
    localStorage.setItem(STORES_KEY, JSON.stringify(SEED_STORES));
  }
  return memoryStores;
}

export function saveStores(stores: Store[]): void {
  memoryStores = stores;
  if (isBrowser()) {
    localStorage.setItem(STORES_KEY, JSON.stringify(stores));
  }
}

export function loadDeals(): Deal[] {
  let deals: Deal[] = memoryDeals;
  if (isBrowser()) {
    const cached = localStorage.getItem(DEALS_KEY);
    if (cached) {
      try {
        deals = JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing deals', e);
        deals = getInitialDeals();
      }
    } else {
      deals = getInitialDeals();
      localStorage.setItem(DEALS_KEY, JSON.stringify(deals));
    }
  }

  // Automatic TTL Expiry Sweep (FR-PUB-04 / SAD Section 11)
  const now = Date.now();
  let changed = false;
  deals = deals.map(d => {
    if (d.status === 'ACTIVE' && new Date(d.deadline).getTime() <= now) {
      changed = true;
      return { ...d, status: 'EXPIRED' as DealStatus };
    }
    if (d.status === 'ACTIVE' && d.remainingUnits <= 0) {
      changed = true;
      return { ...d, status: 'SOLD_OUT' as DealStatus };
    }
    return d;
  });

  if (changed) {
    saveDeals(deals);
  }

  return deals;
}

export function saveDeals(deals: Deal[]): void {
  memoryDeals = deals;
  if (isBrowser()) {
    localStorage.setItem(DEALS_KEY, JSON.stringify(deals));
  }
}

export function addDeal(deal: Deal): void {
  const deals = loadDeals();
  deals.unshift(deal);
  saveDeals(deals);
}

export function updateDealStatus(dealId: string, status: DealStatus): Deal | null {
  const deals = loadDeals();
  const index = deals.findIndex(d => d.id === dealId);
  if (index === -1) return null;

  deals[index] = {
    ...deals[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  saveDeals(deals);
  return deals[index];
}

export function updateDealDetails(dealId: string, updates: Partial<Deal>): Deal | null {
  const deals = loadDeals();
  const index = deals.findIndex(d => d.id === dealId);
  if (index === -1) return null;

  deals[index] = {
    ...deals[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDeals(deals);
  return deals[index];
}

export function decrementDealInventory(dealId: string, unitsToSell: number = 1): Deal | null {
  const deals = loadDeals();
  const index = deals.findIndex(d => d.id === dealId);
  if (index === -1) return null;

  const deal = deals[index];
  const actualSell = Math.min(deal.remainingUnits, unitsToSell);
  const remainingUnits = Math.max(0, deal.remainingUnits - actualSell);
  const soldUnits = deal.soldUnits + actualSell;
  const status: DealStatus = remainingUnits === 0 ? 'SOLD_OUT' : deal.status;

  deals[index] = {
    ...deal,
    remainingUnits,
    soldUnits,
    status,
    updatedAt: new Date().toISOString(),
  };
  saveDeals(deals);
  return deals[index];
}

export function markDealAllSold(dealId: string): Deal | null {
  const deals = loadDeals();
  const index = deals.findIndex(d => d.id === dealId);
  if (index === -1) return null;

  const deal = deals[index];
  const soldUnits = deal.soldUnits + deal.remainingUnits;
  deals[index] = {
    ...deal,
    remainingUnits: 0,
    soldUnits,
    status: 'SOLD_OUT',
    updatedAt: new Date().toISOString(),
  };
  saveDeals(deals);
  return deals[index];
}

export function computeMerchantMetrics(storeId?: string): MerchantMetrics {
  const deals = loadDeals().filter(d => (!storeId || d.storeId === storeId));
  
  let revenueRecovered = 0;
  let totalUnitsRescued = 0;
  let dealsPublished = deals.length;
  let dealsSoldOut = 0;

  for (const d of deals) {
    const sold = d.soldUnits;
    if (sold > 0) {
      revenueRecovered += sold * d.publishedPrice;
      totalUnitsRescued += sold;
    }
    if (d.status === 'SOLD_OUT') {
      dealsSoldOut++;
    }
  }

  return {
    revenueRecovered: Math.round(revenueRecovered),
    dealsPublished,
    dealsSoldOut,
    totalUnitsRescued,
  };
}

export function resetDemoState(): void {
  if (isBrowser()) {
    localStorage.removeItem(STORES_KEY);
    localStorage.removeItem(DEALS_KEY);
  }
  memoryStores = [...SEED_STORES];
  memoryDeals = getInitialDeals();
}
