import { NextResponse } from 'next/server';
import { checkTransactionStatus } from '@/lib/payments/campay';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
  }

  try {
    const result = await checkTransactionStatus(reference);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Payment Status Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
