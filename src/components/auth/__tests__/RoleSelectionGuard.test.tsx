import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleSelectionGuard } from '../RoleSelectionGuard';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

vi.mock('@/context/UserContext', () => ({
  useUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('RoleSelectionGuard', () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it('should render children if user has a role', () => {
    (useUser as any).mockReturnValue({
      user: { id: '1', user_type: 'farmer' },
      isAuthReady: true,
      loading: false,
    });

    render(
      <RoleSelectionGuard>
        <div data-testid="child">Content</div>
      </RoleSelectionGuard>
    );

    expect(screen.getByTestId('child')).toBeDefined();
    expect(screen.queryByText(/Identify Yourself/i)).toBeNull();
  });

  it('should show selection UI if user has no role', () => {
    (useUser as any).mockReturnValue({
      user: { id: '1', user_type: null },
      isAuthReady: true,
      loading: false,
    });

    render(
      <RoleSelectionGuard>
        <div data-testid="child">Content</div>
      </RoleSelectionGuard>
    );

    expect(screen.getByText(/Identify Yourself/i)).toBeDefined();
  });

  it('should show selection UI if user is not admin and has no role', () => {
    (useUser as any).mockReturnValue({
      user: { id: '1', user_type: null, is_admin: false },
      isAuthReady: true,
      loading: false,
    });

    render(
      <RoleSelectionGuard>
        <div>Content</div>
      </RoleSelectionGuard>
    );

    expect(screen.getByText(/Identify Yourself/i)).toBeDefined();
  });
});
