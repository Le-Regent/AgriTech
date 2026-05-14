import { NextResponse } from 'next/server';
import { initiateCollect } from '@/lib/payments/campay';

export async function POST(req: Request) {
  try {
    const { amount, phoneNumber, externalId } = await req.json();
    
    if (!amount || !phoneNumber || !externalId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await initiateCollect(amount, phoneNumber, externalId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Payment Collect Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
