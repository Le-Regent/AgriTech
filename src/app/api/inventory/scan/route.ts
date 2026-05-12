import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Product } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.INVENTORY_SCAN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase Admin Key not configured' }, { status: 500 });
  }

  try {
    const now = new Date();

    // 1. Fetch all perishable products
    const { data: products, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_perishable', true);

    if (fetchError) throw fetchError;

    const results = {
      scanned: products?.length || 0,
      updated: 0,
      archived: 0,
      notifications: 0
    };

    for (const product of (products || []) as Product[]) {
      if (!product.expiry_date) continue;

      const expiry = new Date(product.expiry_date);
      const created = new Date(product.created_at);
      const totalLife = expiry.getTime() - created.getTime();
      const remainingLife = expiry.getTime() - now.getTime();
      
      const lifeRatio = remainingLife / totalLife;

      let newStatus = 'Healthy';
      let shouldNotify = false;
      let notificationTitle = '';
      let notificationMessage = '';

      if (now >= expiry) {
        // KILL SWITCH: Auto-archiving
        await archiveProduct(product);
        results.archived++;
        continue;
      } else if (lifeRatio <= 0.1 || remainingLife <= 24 * 60 * 60 * 1000) {
        newStatus = 'Critical';
        if (product.health_status !== 'Critical') {
          shouldNotify = true;
          notificationTitle = '⚠️ Urgent: Product Expiring Soon';
          notificationMessage = `Your ${product.name} will expire in less than 24 hours and be removed. Sell it now!`;
        }
      } else if (lifeRatio <= 0.25) {
        newStatus = 'Warning';
        if (product.health_status !== 'Warning' && product.health_status !== 'Critical') {
          shouldNotify = true;
          notificationTitle = '🔔 Inventory Alert';
          notificationMessage = `Your ${product.name} is entering the "Warning" phase. Consider a 10% discount to speed up the sale.`;
        }
      } else if (lifeRatio <= 0.6) {
        newStatus = 'Good';
      } else {
        newStatus = 'Perfect';
      }

      // Update status if changed
      if (newStatus !== product.health_status) {
        await supabaseAdmin
          .from('products')
          .update({ health_status: newStatus })
          .eq('id', product.id);
        results.updated++;
      }

      // Send notifications
      if (shouldNotify) {
        await supabaseAdmin.from('notifications').insert({
          user_id: product.farmer_id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'stock',
          category: 'primary',
          link: `/marketplace/${product.id}`
        });
        results.notifications++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Inventory Scan Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function archiveProduct(product: Product) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return;
  
  const estimatedLoss = product.stock_quantity * product.price;

  // 1. Log to waste analytics
  await supabaseAdmin.from('waste_analytics').insert({
    farmer_id: product.farmer_id,
    product_name: product.name,
    category: product.category,
    quantity_wasted: product.stock_quantity,
    estimated_loss: estimatedLoss,
    reason: 'expired',
    expiry_date: product.expiry_date
  });

  // 2. Notify farmer
  await supabaseAdmin.from('notifications').insert({
    user_id: product.farmer_id,
    title: '🗑️ Product Removed (Expired)',
    message: `${product.name} has been removed from the shop because it reached its expiry date. View your Waste Logs for details.`,
    type: 'system',
    category: 'system'
  });

  // 3. Delete from active products
  await supabaseAdmin.from('products').delete().eq('id', product.id);
}
