import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarketplaceFilters from '../MarketplaceFilters';
import { FilterState } from '@/hooks/useMarketplace';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockFilters: FilterState = {
  search: '',
  category: 'All',
  origin: 'All',
  healthStatus: 'All',
  certification: [],
  season: 'All',
  sortBy: 'latest'
};

const mockT = (key: string) => key;

describe('MarketplaceFilters', () => {
  it('renders filters when open', () => {
    render(
      <MarketplaceFilters 
        filters={mockFilters} 
        setFilters={vi.fn()} 
        isOpen={true} 
        onClose={vi.fn()} 
        t={mockT} 
      />
    );
    
    expect(screen.getByText('Origin Region')).toBeDefined();
    expect(screen.getByText('Health Status')).toBeDefined();
    expect(screen.getByText('Certifications')).toBeDefined();
  });

  it('calls setFilters when a region is selected', () => {
    const setFilters = vi.fn();
    render(
      <MarketplaceFilters 
        filters={mockFilters} 
        setFilters={setFilters} 
        isOpen={true} 
        onClose={vi.fn()} 
        t={mockT} 
      />
    );
    
    fireEvent.click(screen.getByText('Littoral'));
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ origin: 'Littoral' }));
  });

  it('calls onClose when Apply Filters is clicked', () => {
    const onClose = vi.fn();
    render(
      <MarketplaceFilters 
        filters={mockFilters} 
        setFilters={vi.fn()} 
        isOpen={true} 
        onClose={onClose} 
        t={mockT} 
      />
    );
    
    fireEvent.click(screen.getByText('Apply Filters'));
    expect(onClose).toHaveBeenCalled();
  });

  it('toggles certifications correctly', () => {
    const setFilters = vi.fn();
    render(
      <MarketplaceFilters 
        filters={mockFilters} 
        setFilters={setFilters} 
        isOpen={true} 
        onClose={vi.fn()} 
        t={mockT} 
      />
    );
    
    fireEvent.click(screen.getByText('Organic'));
    expect(setFilters).toHaveBeenCalled();
    // Verify it adds organic to the array
    const callArgs = setFilters.mock.calls[0][0];
    expect(callArgs.certification).toContain('Organic');
  });
});
