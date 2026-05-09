import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We need a stable supabase client for the webhook with service role permissions
// Note: In a real project, SUPABASE_SERVICE_ROLE_KEY must be in .env
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('Campay Webhook Received:', data);
    
    // Campay payload typically includes status, external_reference, and reference
    const { status, external_reference, reference, amount } = data;

    if (status === 'SUCCESSFUL') {
      // 1. Update Order Status to ESCROW_HELD
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'ESCROW_HELD' })
        .eq('id', external_reference);
      
      if (orderError) {
        console.error('Webhook: Failed to update order status:', orderError);
      }

      // 2. Update Payment Record
      const { error: payError } = await supabase
        .from('payments')
        .update({ 
          status: 'escrow_held', 
          campay_id: reference,
          amount: parseFloat(amount) || 0
        })
        .eq('order_id', external_reference);

      if (payError) {
        console.error('Webhook: Failed to update payment record:', payError);
      }

      // 3. Generate OTP and Update Order (for handshake delivery)
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      await supabase
        .from('orders')
        .update({ otp_code: otp })
        .eq('id', external_reference);

      console.log(`Webhook processed successfully for Order ${external_reference}. Status: ESCROW_HELD`);
    }

    return NextResponse.json({ status: 'processed' });
  } catch (error: any) {
    console.error('Webhook Processing Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
