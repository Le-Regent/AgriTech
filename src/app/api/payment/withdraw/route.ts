import { NextResponse } from 'next/server';
import { initiateWithdrawal } from '@/lib/payments/campay';
import { withdrawSchema } from '@/lib/validations/payment';
import { handleRateLimit } from '@/lib/security/rateLimit';
import { createClient } from '@supabase/supabase-js';
import { logPaymentEvent } from '@/lib/payments/paymentLogger';
import { mapPaymentError } from '../collect/route';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResponse = handleRateLimit(ip, 8, 60000);
    if (rateLimitResponse) {
      await logPaymentEvent('WITHDRAW_RATE_LIMIT_EXCEEDED', { reference: ip });
      return rateLimitResponse;
    }

    const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key') || null;

    if (idempotencyKey) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(idempotencyKey)) {
        return NextResponse.json({ error: 'Malformed idempotency key. Key must be of UUID format.' }, { status: 400 });
      }

      // Check cache/table for duplication
      const { data: cachedResponse, error: cacheError } = await supabase
        .from('idempotency_keys')
        .select('*')
        .eq('key', idempotencyKey)
        .maybeSingle();

      if (!cacheError && cachedResponse) {
        console.log(`[Idempotency] Duplicate withdraw found: Returning cached response for key ${idempotencyKey}`);
        await logPaymentEvent('WITHDRAW_DUPLICATE_IDEMPOTENCY_HIT', { reference: idempotencyKey });
        return new NextResponse(
          JSON.stringify(cachedResponse.response_body),
          { status: cachedResponse.response_status || 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const body = await req.json();
    const validation = withdrawSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { amount, phoneNumber, externalId } = validation.data;
    await logPaymentEvent('WITHDRAW_INITIATED', {
      amount,
      reference: phoneNumber,
      orderId: externalId
    });

    let result;
    try {
      result = await initiateWithdrawal(amount, phoneNumber, externalId);
    } catch (apiError: any) {
      const friendlyMsg = mapPaymentError(apiError.message);
      const errorResponse = { error: friendlyMsg, raw: apiError.message };

      if (idempotencyKey) {
        await supabase.from('idempotency_keys').insert([{
          key: idempotencyKey,
          response_body: errorResponse,
          response_status: 400,
          created_at: new Date().toISOString()
        }]);
      }

      await logPaymentEvent('WITHDRAW_FAILURE', {
        amount,
        reference: phoneNumber,
        orderId: externalId,
        error: apiError.message,
        duration_ms: Date.now() - startTime
      });

      return NextResponse.json(errorResponse, { status: 400 });
    }

    const finalResponse = { ...result, friendlyStatus: 'Fund Withdrawal Dispatched' };

    if (idempotencyKey) {
      await supabase.from('idempotency_keys').insert([{
        key: idempotencyKey,
        response_body: finalResponse,
        response_status: 200,
        created_at: new Date().toISOString()
      }]);
    }

    await logPaymentEvent('WITHDRAW_SUCCESS', {
      amount,
      reference: phoneNumber,
      orderId: externalId,
      status: 'payout_dispatched',
      duration_ms: Date.now() - startTime
    });

    return NextResponse.json(finalResponse);
  } catch (error: any) {
    console.error('API Payment Withdrawal Error:', error);
    await logPaymentEvent('WITHDRAW_SERVER_ERROR', {
      error: error.message,
      duration_ms: Date.now() - startTime
    });
    return NextResponse.json({ error: error.message || 'Server processed withdrawal transaction fault' }, { status: 500 });
  }
}
