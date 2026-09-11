import { NextRequest, NextResponse } from 'next/server';
import { evaluateWasteRisk } from '@/shared/engine/wasteRisk';
import { RiskInput } from '@/shared/types';

export async function POST(request: NextRequest) {
  try {
    const body: RiskInput = await request.json();
    const result = evaluateWasteRisk(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}
