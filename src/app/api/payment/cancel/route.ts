import { NextResponse } from 'next/server';
import { dualPersistenceDb } from '@/lib/payments/db';
import { logPaymentEvent } from '@/lib/payments/paymentLogger';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { orderId, reference, reason } = await req.json();

    if (!orderId && !reference) {
      return NextResponse.json({ error: 'Missing orderId or reference parameter' }, { status: 400 });
    }

    console.log(`[Cancel API] Request received inside gateway. OrderID: ${orderId}, Ref: ${reference}`);

    // Resolve orderId from reference if missing
    let targetOrderId = orderId;
    let targetReference = reference;

    if (!targetOrderId && targetReference) {
      const localPayment = await dualPersistenceDb.getPaymentByReference(targetReference);
      if (localPayment) {
        targetOrderId = localPayment.order_id;
      }
    }

    if (targetOrderId) {
      // 1. Mark Order status as cancelled
      try {
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', targetOrderId);
      } catch (err: any) {
        console.warn('[Cancel API] Supabase orders update failed or RLS blocked. Relying on fallback db:', err.message);
      }

      await dualPersistenceDb.saveOrder({
        id: targetOrderId,
        status: 'cancelled',
        delivered_at: null
      });

      // 2. Mark Payment record as failed/cancelled
      const existingPayment = await dualPersistenceDb.getPaymentByOrderId(targetOrderId);
      const paymentRef = targetReference || existingPayment?.campay_reference || `sim_col_${targetOrderId}_cancel`;
      
      try {
        await supabase
          .from('payments')
          .update({ status: 'cancelled' })
          .eq('order_id', targetOrderId);
      } catch (err: any) {
        console.warn('[Cancel API] Supabase payments update failed:', err.message);
      }

      await dualPersistenceDb.savePayment({
        order_id: targetOrderId,
        campay_reference: paymentRef,
        status: 'cancelled',
        amount: existingPayment?.amount || 0,
        currency: 'XAF',
        method: 'mobile-money',
        created_at: new Date().toISOString()
      });

      await logPaymentEvent('PAYMENT_CANCELLED_BY_USER', {
        orderId: targetOrderId,
        reference: paymentRef,
        reason: reason || 'Customer clicked cancellation of checkout poll',
        duration_ms: Date.now() - startTime
      });

      return NextResponse.json({
        success: true,
        message: 'Payment collection and verification loop cancelled successfully.',
        orderId: targetOrderId,
        status: 'cancelled'
      });
    }

    return NextResponse.json({ error: 'Could not locate matching transaction or order to cancel' }, { status: 404 });
  } catch (error: any) {
    console.error('[Cancel API Server Error]:', error);
    return NextResponse.json({ error: error.message || 'Server processed payment cancel fault' }, { status: 500 });
  }
}
