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

export const INITIAL_PRODUCTS: Product[] = [];
