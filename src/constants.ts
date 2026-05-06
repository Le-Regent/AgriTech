import { NavItem, Product } from './types';
import { 
  LayoutDashboard, 
  Search, 
  Truck, 
  History, 
  MessageSquare, 
  User, 
  Store, 
  ShoppingCart, 
  Sprout, 
  FileText, 
  BarChart3, 
  Terminal, 
  Users, 
  Wallet, 
  Activity, 
  LogOut,
  ShieldCheck
} from 'lucide-react';

export const SIDEBAR_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Diagnosis', icon: Search, path: '/diagnosis', roles: ['farmer'] },
  { label: 'Logistics', icon: Truck, path: '/logistics', roles: ['farmer'] },
  { label: 'History', icon: History, path: '/history' },
  { label: 'Messages', icon: MessageSquare, path: '/messages' },
  { label: 'Profile', icon: User, path: '/profile' },
];

export const MARKETPLACE_NAV: NavItem[] = [
  { label: 'Marketplace', icon: Store, path: '/marketplace' },
  { label: 'Cart', icon: ShoppingCart, path: '/cart' },
  { label: 'Messages', icon: MessageSquare, path: '/messages' },
  { label: 'My Listings', icon: Sprout, path: '/listings', roles: ['farmer'] },
  { label: 'Orders', icon: FileText, path: '/orders' },
  { label: 'Insights', icon: BarChart3, path: '/insights', roles: ['farmer'] },
  { label: 'Logistics', icon: Truck, path: '/logistics', roles: ['farmer'] },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Command Center', icon: Terminal, path: '/admin/dashboard' },
  { label: 'User Directory', icon: Users, path: '/admin/users' },
  { label: 'Market Ledger', icon: Wallet, path: '/admin/transactions' },
  { label: 'System Health', icon: Activity, path: '/admin/health' },
  { label: 'Exit Admin', icon: LogOut, path: '/' },
];

export const INITIAL_PRODUCTS: Product[] = [];
