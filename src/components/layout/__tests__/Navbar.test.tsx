import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from '../Navbar';
import { useUser } from '@/context/UserContext';
import { usePathname } from 'next/navigation';

vi.mock('@/context/UserContext', () => ({
  useUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

vi.mock('@/components/ui/ResponsiveImage', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

vi.mock('@/services/supabaseService', () => ({
  supabaseService: {
    getUnreadNotificationsCount: vi.fn(() => Promise.resolve(0)),
    getNotifications: vi.fn(() => Promise.resolve([])),
    calculateNotifications: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
    a: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', toggleTheme: vi.fn() })),
}));

vi.mock('@/context/CartContext', () => ({
  useCart: vi.fn(() => ({ items: [], total: 0 })),
}));

vi.mock('@/context/OfflineContext', () => ({
  useOffline: vi.fn(() => ({ isOffline: false })),
}));

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({ language: 'en', setLanguage: vi.fn(), t: (s: string) => s })),
}));

vi.mock('@/context/NotificationContext', () => ({
  useNotifications: vi.fn(() => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearNotifications: vi.fn(),
  })),
}));

vi.mock('./NotificationCenter', () => ({
  NotificationCenter: () => <div data-testid="notification-center">Notifications</div>,
}));

describe('Navbar', () => {
  it('should render brand name', () => {
    (useUser as any).mockReturnValue({ user: null, loading: false });
    (usePathname as any).mockReturnValue('/');
    
    render(<Navbar />);
    expect(screen.getByText(/Kamer/i)).toBeDefined();
    expect(screen.getByText(/Fresh/i)).toBeDefined();
  });

  it('should show Guest when user is logged out', () => {
    (useUser as any).mockReturnValue({ user: null, loading: false });
    (usePathname as any).mockReturnValue('/');
    
    render(<Navbar />);
    expect(screen.getAllByText(/Guest/i)).toBeDefined();
  });

  it('should show user profile when logged in', () => {
    (useUser as any).mockReturnValue({ 
      user: { id: 'u1', full_name: 'John Doe', user_type: 'farmer' }, 
      loading: false 
    });
    (usePathname as any).mockReturnValue('/');
    
    render(<Navbar />);
    expect(screen.getByText(/John Doe/i)).toBeDefined();
  });

  it('should reflect active link', () => {
    (useUser as any).mockReturnValue({ user: null, loading: false });
    (usePathname as any).mockReturnValue('/marketplace');
    
    render(<Navbar />);
    const marketLink = screen.getByText(/Marketplace/i);
    expect(marketLink.closest('a')?.className).toContain('text-primary');
  });
});
