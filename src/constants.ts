import { NavItem, Product } from './types';

export const SIDEBAR_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', path: '/' },
  { label: 'Crop Doctor', icon: 'biotech', path: '/diagnosis', roles: ['farmer'] },
  { label: 'Logistics', icon: 'local_shipping', path: '/logistics', roles: ['farmer'] },
  { label: 'Payments', icon: 'history', path: '/history' },
  { label: 'Messages', icon: 'forum', path: '/messages' },
  { label: 'Profile', icon: 'account_circle', path: '/profile' },
];

export const MARKETPLACE_NAV: NavItem[] = [
  { label: 'The Marché', icon: 'storefront', path: '/marketplace' },
  { label: 'Basket', icon: 'shopping_cart', path: '/cart' },
  { label: 'Messages', icon: 'forum', path: '/messages' },
  { label: 'My Boutique', icon: 'potted_plant', path: '/listings', roles: ['farmer'] },
  { label: 'Orders', icon: 'receipt_long', path: '/orders' },
  { label: 'Insights', icon: 'insights', path: '/insights', roles: ['farmer'] },
  { label: 'MoMo Transport', icon: 'local_shipping', path: '/logistics', roles: ['farmer'] },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Control Room', icon: 'terminal', path: '/admin/dashboard' },
  { label: 'Product Catalog', icon: 'inventory_2', path: '/admin/catalog' },
  { label: 'Dispute Center', icon: 'gavel', path: '/admin/disputes' },
  { label: 'Treasury Hub', icon: 'payments', path: '/admin/treasury' },
  { label: 'Safe Pay Hub', icon: 'shield_with_heart', path: '/admin/escrow' },
  { label: 'User Directory', icon: 'group', path: '/admin/users' },
  { label: 'System Audit', icon: 'history', path: '/admin/logs' },
  { label: 'Market Ledger', icon: 'account_balance_wallet', path: '/admin/transactions' },
  { label: 'System Settings', icon: 'settings_suggest', path: '/admin/settings' },
  { label: 'Exit Admin', icon: 'logout', path: '/' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'seed-product-1',
    farmer_id: 'sample-farmer',
    name: 'Fresh Plantains (Kumba)',
    description: 'High quality plantains from the fertile soils of Kumba. Perfect for dodo.',
    category: 'Foodstuff',
    price: 3500,
    unit: 'bunch',
    image_url: 'https://images.unsplash.com/photo-1590602847076-2e86161405e1?w=800&q=80',
    stock_quantity: 50,
    initial_stock_quantity: 100,
    is_verified: true,
    location: 'Kumba',
    is_perishable: true,
    health_status: 'Perfect',
    certifications: ['Organic'],
    created_at: '2024-03-20T10:00:00Z',
    expiry_date: '2024-03-27T10:00:00Z',
  },
  {
    id: 'seed-product-2',
    farmer_id: 'sample-farmer',
    name: 'Njombe Pineapples',
    description: 'Extra sweet and juicy pineapples directly from Njombe farms.',
    category: 'Fruits',
    price: 500,
    unit: 'fruit',
    image_url: 'https://images.unsplash.com/photo-1550258114-68bd295056a2?w=800&q=80',
    stock_quantity: 120,
    initial_stock_quantity: 150,
    is_verified: true,
    location: 'Njombe',
    is_perishable: true,
    health_status: 'Perfect',
    certifications: [],
    created_at: '2024-03-18T08:00:00Z',
    expiry_date: '2024-03-20T20:00:00Z',
  }
];
