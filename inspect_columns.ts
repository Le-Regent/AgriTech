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

async function inspectColumns() {
  console.log('Inserting row with event in payment_logs to see complete schema columns...');
  
  const { data, error } = await supabase
    .from('payment_logs')
    .insert([{ event: 'TEST_EVENT' }])
    .select();

  if (error) {
    console.log('Error inserting:', error.message);
    console.log('Full Error Object:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success insert! Returned columns:');
    console.log(JSON.stringify(data[0], null, 2));
    
    // Cleanup the test log if possible
    if (data[0] && data[0].id) {
      await supabase.from('payment_logs').delete().eq('id', data[0].id);
      console.log('Test clean-up done.');
    }
  }
}

inspectColumns();
