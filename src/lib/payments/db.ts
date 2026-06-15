import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const LOCAL_DB_PATH = '/tmp/momo_payments_db.json';

interface LocalDB {
  payments: any[];
  orders: any[];
  payment_logs: any[];
}

function getLocalDB(): LocalDB {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initial: LocalDB = { payments: [], orders: [], payment_logs: [] };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const content = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.warn('[Dual-DB] Error reading local file database, resetting:', err);
    return { payments: [], orders: [], payment_logs: [] };
  }
}

function writeLocalDB(db: LocalDB) {
  try {
    // Ensure the folder exists (it is in /tmp so normally file creation is direct)
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('[Dual-DB] Error writing to local file database:', err);
  }
}

export const dualPersistenceDb = {
  /**
   * Saves or updates a payment record in both Supabase and the local fallback DB
   */
  async savePayment(paymentData: any) {
    console.log('[Dual-DB] savePayment initiated:', paymentData);
    let supabaseResult: any = null;
    let supabaseError: any = null;

    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('payments')
        .upsert([
          {
            order_id: paymentData.order_id,
            campay_reference: paymentData.campay_reference || paymentData.stripe_payment_id || null,
            stripe_payment_id: paymentData.stripe_payment_id || paymentData.campay_reference || null,
            campay_id: paymentData.campay_id || null,
            amount: Number(paymentData.amount),
            currency: paymentData.currency || 'XAF',
            status: paymentData.status || 'pending',
            method: paymentData.method || 'mobile-money',
            created_at: paymentData.created_at || new Date().toISOString()
          }
        ], { onConflict: 'order_id' })
        .select()
        .single();

      if (error) {
        supabaseError = error;
        console.warn('[Dual-DB] Supabase payment upsert failed or RLS blocked. Falling back. Error:', error.message);
      } else {
        supabaseResult = data;
        console.log('[Dual-DB] Payment saved to Supabase successfully:', data);
      }
    } catch (err: any) {
      supabaseError = err;
      console.warn('[Dual-DB] Caught error saving payment to Supabase, falling back:', err.message);
    }

    // Always mirror to Local Fallback Database
    const localDb = getLocalDB();
    const existingIndex = localDb.payments.findIndex(
      p => p.order_id === paymentData.order_id || (p.campay_reference && p.campay_reference === paymentData.campay_reference)
    );

    const paymentRecord = {
      id: supabaseResult?.id || paymentData.id || `local_pay_${Math.random().toString(36).substring(2, 10)}`,
      order_id: paymentData.order_id,
      campay_reference: paymentData.campay_reference || paymentData.stripe_payment_id || null,
      stripe_payment_id: paymentData.stripe_payment_id || paymentData.campay_reference || null,
      campay_id: paymentData.campay_id || null,
      amount: Number(paymentData.amount),
      currency: paymentData.currency || 'XAF',
      status: paymentData.status || 'pending',
      method: paymentData.method || 'mobile-money',
      created_at: paymentData.created_at || new Date().toISOString(),
      synced_to_cloud: !supabaseError
    };

    if (existingIndex >= 0) {
      localDb.payments[existingIndex] = { ...localDb.payments[existingIndex], ...paymentRecord };
    } else {
      localDb.payments.push(paymentRecord);
    }
    writeLocalDB(localDb);

    return paymentRecord;
  },

  /**
   * Retrieves payments from local state or cloud
   */
  async getPaymentByOrderId(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('[Dual-DB] Error querying Supabase payment. Fetching local.');
    }

    const localDb = getLocalDB();
    return localDb.payments.find(p => p.order_id === orderId) || null;
  },

  /**
   * Retrieves payment by campay reference
   */
  async getPaymentByReference(reference: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .or(`campay_reference.eq.${reference},campay_id.eq.${reference},stripe_payment_id.eq.${reference}`)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('[Dual-DB] Error querying Supabase payment by reference. Fetching local.');
    }

    const localDb = getLocalDB();
    return localDb.payments.find(
      p => p.campay_reference === reference || p.campay_id === reference || p.stripe_payment_id === reference
    ) || null;
  },

  /**
   * Get all payments (merged from Supabase and fallback)
   */
  async getAllPayments() {
    let cloudPayments: any[] = [];
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*');
      if (!error && data) {
        cloudPayments = data;
      }
    } catch (err) {
      console.warn('[Dual-DB] Failed to fetch payments from cloud. Using local only.');
    }

    const localDb = getLocalDB();
    
    // Merge cloud and local payments, prioritizing cloud but keeping unique local unsynced records
    const merged = [...cloudPayments];
    localDb.payments.forEach(lp => {
      const exists = merged.some(cp => cp.order_id === lp.order_id);
      if (!exists) {
        merged.push(lp);
      }
    });

    return merged;
  },

  /**
   * Saves or updates an order in Supabase & local DB
   */
  async saveOrder(orderData: any) {
    let supabaseResult: any = null;
    let supabaseError: any = null;

    try {
      // First, check if order exists in Supabase
      const { data: existing, error: findError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderData.id)
        .maybeSingle();

      if (!findError && existing) {
        // Update existing order
        const { data, error } = await supabase
          .from('orders')
          .update({
            status: orderData.status,
            otp_code: orderData.otp_code || existing.otp_code,
            delivered_at: orderData.delivered_at || existing.delivered_at,
            shipped_at: orderData.shipped_at || existing.shipped_at,
            shipping_address: orderData.shipping_address || existing.shipping_address
          })
          .eq('id', orderData.id)
          .select()
          .single();

        if (error) {
          supabaseError = error;
        } else {
          supabaseResult = data;
        }
      } else {
        // Insert new order
        const { data, error } = await supabase
          .from('orders')
          .insert([{
            id: orderData.id,
            buyer_id: orderData.buyer_id,
            total_amount: Number(orderData.total_amount),
            status: orderData.status || 'pending',
            shipping_address: orderData.shipping_address || 'Cameroon',
            otp_code: orderData.otp_code || null,
            created_at: orderData.created_at || new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          supabaseError = error;
        } else {
          supabaseResult = data;
        }
      }
    } catch (err: any) {
      supabaseError = err;
    }

    // Capture Local State
    const localDb = getLocalDB();
    const existingIndex = localDb.orders.findIndex(o => o.id === orderData.id);

    const orderRecord = {
      id: orderData.id,
      buyer_id: orderData.buyer_id || supabaseResult?.buyer_id || null,
      total_amount: Number(orderData.total_amount),
      status: orderData.status || 'pending',
      shipping_address: orderData.shipping_address || 'Cameroon',
      otp_code: orderData.otp_code || supabaseResult?.otp_code || null,
      created_at: orderData.created_at || new Date().toISOString(),
      delivered_at: orderData.delivered_at || null,
      shipped_at: orderData.shipped_at || null,
      synced_to_cloud: !supabaseError
    };

    if (existingIndex >= 0) {
      localDb.orders[existingIndex] = { ...localDb.orders[existingIndex], ...orderRecord };
    } else {
      localDb.orders.push(orderRecord);
    }
    writeLocalDB(localDb);

    return orderRecord;
  },

  /**
   * Retrieves orders merging cloud & local
   */
  async getAllOrders() {
    let cloudOrders: any[] = [];
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!buyer_id(id, full_name, email, avatar_url)
        `);
      if (!error && data) {
        cloudOrders = data;
      }
    } catch (err) {
      console.warn('[Dual-DB] Failed to fetch orders from cloud. Using local only.');
    }

    const localDb = getLocalDB();
    const merged = [...cloudOrders];

    localDb.orders.forEach(lo => {
      const exists = merged.some(co => co.id === lo.id);
      if (!exists) {
        // Form friendly structure
        merged.push({
          ...lo,
          buyer: {
            id: lo.buyer_id,
            full_name: 'Local Sandbox Buyer',
            email: 'buyer@momo-sandbox.cm',
            avatar_url: null
          },
          order_items: []
        });
      }
    });

    return merged;
  },

  /**
   * Log Payment Audit Trail
   */
  async logPaymentEvent(activity: string, details: any) {
    try {
      await supabase
        .from('payment_logs')
        .insert([{
          activity,
          payload: details,
          created_at: new Date().toISOString()
        }]);
    } catch (e) {
      console.warn('[Dual-DB] Failed to save payment log to cloud. Saving locally.');
    }

    // Mirror locally
    const localDb = getLocalDB();
    localDb.payment_logs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      activity,
      payload: details,
      created_at: new Date().toISOString()
    });
    writeLocalDB(localDb);
  },

  /**
   * Force synchronizes any unsynced local records to cloud (self-healing driver loop)
   */
  async syncLocalToCloud() {
    const localDb = getLocalDB();
    let syncCount = 0;

    console.log('[Dual-DB-Sync] Starting background synchronization of unsynced transactions...');

    // 1. Sync orders
    for (const order of localDb.orders) {
      if (!order.synced_to_cloud) {
        try {
          const { error } = await supabase
            .from('orders')
            .upsert([{
              id: order.id,
              buyer_id: order.buyer_id,
              total_amount: order.total_amount,
              status: order.status,
              shipping_address: order.shipping_address,
              otp_code: order.otp_code,
              created_at: order.created_at,
              delivered_at: order.delivered_at,
              shipped_at: order.shipped_at
            }]);
          
          if (!error) {
            order.synced_to_cloud = true;
            syncCount++;
          }
        } catch (e) {
          console.warn(`[Dual-DB-Sync] Failed to sync order ${order.id}:`, e);
        }
      }
    }

    // 2. Sync payments
    for (const payment of localDb.payments) {
      if (!payment.synced_to_cloud) {
        try {
          const { error } = await supabase
            .from('payments')
            .upsert([{
              order_id: payment.order_id,
              campay_reference: payment.campay_reference,
              stripe_payment_id: payment.stripe_payment_id,
              campay_id: payment.campay_id,
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status,
              method: payment.method,
              created_at: payment.created_at
            }], { onConflict: 'order_id' });

          if (!error) {
            payment.synced_to_cloud = true;
            syncCount++;
          }
        } catch (e) {
          console.warn(`[Dual-DB-Sync] Failed to sync payment for order ${payment.order_id}:`, e);
        }
      }
    }

    if (syncCount > 0) {
      writeLocalDB(localDb);
      console.log(`[Dual-DB-Sync] Successfully synchronized ${syncCount} records to Supabase.`);
    }

    return syncCount;
  }
};
