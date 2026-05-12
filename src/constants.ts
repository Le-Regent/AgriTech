import { NavItem, Product } from './types';

export const SIDEBAR_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', path: '/' },
  { label: 'Diagnosis', icon: 'biotech', path: '/diagnosis', roles: ['farmer'] },
  { label: 'Logistics', icon: 'local_shipping', path: '/logistics', roles: ['farmer'] },
  { label: 'History', icon: 'history', path: '/history' },
  { label: 'Messages', icon: 'forum', path: '/messages' },
  { label: 'Profile', icon: 'account_circle', path: '/profile' },
];

export const MARKETPLACE_NAV: NavItem[] = [
  { label: 'Marketplace', icon: 'storefront', path: '/marketplace' },
  { label: 'Cart', icon: 'shopping_cart', path: '/cart' },
  { label: 'Messages', icon: 'forum', path: '/messages' },
  { label: 'My Listings', icon: 'potted_plant', path: '/listings', roles: ['farmer'] },
  { label: 'Orders', icon: 'receipt_long', path: '/orders' },
  { label: 'Insights', icon: 'insights', path: '/insights', roles: ['farmer'] },
  { label: 'Logistics', icon: 'local_shipping', path: '/logistics', roles: ['farmer'] },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Command Center', icon: 'terminal', path: '/admin/dashboard' },
  { label: 'Escrow Vault', icon: 'shield_with_heart', path: '/admin/escrow' },
  { label: 'User Directory', icon: 'group', path: '/admin/users' },
  { label: 'Market Ledger', icon: 'account_balance_wallet', path: '/admin/transactions' },
  { label: 'Exit Admin', icon: 'logout', path: '/' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'seed-product-1',
    farmer_id: 'sample-farmer',
    name: 'Fresh Strawberries',
    description: 'Freshly picked organic strawberries from the West region.',
    category: 'Fruits',
    price: 1500,
    unit: 'kg',
    image_url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80',
    stock_quantity: 50,
    initial_stock_quantity: 100,
    is_verified: true,
    location: 'Bafoussam',
    is_perishable: true,
    health_status: 'Perfect',
    certifications: ['Organic'],
    created_at: '2024-03-20T10:00:00Z',
    expiry_date: '2024-03-27T10:00:00Z',
  },
  {
    id: 'seed-product-2',
    farmer_id: 'sample-farmer',
    name: 'Farm Fresh Milk',
    description: 'Unpasteurized fresh morning milk.',
    category: 'Foodstuff',
    price: 800,
    unit: 'liter',
    image_url: 'https://images.unsplash.com/photo-1550583724-125581cc2532?w=800&q=80',
    stock_quantity: 20,
    initial_stock_quantity: 50,
    is_verified: true,
    location: 'Bamenda',
    is_perishable: true,
    health_status: 'Critical',
    certifications: [],
    created_at: '2024-03-18T08:00:00Z',
    expiry_date: '2024-03-20T20:00:00Z', // Expiring soon
  }
];
