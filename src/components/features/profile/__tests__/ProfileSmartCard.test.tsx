import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileSmartCard from '../ProfileSmartCard';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/components/ui/ResponsiveImage', () => ({
  default: ({ alt }: any) => <img alt={alt} />
}));

describe('ProfileSmartCard', () => {
  const mockUser = {
    id: 'user1',
    full_name: 'John Doe',
    avatar_url: 'https://avatar.url',
    farm_name: 'Green Farm',
  } as any;

  it('should render user information', () => {
    render(<ProfileSmartCard user={mockUser} />);
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Green Farm')).toBeDefined();
    expect(screen.getByText(/KF-USER1/i)).toBeDefined();
  });

  it('should render default values if user info missing', () => {
    const incompleteUser = { id: 'user2' } as any;
    render(<ProfileSmartCard user={incompleteUser} />);
    expect(screen.getByText('KamerFresh Member')).toBeDefined();
    expect(screen.getByText('Independant Farmer')).toBeDefined();
  });
});
