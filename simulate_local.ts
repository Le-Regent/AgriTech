import fs from 'fs';
import path from 'path';

const LOCAL_DB_PATH = '/tmp/momo_payments_db.json';

interface LocalDB {
  payments: any[];
  orders: any[];
  payment_logs: any[];
}

async function simulateLocalSeed() {
  console.log('🧪 Simulating Local Reconciler Database Seed...');
  console.log('--------------------------------------------------');

  const TARGET_REF = '91d17169-14c9-458f-8248-c1ee72b81bd1';
  const MOCK_ORDER_ID = '20d17169-14c9-458f-8248-c1ee72b81bd3';
  const BUYER_PROFILE_ID = 'b3478d20-edbf-4157-bf60-62dd2814e8fd';

  // Ensure directories exist
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create highly structured mock dual persistence database content matching standard Cameroon Momo setup
  const localDb: LocalDB = {
    payments: [
      {
        order_id: MOCK_ORDER_ID,
        campay_reference: TARGET_REF,
        campay_id: TARGET_REF,
        amount: 2500,
        currency: 'XAF',
        status: 'completed',
        method: 'mobile_money',
        created_at: new Date().toISOString()
      }
    ],
    orders: [
      {
        id: MOCK_ORDER_ID,
        buyer_id: BUYER_PROFILE_ID,
        total_amount: 2500,
        status: 'COMPLETED',
        shipping_address: 'Yaounde Cameroon',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    payment_logs: [
      {
        id: 'log-e2e-reconciliation-91d17169',
        event: 'SELF_HEALING_RECONCILIATION_SYNC',
        order_id: MOCK_ORDER_ID,
        reference: TARGET_REF,
        amount: 2500,
        status: 'SUCCESSFUL',
        created_at: new Date().toISOString()
      }
    ]
  };

  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localDb, null, 2), 'utf-8');
  console.log(`✅ Success: Dual-layer fallback DB written successfully to offline mock cache: ${LOCAL_DB_PATH}`);
  console.log('--------------------------------------------------');
}

simulateLocalSeed().catch(err => {
  console.error('Local seed simulation failed:', err);
});
