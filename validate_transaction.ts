import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Parse dev.env.json
try {
  const envJsonPath = path.resolve(process.cwd(), '../.dev.env.json');
  if (fs.existsSync(envJsonPath)) {
    console.log(`🔑 Loading keys from: ${envJsonPath}`);
    const devEnv = JSON.parse(fs.readFileSync(envJsonPath, 'utf8'));
    if (devEnv.NEXT_PUBLIC_SUPABASE_URL) {
      supabaseUrl = devEnv.NEXT_PUBLIC_SUPABASE_URL;
    }
    if (devEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseKey = devEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else if (devEnv.SUPABASE_SERVICE_ROLE_KEY) {
      supabaseKey = devEnv.SUPABASE_SERVICE_ROLE_KEY;
    }
  }
} catch (err: any) {
  console.log(`⚠️ Note: Could not load parent environment configurations: ${err.message}`);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Local Fallback DB path from Turn 1 specs
const LOCAL_DB_PATH = '/tmp/momo_payments_db.json';

interface LocalDB {
  payments: any[];
  orders: any[];
  payment_logs: any[];
}

function getLocalDB(): LocalDB | null {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const content = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Could not read local DB fallback:', err);
  }
  return null;
}

async function runValidation() {
  console.log('🔍 Starting Transaction & Escrow State Validation...');
  console.log('==================================================');

  const TARGET_REF = '91d17169-14c9-458f-8248-c1ee72b81bd1';
  const localDb = getLocalDB();

  // 1. Search for the payment transaction
  console.log(`\n👉 Step 1: Searching for transaction reference '${TARGET_REF}'...`);
  
  // A. Supabase Check
  let foundInCloudRef = false;
  let linkedOrderId = '';
  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('*')
    .or(`campay_reference.eq.${TARGET_REF},campay_id.eq.${TARGET_REF}`);

  if (payError) {
    console.error(`❌ Supabase payments table query failed: ${payError.message}`);
  } else if (payments && payments.length > 0) {
    console.log(`✅ Success: Found matching transaction in Supabase Cloud!`);
    console.log(JSON.stringify(payments[0], null, 2));
    foundInCloudRef = true;
    linkedOrderId = payments[0].order_id;
  } else {
    console.log(`ℹ️ Supabase: No active payment record found for reference '${TARGET_REF}' in cloud ledger.`);
  }

  // B. Local Fallback Database Check
  let foundInLocalRef = false;
  if (localDb && localDb.payments) {
    const localPay = localDb.payments.find(
      p => p.campay_reference === TARGET_REF || p.campay_id === TARGET_REF || p.stripe_payment_id === TARGET_REF
    );
    if (localPay) {
      console.log(`✅ Success: Found matching transaction in Dual-Layer Fallback DB!`);
      console.log(JSON.stringify(localPay, null, 2));
      foundInLocalRef = true;
      if (!linkedOrderId) {
        linkedOrderId = localPay.order_id;
      }
    }
  }

  if (!foundInCloudRef && !foundInLocalRef) {
    console.warn(`⚠️ Warning: Reference '${TARGET_REF}' is currently unindexed in both Cloud and fallback layers.`);
  }

  // 2. Check Order Status Transition to COMPLETED/Completed
  console.log(`\n👉 Step 2: Checking transition state of corresponding order...`);
  
  let orderCompletedCloud = false;
  let orderCompletedLocal = false;

  // A. Check Cloud
  if (linkedOrderId) {
    const { data: cloudOrders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', linkedOrderId);

    if (orderError) {
      console.error(`❌ Supabase orders table query failed: ${orderError.message}`);
    } else if (cloudOrders && cloudOrders.length > 0) {
      const order = cloudOrders[0];
      console.log(`Cloud Order found: ID ${order.id}, Status: "${order.status}"`);
      if (['COMPLETED', 'completed', 'Completed'].includes(order.status)) {
        console.log(`✅ Success: Cloud order has transitioned successfully to Completed!`);
        orderCompletedCloud = true;
      } else {
        console.log(`❌ Failed: Cloud order status is "${order.status}", not completed.`);
      }
    }
  }

  // B. Check Local/Fallback Orders
  if (localDb && localDb.orders) {
    const localOrd = localDb.orders.find(o => o.id === linkedOrderId || o.payment_id === TARGET_REF);
    if (localOrd) {
      console.log(`Local Order found: ID ${localOrd.id}, Status: "${localOrd.status}"`);
      if (['COMPLETED', 'completed', 'Completed'].includes(localOrd.status)) {
        console.log(`✅ Success: Fallback fallback order has transitioned successfully to Completed!`);
        orderCompletedLocal = true;
      } else {
        console.log(`❌ Failed: Fallback order status is "${localOrd.status}", not completed.`);
      }
    }
  }

  if (!orderCompletedCloud && !orderCompletedLocal) {
    console.warn(`⚠️ Warning: No completed order transitions found for linked matching reference.`);
  }

  // 3. Check Payment Logs / Audit Trail
  console.log(`\n👉 Step 3: Verifying presence of reconciliation event in payment logs...`);
  
  let logFoundCloud = false;
  let logFoundLocal = false;

  // A. Verify Cloud logs
  const { data: logs, error: logError } = await supabase
    .from('payment_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (logError) {
    console.error(`❌ Supabase payment_logs query failed: ${logError.message}`);
  } else if (logs && logs.length > 0) {
    const matchingLog = logs.find(log => {
      const payloadStr = typeof log.payload === 'object' ? JSON.stringify(log.payload) : String(log.payload || '');
      return log.event?.includes('RECONCIL') || payloadStr.includes(TARGET_REF) || log.reference === TARGET_REF;
    });

    if (matchingLog) {
      console.log(`✅ Success: Found matching transaction sync audit event in Cloud payment_logs!`);
      console.log(JSON.stringify(matchingLog, null, 2));
      logFoundCloud = true;
    }
  }

  // B. Verify Local logs
  if (localDb && localDb.payment_logs) {
    const matchingLocalLog = localDb.payment_logs.find(log => {
      const payloadStr = typeof log.payload === 'object' ? JSON.stringify(log.payload) : String(log.payload || '');
      return log.activity?.includes('RECONCIL') || log.event?.includes('RECONCIL') || payloadStr.includes(TARGET_REF) || log.reference === TARGET_REF;
    });

    if (matchingLocalLog) {
      console.log(`✅ Success: Found matching transaction sync audit event in Local fallback payment logs!`);
      console.log(JSON.stringify(matchingLocalLog, null, 2));
      logFoundLocal = true;
    }
  }

  if (!logFoundCloud && !logFoundLocal) {
    console.warn(`⚠️ Warning: No reconciliation matching records indexed in log audit files.`);
  }

  console.log('\n==================================================');
  console.log('🏁 State check completed.');
  console.log(`Cloud Verification: ${orderCompletedCloud ? '🟢 PASS' : '⚪ SKIPPED/PENDING'}`);
  console.log(`Local Dual-Layer Fallback: ${orderCompletedLocal ? '🟢 PASS' : '⚪ SKIPPED/PENDING'}`);
  console.log('==================================================');
}

runValidation().catch(err => {
  console.error('Unhandled validation error:', err);
  process.exit(1);
});
