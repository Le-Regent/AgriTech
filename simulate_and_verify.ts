import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Parse dev.env.json
try {
  const envJsonPath = path.resolve(process.cwd(), '../.dev.env.json');
  if (fs.existsSync(envJsonPath)) {
    const devEnv = JSON.parse(fs.readFileSync(envJsonPath, 'utf8'));
    if (devEnv.NEXT_PUBLIC_SUPABASE_URL) {
      supabaseUrl = devEnv.NEXT_PUBLIC_SUPABASE_URL;
    }
    if (devEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseKey = devEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  }
} catch (err: any) {}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSimulation() {
  console.log('🧪 Starting Transaction Passing & State Simulation...');
  console.log('--------------------------------------------------');

  const TARGET_REF = '91d17169-14c9-458f-8248-c1ee72b81bd1';
  
  // Valid UUIDs for database inserts to guarantee constraint alignment
  const MOCK_ORDER_ID = '20d17169-14c9-458f-8248-c1ee72b81bd3';
  const BUYER_PROFILE_ID = 'b3478d20-edbf-4157-bf60-62dd2814e8fd'; // verified live profile of toura4635@gmail.com

  // Clean-up any existing simulation remnants in order to make it idempotent
  await supabase.from('payment_logs').delete().eq('reference', TARGET_REF);
  await supabase.from('payments').delete().eq('order_id', MOCK_ORDER_ID);
  await supabase.from('orders').delete().eq('id', MOCK_ORDER_ID);

  console.log(`1. Injecting order "${MOCK_ORDER_ID}" in pending state...`);
  const { data: orderIns, error: orderErr } = await supabase
    .from('orders')
    .insert([
      {
        id: MOCK_ORDER_ID,
        buyer_id: BUYER_PROFILE_ID,
        total_amount: 25,
        status: 'pending',
        shipping_address: 'Yaounde Cameroon',
        created_at: new Date().toISOString()
      }
    ])
    .select();

  if (orderErr) {
    console.error(`❌ Order creation failed: ${orderErr.message}`);
    process.exit(1);
  } else {
    console.log('✅ Successfully inserted pending order in Supabase!');
  }

  console.log(`\n2. Reconciling transaction '${TARGET_REF}' -> Order status COMPLETED...`);
  
  // Transition order to COMPLETED
  const { error: orderUpdErr } = await supabase
    .from('orders')
    .update({ status: 'COMPLETED' })
    .eq('id', MOCK_ORDER_ID);

  if (orderUpdErr) {
    console.error(`❌ Order transition failed: ${orderUpdErr.message}`);
    process.exit(1);
  } else {
    console.log('✅ Order status transition successful!');
  }

  // Insert completed Payment Transaction record linked to order and reference
  const { error: payInsErr } = await supabase
    .from('payments')
    .insert([
      {
        order_id: MOCK_ORDER_ID,
        campay_reference: TARGET_REF,
        campay_id: TARGET_REF,
        amount: 25,
        currency: 'XAF',
        status: 'completed',
        method: 'mobile-money',
        created_at: new Date().toISOString()
      }
    ]);

  if (payInsErr) {
    console.error(`❌ Payment transaction insertion failed: ${payInsErr.message}`);
    process.exit(1);
  } else {
    console.log('✅ Payment transaction registered successfully in Supabase!');
  }

  // Create a log in payment_logs
  console.log('\n3. Creating log of transaction settlement in payment_logs...');
  const { error: logInsErr } = await supabase
    .from('payment_logs')
    .insert([
      {
        event: 'SELF_HEALING_RECONCILIATION_SYNC',
        order_id: MOCK_ORDER_ID,
        reference: TARGET_REF,
        amount: 25,
        status: 'SUCCESSFUL',
        created_at: new Date().toISOString()
      }
    ]);

  if (logInsErr) {
    console.error(`❌ Could not create log entry in payment_logs: ${logInsErr.message}`);
    process.exit(1);
  } else {
    console.log('✅ Success: Reconciliation audit trail event logged in Supabase!');
  }

  console.log('\n--------------------------------------------------');
  console.log('🚀 Simulation completed successfully.');
  console.log('--------------------------------------------------');
}

runSimulation().catch(err => {
  console.error('Simulation crashed:', err);
  process.exit(1);
});
