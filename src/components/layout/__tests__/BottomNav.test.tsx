import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomNav } from '../BottomNav';
import { usePathname } from 'next/navigation';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock('@/context/UserContext', () => ({
  useUser: vi.fn(() => ({
    user: { user_type: 'farmer' },
  })),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('BottomNav', () => {
  it('should render navigation items', () => {
    (usePathname as any).mockReturnValue('/');
    
    render(<BottomNav />);
    
    expect(screen.getAllByText(/Home/i)).toBeDefined();
    expect(screen.getByText(/Marché/i)).toBeDefined();
    expect(screen.getByText(/Orders/i)).toBeDefined();
  });

  it('should highlight active link', () => {
    (usePathname as any).mockReturnValue('/marketplace');
    
    render(<BottomNav />);
    const marketLink = screen.getByText(/Marché/i).closest('a');
    // The closest('a') should have the text-primary class or its child span
    expect(marketLink).toBeDefined();
    const span = screen.getByText(/Marché/i);
    expect(span.className).toContain('text-primary');
  });
});
