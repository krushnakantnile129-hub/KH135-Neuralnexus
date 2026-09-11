import { NextRequest, NextResponse } from 'next/server';
import { updateDealStatus, decrementDealInventory } from '@/lib/store';
import { DealStatus } from '@/shared/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, decrementUnits } = body;

    if (decrementUnits) {
      const updated = decrementDealInventory(id, decrementUnits);
      if (!updated) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    if (status) {
      const updated = updateDealStatus(id, status as DealStatus);
      if (!updated) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update deal status' }, { status: 500 });
  }
}
