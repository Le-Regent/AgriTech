import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import NFCVerificationModal from '../NFCVerificationModal';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('NFCVerificationModal', () => {
  const mockProduct = {
    id: 'prod1',
    name: 'Avocado',
    location: 'Buea',
    created_at: '2026-05-10T10:00:00Z',
    profiles: { full_name: 'Farmer Joe' }
  } as any;

  it('should render correctly when open', () => {
    render(<NFCVerificationModal isOpen={true} onClose={vi.fn()} product={mockProduct} />);
    expect(screen.getByText('Ready to Scan')).toBeInTheDocument();
  });

  it('should simulate scan and show success', async () => {
    vi.useFakeTimers();
    render(<NFCVerificationModal isOpen={true} onClose={vi.fn()} product={mockProduct} />);
    
    fireEvent.click(screen.getByText('Simulate Scan'));
    expect(screen.getByText('Reading Tag...')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    
    expect(screen.getByText('Origin Authenticated')).toBeInTheDocument();
    expect(screen.getByText('Farmer Joe')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<NFCVerificationModal isOpen={true} onClose={onClose} product={mockProduct} />);
    fireEvent.click(screen.getAllByRole('button')[0]); // Header close button
    expect(onClose).toHaveBeenCalled();
  });
});
