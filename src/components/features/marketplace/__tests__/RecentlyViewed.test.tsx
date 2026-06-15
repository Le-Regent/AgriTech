import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecentlyViewed from '../RecentlyViewed';

vi.mock('@/components/ui/ResponsiveImage', () => ({
  default: ({ alt }: any) => <img alt={alt} />
}));

describe('RecentlyViewed', () => {
  const mockProps = {
    products: [
      { id: '1', name: 'Tomato', price: 500, unit: 'kg' } as any,
      { id: '2', name: 'Onion', price: 300, unit: 'kg' } as any,
    ],
    onClear: vi.fn(),
    t: (key: string) => key,
  };

  it('should render products', () => {
    render(<RecentlyViewed {...mockProps} />);
    expect(screen.getByText('Tomato')).toBeDefined();
    expect(screen.getByText('Onion')).toBeDefined();
  });

  it('should return null if no products', () => {
    const { container } = render(<RecentlyViewed {...mockProps} products={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should call onClear when clear button clicked', () => {
    render(<RecentlyViewed {...mockProps} />);
    fireEvent.click(screen.getByText('clear'));
    expect(mockProps.onClear).toHaveBeenCalled();
  });
});
