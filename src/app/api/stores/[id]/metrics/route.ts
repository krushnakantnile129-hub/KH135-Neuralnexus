import { NextRequest, NextResponse } from 'next/server';
import { computeMerchantMetrics } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const metrics = computeMerchantMetrics(id);
    return NextResponse.json(metrics);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to retrieve metrics' }, { status: 500 });
  }
}
