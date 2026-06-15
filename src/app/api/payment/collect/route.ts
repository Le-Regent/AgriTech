import { NextResponse } from 'next/server';
import { initiateCollect } from '@/lib/payments/campay';
import { collectSchema } from '@/lib/validations/payment';
import { handleRateLimit } from '@/lib/security/rateLimit';
import { createClient } from '@supabase/supabase-js';
import { logPaymentEvent } from '@/lib/payments/paymentLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Map payment provider errors to user-friendly messages
export function mapPaymentError(errorText: string): string {
  const text = String(errorText).toUpperCase();
  if (text.includes('INVALID_PHONE') || text.includes('FORMAT') || text.includes('TELEPHONE') || text.includes('PHONE_NUMBER')) {
    return 'Please check your phone number format. It must be MTN or Orange Cameroon Mobile Money.';
  }
  if (text.includes('INSUFFICIENT_BALANCE') || text.includes('NOT_ENOUGH') || text.includes('BALANCE_TOO_LOW') || text.includes('INSUFFICIENT')) {
    return 'Your Mobile Money account balance is too low. Please add funds or dial with a funded account.';
  }
  if (text.includes('CANCEL') || text.includes('USER_CANCELLED')) {
    return 'Payment request cancelled or declined.';
  }
  if (text.includes('TIMEOUT') || text.includes('TIMED_OUT')) {
    return 'Processing timed out. Please check your phone for prompt or try again.';
  }
  if (text.includes('EXPIRED')) {
    return 'Handshake payment session expired. Please retry checkouts.';
  }
  return errorText || 'Failed to authorize checkout. Please ensure your wallet has active funds.';
}

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResponse = handleRateLimit(ip, 12, 60000);
    if (rateLimitResponse) {
      await logPaymentEvent('COLLECT_RATE_LIMIT_EXCEEDED', { reference: ip });
      return rateLimitResponse;
    }

    const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key') || null;

    // Validate UUID format for idempotency key if supplied
    if (idempotencyKey) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(idempotencyKey)) {
        return NextResponse.json({ error: 'Malformed idempotency key. Key must be of UUID format.' }, { status: 400 });
      }

      // Check if this key was already processed
      const { data: cachedResponse, error: cacheError } = await supabase
        .from('idempotency_keys')
        .select('*')
        .eq('key', idempotencyKey)
        .maybeSingle();

      if (!cacheError && cachedResponse) {
        console.log(`[Idempotency] Duplicate collect found: Returning cached response for key ${idempotencyKey}`);
        await logPaymentEvent('COLLECT_DUPLICATE_IDEMPOTENCY_HIT', { reference: idempotencyKey });
        return new NextResponse(
          JSON.stringify(cachedResponse.response_body),
          { status: cachedResponse.response_status || 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const body = await req.json();
    const validation = collectSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { amount, phoneNumber, externalId } = validation.data;
    await logPaymentEvent('COLLECT_INITIATED', {
      amount,
      reference: phoneNumber,
      orderId: externalId
    });

    let result;
    try {
      result = await initiateCollect(amount, phoneNumber, externalId);
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

      await logPaymentEvent('COLLECT_FAILURE', {
        amount,
        reference: phoneNumber,
        orderId: externalId,
        error: apiError.message,
        duration_ms: Date.now() - startTime
      });

      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Success response formulation
    const finalResponse = { ...result, friendlyStatus: 'Mobile Money Prompt Dispatched' };

    if (idempotencyKey) {
      await supabase.from('idempotency_keys').insert([{
        key: idempotencyKey,
        response_body: finalResponse,
        response_status: 200,
        created_at: new Date().toISOString()
      }]);
    }

    await logPaymentEvent('COLLECT_SUCCESS', {
      amount,
      reference: phoneNumber,
      orderId: externalId,
      status: 'pending_prompt',
      duration_ms: Date.now() - startTime
    });

    return NextResponse.json(finalResponse);
  } catch (error: any) {
    console.error('API Payment Collect Error:', error);
    await logPaymentEvent('COLLECT_SERVER_ERROR', {
      error: error.message,
      duration_ms: Date.now() - startTime
    });
    return NextResponse.json({ error: error.message || 'Server processed payment collection fault' }, { status: 500 });
  }
}
