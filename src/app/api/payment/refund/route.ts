import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logPaymentEvent } from '@/lib/payments/paymentLogger';
import { getCampayToken } from '@/lib/payments/campay';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const CAMPAY_BASE_URL = process.env.CAMPAY_ENVIRONMENT === 'prod' 
  ? 'https://www.campay.net/api' 
  : 'https://demo.campay.net/api';

async function reverseCollectInCampay(reference: string, amount: number) {
  const token = await getCampayToken();
  if (token === 'sandbox_token') {
    console.log(`[Campay Sandbox Mode] Simulated reversal of ${amount} XAF for reference: ${reference}`);
    return { status: 'SUCCESSFUL', message: 'Reversal simulated successfully' };
  }

  const response = await fetch(`${CAMPAY_BASE_URL}/reverse/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    },
    body: JSON.stringify({
      reference: reference,
      amount: Math.round(amount).toString(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn('[Campay] Refund/reversal upstream error:', errorText);
    throw new Error(`Upstream reversal declined: ${errorText}`);
  }

  return response.json();
}

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { orderId, reason, adminId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId param' }, { status: 400 });
    }

    // 1. Log event
    await logPaymentEvent('REFUND_INITIATED', {
      orderId,
      userId: adminId,
      error: reason
    });

    // 2. Query order & payments records to find transaction id
    const { data: order, error: orderFetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderFetchError || !order) {
      return NextResponse.json({ error: 'Order not found for refund.' }, { status: 404 });
    }

    const { data: pData, error: payFetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    const campayRef = pData?.campay_id || pData?.stripe_payment_id || order.payment_id;

    if (!campayRef) {
      // If there's no reference, we can still cancel the order locally
      console.warn(`[Refund] No payment reference recorded for Order ${orderId}. Cancelling order only.`);
    }

    // 3. Mark Order Status as REFUND_PENDING
    await supabase
      .from('orders')
      .update({ status: 'refund_pending' })
      .eq('id', orderId);

    // 4. Try reversal on Campay
    let reversalResult = { status: 'SUCCESSFUL' };
    if (campayRef) {
      try {
        reversalResult = await reverseCollectInCampay(campayRef, order.total_amount || pData?.amount || 0);
      } catch (revErr: any) {
        console.error('[Refund] Reversal failed on Campay API:', revErr.message);
        // Track the failed refund state
        await supabase
          .from('orders')
          .update({ status: 'disputed' });
        
        await logPaymentEvent('REFUND_GATEWAY_REJECTION', {
          orderId,
          userId: adminId,
          reference: campayRef,
          error: revErr.message,
          duration_ms: Date.now() - startTime
        });

        return NextResponse.json({ error: `Upstream gateway refused refund: ${revErr.message}` }, { status: 422 });
      }
    }

    // 5. Complete state transitions on successful reversal
    const { error: orderUpdateErr } = await supabase
      .from('orders')
      .update({ status: 'refund_completed' })
      .eq('id', orderId);

    if (orderUpdateErr) {
      console.error('[Refund] Order state resolution error:', orderUpdateErr.message);
    }

    if (pData) {
      await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', pData.id);
    }

    // Insert structured audit entry
    await logPaymentEvent('REFUND_COMPLETED', {
      orderId,
      userId: adminId,
      amount: order.total_amount,
      status: 'refund_completed',
      reference: campayRef,
      duration_ms: Date.now() - startTime
    });

    return NextResponse.json({
      success: true,
      status: 'refund_completed',
      reversalResult
    });

  } catch (error: any) {
    console.error('[Refund API Error]:', error);
    return NextResponse.json({ error: error.message || 'Server processed refund failure' }, { status: 500 });
  }
}
