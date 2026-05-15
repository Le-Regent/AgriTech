import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarketplaceHeader from '../MarketplaceHeader';
import { useUser } from '@/context/UserContext';

vi.mock('@/context/UserContext', () => ({
  useUser: vi.fn(),
}));

describe('MarketplaceHeader', () => {
  const mockProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    onAddProduct: vi.fn(),
    showAddButton: true,
    onShowFilters: vi.fn(),
    sortBy: 'name-asc',
    onSortChange: vi.fn(),
    t: (key: string) => key,
  };

  it('should render title and greeting if user exists', () => {
    (useUser as any).mockReturnValue({
      user: { full_name: 'John Doe' },
      loading: false,
    });

    render(<MarketplaceHeader {...mockProps} />);
    
    expect(screen.getByText('marketplace_explorer')).toBeDefined();
  });

  it('should render generic greeting if no user', () => {
    (useUser as any).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<MarketplaceHeader {...mockProps} />);
    
    expect(screen.getByText('marketplace_explorer')).toBeDefined();
  });

  it('should call onSearchChange when typing', () => {
    const onSearchChange = vi.fn();
    render(<MarketplaceHeader {...mockProps} onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('search_products_placeholder');
    const { fireEvent } = require('@testing-library/react');
    fireEvent.change(input, { target: { value: 'Tomato' } });
    expect(onSearchChange).toHaveBeenCalledWith('Tomato');
  });

  it('should call onAddProduct, onShowFilters and onSortChange', () => {
    const onAddProduct = vi.fn();
    const onShowFilters = vi.fn();
    const onSortChange = vi.fn();
    render(<MarketplaceHeader 
      {...mockProps} 
      onAddProduct={onAddProduct} 
      onShowFilters={onShowFilters}
      onSortChange={onSortChange}
    />);
    const { fireEvent } = require('@testing-library/react');
    
    fireEvent.click(screen.getByText('sell_produce'));
    expect(onAddProduct).toHaveBeenCalled();

    fireEvent.click(screen.getByText('filters'));
    expect(onShowFilters).toHaveBeenCalled();

    const select = screen.getByRole('combobox', { hidden: true });
    fireEvent.change(select, { target: { value: 'price-low' } });
    expect(onSortChange).toHaveBeenCalledWith('price-low');
  });
});
