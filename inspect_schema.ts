import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

try {
  const envJsonPath = path.resolve(process.cwd(), '../.dev.env.json');
  if (fs.existsSync(envJsonPath)) {
    const devEnv = JSON.parse(fs.readFileSync(envJsonPath, 'utf8'));
    if (devEnv.NEXT_PUBLIC_SUPABASE_URL) supabaseUrl = devEnv.NEXT_PUBLIC_SUPABASE_URL;
    if (devEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) supabaseKey = devEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
} catch (err) {}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('--- Inspecting Database Schema to discover exact types ---');
  
  const { data: orders, error: oErr } = await supabase.from('orders').select('*').limit(1);
  if (oErr) {
    console.error('orders inspect error:', oErr.message);
  } else {
    console.log('orders row layout:', orders[0] ? Object.keys(orders[0]) : 'Empty table');
    if (orders[0]) console.log('Sample Order:', JSON.stringify(orders[0], null, 2));
  }

  const { data: payments, error: pErr } = await supabase.from('payments').select('*').limit(1);
  if (pErr) {
    console.error('payments inspect error:', pErr.message);
  } else {
    console.log('payments row layout:', payments[0] ? Object.keys(payments[0]) : 'Empty table');
    if (payments[0]) console.log('Sample Payment:', JSON.stringify(payments[0], null, 2));
  }

  const { data: payment_logs, error: lErr } = await supabase.from('payment_logs').select('*').limit(1);
  if (lErr) {
    console.error('payment_logs inspect error:', lErr.message);
  } else {
    console.log('payment_logs row layout:', payment_logs[0] ? Object.keys(payment_logs[0]) : 'Empty table');
    if (payment_logs[0]) console.log('Sample Log:', JSON.stringify(payment_logs[0], null, 2));
  }
}

inspectSchema();
