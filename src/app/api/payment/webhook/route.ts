import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logPaymentEvent } from '@/lib/payments/paymentLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  const startTime = Date.now();
  let rawBody = '';
  let payload: any = null;

  try {
    rawBody = await req.text();
    payload = JSON.parse(rawBody);
  } catch (err: any) {
    await logPaymentEvent('WEBHOOK_MALFORMED_PAYLOAD', {
      error: err.message,
      duration_ms: Date.now() - startTime
    });
    return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
  }

  const { status, external_reference, reference, amount } = payload || {};

  try {
    console.log('Campay Webhook Received:', payload);

    if (status === 'SUCCESSFUL') {
      // 1. Update Order Status to ESCROW_HELD
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'ESCROW_HELD' })
        .eq('id', external_reference);
      
      if (orderError) throw new Error(`Failed to update order status: ${orderError.message}`);

      // 2. Update Payment Record
      const { error: payError } = await supabase
        .from('payments')
        .update({ 
          status: 'escrow_held', 
          campay_id: reference,
          amount: parseFloat(amount) || 0
        })
        .eq('order_id', external_reference);

      if (payError) throw new Error(`Failed to update payment record: ${payError.message}`);

      // 3. Generate OTP and Update Order (for handshake delivery)
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const { error: otpError } = await supabase
        .from('orders')
        .update({ otp_code: otp })
        .eq('id', external_reference);

      if (otpError) throw new Error(`Failed to update order OTP: ${otpError.message}`);

      console.log(`Webhook processed successfully for Order ${external_reference}. Status: ESCROW_HELD`);
      
      // Update/insert resolved status into DLQ if it was retried before
      try {
        await supabase
          .from('failed_webhooks')
          .update({ status: 'resolved' })
          .eq('payload->>reference', reference);
      } catch (e) {
        console.warn('Could not update status to resolved in failed_webhooks:', e);
      }

      await logPaymentEvent('WEBHOOK_PROCESS_SUCCESS', {
        orderId: external_reference,
        paymentId: reference,
        amount: parseFloat(amount) || 0,
        status: 'escrow_held',
        reference,
        duration_ms: Date.now() - startTime
      });
    }

    return NextResponse.json({ status: 'processed' });
  } catch (error: any) {
    console.error('Webhook Processing Error:', error);

    // Save failed webhook payload to Dead Letter Queue (DLQ)
    try {
      const { data: existingW } = await supabase
        .from('failed_webhooks')
        .select('*')
        .eq('payload->>reference', reference || '')
        .maybeSingle();

      if (existingW) {
        await supabase
          .from('failed_webhooks')
          .update({
            error: error.message,
            retry_count: (existingW.retry_count || 0) + 1,
            last_retry_at: new Date().toISOString(),
            status: 'failed'
          })
          .eq('id', existingW.id);
      } else {
        await supabase
          .from('failed_webhooks')
          .insert([{
            payload,
            error: error.message,
            retry_count: 0,
            last_retry_at: new Date().toISOString(),
            status: 'failed'
          }]);
      }
    } catch (saveDlqError) {
      console.error('Failed to log to Dead Letter Queue:', saveDlqError);
    }

    await logPaymentEvent('WEBHOOK_PROCESS_FAILURE', {
      orderId: external_reference,
      paymentId: reference,
      amount: parseFloat(amount) || 0,
      status: 'failed',
      reference,
      error: error.message,
      duration_ms: Date.now() - startTime
    });

    return NextResponse.json({ error: error.message || 'Webhook Processing Error' }, { status: 500 });
  }
}
