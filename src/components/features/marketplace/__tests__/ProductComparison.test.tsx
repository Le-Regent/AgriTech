import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductComparison from '../ProductComparison';

vi.mock('next/image', () => ({
  default: ({ alt }: any) => <img alt={alt} />
}));

describe('ProductComparison', () => {
  const mockProps = {
    products: [
      { id: '1', name: 'Tomato', price: 500, unit: 'kg', location: 'Buea', health_status: 'Excellent', certifications: ['Organic'], category: 'Vegetables' } as any,
      { id: '2', name: 'Onion', price: 300, unit: 'kg', location: 'Bamenda', health_status: 'Good', certifications: [], category: 'Vegetables' } as any,
    ],
    onClose: vi.fn(),
    onClear: vi.fn(),
    t: (key: string) => key,
  };

  it('should render comparison table with product data', () => {
    render(<ProductComparison {...mockProps} />);
    expect(screen.getByText('product_comparison')).toBeDefined();
    expect(screen.getByText('Tomato')).toBeDefined();
    expect(screen.getByText('Onion')).toBeDefined();
    expect(screen.getByText('500 FCFA/kg')).toBeDefined();
    expect(screen.getByText('Organic')).toBeDefined();
    expect(screen.getByText('None')).toBeDefined(); // For Onion's empty certifications
  });

  it('should call onClose when close buttons are clicked', () => {
    render(<ProductComparison {...mockProps} />);
    const closeButtons = screen.getAllByRole('button');
    // Top close button
    fireEvent.click(closeButtons[0]);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    
    // Bottom close button
    fireEvent.click(screen.getByText('close_menu'));
    expect(mockProps.onClose).toHaveBeenCalledTimes(2);
  });

  it('should call onClear when clear button is clicked', () => {
    render(<ProductComparison {...mockProps} />);
    fireEvent.click(screen.getByText('clear'));
    expect(mockProps.onClear).toHaveBeenCalled();
  });
});
