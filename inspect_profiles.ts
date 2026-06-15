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

async function inspectProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').limit(5);
  if (error) {
    console.error('Error querying profiles:', error.message);
  } else {
    console.log(`Found ${data.length} profiles:`);
    console.log(JSON.stringify(data, null, 2));
  }
}

inspectProfiles();
