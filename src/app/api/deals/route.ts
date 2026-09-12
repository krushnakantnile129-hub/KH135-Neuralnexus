import { NextRequest, NextResponse } from 'next/server';
import { loadDeals, addDeal } from '@/lib/store';
import { calculateHaversineDistance } from '@/lib/geo';
import { evaluateWasteRisk } from '@/shared/engine/wasteRisk';
import { Deal } from '@/shared/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '18.5204');
  const lng = parseFloat(searchParams.get('lng') || '73.8567');
  const radiusKm = parseFloat(searchParams.get('radius') || '5.0');
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '50');

  const now = Date.now();
  const allDeals = loadDeals();

  const results = allDeals
    .filter((d) => {
      const isNotExpired = new Date(d.deadline).getTime() > now;
      if (d.status !== 'ACTIVE' || d.remainingUnits <= 0 || !isNotExpired) {
        return false;
      }
      if (category && category !== 'ALL') {
        const catLower = category.toLowerCase();
        const dealCat = (d.category || '').toLowerCase();
        const dealStoreCat = (d.storeCategory || '').toLowerCase();

        const isDairy = catLower.includes('dairy') || catLower.includes('farm');
        const isBakery = catLower.includes('baker');
        const isCafe = catLower.includes('cafe') || catLower.includes('café');
        const isRestaurant = catLower.includes('restaurant');
        const isCanteen = catLower.includes('canteen');
        const isGrocery = catLower.includes('grocer');

        const matchesCategory =
          dealCat === catLower ||
          dealStoreCat === catLower ||
          (isDairy && (dealCat.includes('dairy') || dealStoreCat.includes('dairy'))) ||
          (isBakery && (dealCat.includes('baker') || dealStoreCat.includes('baker'))) ||
          (isCafe && (dealCat.includes('cafe') || dealStoreCat.includes('cafe'))) ||
          (isRestaurant && (dealCat.includes('rest') || dealStoreCat.includes('rest'))) ||
          (isCanteen && (dealCat.includes('cant') || dealStoreCat.includes('cant'))) ||
          (isGrocery && (dealCat.includes('groc') || dealStoreCat.includes('groc')));

        if (!matchesCategory) return false;
      }
      return true;
    })
    .map((d) => {
      const distanceMeters = calculateHaversineDistance(lat, lng, d.latitude, d.longitude);
      return { ...d, distanceMeters };
    })
    .filter((d) => (d.distanceMeters ?? 0) <= radiusKm * 1000)
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
    .slice(0, limit);

  return NextResponse.json({
    count: results.length,
    userCoordinates: { lat, lng },
    deals: results,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, originalPrice, publishedPrice, initialUnits, deadline, salesVelocity } = body;

    if (!productName || productName.length < 3 || productName.length > 80) {
      return NextResponse.json(
        { error: 'ERR_VAL_01: Invalid product name. Length must be 3-80 chars.' },
        { status: 400 }
      );
    }

    if (!originalPrice || originalPrice < 5 || originalPrice > 50000) {
      return NextResponse.json(
        { error: 'ERR_VAL_02: Original price must be between ₹5 and ₹50,000.' },
        { status: 400 }
      );
    }

    const minFloor = Math.round(originalPrice * 0.20);
    if (publishedPrice < minFloor || publishedPrice > originalPrice) {
      return NextResponse.json(
        { error: 'ERR_VAL_03: Price must stay between 20% floor and original ceiling.' },
        { status: 400 }
      );
    }

    if (!initialUnits || initialUnits < 1 || initialUnits > 500) {
      return NextResponse.json(
        { error: 'ERR_VAL_04: Inventory volume must be between 1 and 500 units.' },
        { status: 400 }
      );
    }

    const deadlineMs = new Date(deadline).getTime();
    const now = Date.now();
    if (deadlineMs < now + 25 * 60000 || deadlineMs > now + 25 * 3600000) {
      return NextResponse.json(
        { error: 'ERR_VAL_05: Expiry must be between 30 mins and 24 hours out.' },
        { status: 400 }
      );
    }

    const evaluation = evaluateWasteRisk({
      quantity: initialUnits,
      originalPrice,
      selectedPrice: publishedPrice,
      deadlineIso: deadline,
      salesVelocity: salesVelocity || 'LOW',
    });

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      storeId: body.storeId || 'store-abc-bakery',
      storeName: body.storeName || 'ABC Gourmet Bakery & Café',
      storeCategory: body.category || 'Bakery',
      storeAddress: body.storeAddress || 'Pune Central',
      latitude: body.latitude || 18.5255,
      longitude: body.longitude || 73.8595,
      phoneContact: body.phoneContact || '+91 98230 12345',
      productName: productName.trim(),
      category: body.category || 'Bakery',
      unit: body.unit || 'pieces',
      initialUnits,
      remainingUnits: initialUnits,
      soldUnits: 0,
      originalPrice,
      recommendedPrice: evaluation.recommendedPrice,
      publishedPrice,
      wasteRiskScore: evaluation.wasteRiskScore,
      riskLevel: evaluation.riskLevel,
      riskReasons: evaluation.reasons,
      salesVelocity: salesVelocity || 'LOW',
      deadline,
      status: 'ACTIVE',
      discountPct: Math.round(((originalPrice - publishedPrice) / originalPrice) * 100),
      freshnessTag: body.freshnessTag || 'Verified Fresh',
      description: body.description || '',
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDeal(newDeal);
    return NextResponse.json(newDeal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}