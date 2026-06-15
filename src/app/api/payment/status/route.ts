import { NextResponse } from 'next/server';
import { checkTransactionStatus } from '@/lib/payments/campay';
import { statusSchema } from '@/lib/validations/payment';
import { handleRateLimit } from '@/lib/security/rateLimit';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResponse = handleRateLimit(ip, 20, 60000);
    if (rateLimitResponse) {
      logger.warn('Rate limit exceeded for status API', { ip });
      return rateLimitResponse;
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    const validation = statusSchema.safeParse({ reference });
    if (!validation.success) {
      logger.warn('Validation failed for status API', { errors: validation.error.format() });
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const refStr = validation.data.reference;
    logger.info('Checking transaction status', { reference: refStr });
    const result = await checkTransactionStatus(refStr);
    logger.info('Status check completed', { reference: refStr, status: result.status });

    if (result.status === 'SUCCESSFUL') {
      const order_id = result.external_reference || (refStr.startsWith('sim_col_') ? refStr.split('_')[2] : null);
      if (order_id) {
        // Fetch current order status
        const { data: order, error: orderFetchError } = await supabase
          .from('orders')
          .select('status, otp_code')
          .eq('id', order_id)
          .single();

        if (!orderFetchError && order && order.status === 'pending') {
          logger.info(`Status API Syncing order ${order_id} to ESCROW_HELD state`);
          
          // 1. Update Order Status
          await supabase
            .from('orders')
            .update({ status: 'ESCROW_HELD' })
            .eq('id', order_id);

          // 2. Update Payment Record
          await supabase
            .from('payments')
            .update({ 
              status: 'escrow_held', 
              campay_id: refStr,
              amount: parseFloat(result.amount) || undefined
            })
            .eq('order_id', order_id);

          // 3. Generate OTP if not present
          if (!order.otp_code) {
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            await supabase
              .from('orders')
              .update({ otp_code: otp })
              .eq('id', order_id);
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('API Payment Status Error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
