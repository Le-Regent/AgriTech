import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function logPaymentEvent(
  event: string,
  data: {
    orderId?: string;
    paymentId?: string;
    userId?: string;
    amount?: number;
    status?: string;
    reference?: string;
    error?: string;
    duration_ms?: number;
  }
) {
  const logPayload = {
    timestamp: new Date().toISOString(),
    event,
    ...data,
  };
  console.log('[STRUCTURED_PAYMENT_LOG]', JSON.stringify(logPayload));

  try {
    const { error } = await supabase.from('payment_logs').insert([{
      event,
      order_id: data.orderId ? String(data.orderId) : null,
      payment_id: data.paymentId ? String(data.paymentId) : null,
      user_id: data.userId ? String(data.userId) : null,
      amount: data.amount ? Number(data.amount) : null,
      status: data.status || null,
      reference: data.reference || null,
      error: data.error || null,
      duration_ms: data.duration_ms || null,
    }]);

    if (error) {
      console.warn('[PaymentLogger] Supabase logged failed with details:', error.message);
    }
  } catch (err) {
    console.error('[PaymentLogger] Failed to write to payment_logs table:', err);
  }
}
