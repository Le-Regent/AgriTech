import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AgriCalendar from '../AgriCalendar';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('AgriCalendar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15'));
  });

  it('should render the current month and year', () => {
    render(<AgriCalendar />);
    expect(screen.getByText(/May 2026/i)).toBeDefined();
  });

  it('should navigate to the previous month', () => {
    render(<AgriCalendar />);
    const prevButton = screen.getAllByRole('button')[0];
    fireEvent.click(prevButton);
    expect(screen.getByText(/April 2026/i)).toBeDefined();
  });

  it('should navigate to the next month', () => {
    render(<AgriCalendar />);
    const nextButton = screen.getAllByRole('button')[1];
    fireEvent.click(nextButton);
    expect(screen.getByText(/June 2026/i)).toBeDefined();
  });

  it('should show the advice for today if available', () => {
    render(<AgriCalendar />);
    // On 2026-05-15, there is a tip "Coffee Pruning"
    expect(screen.getByText(/Coffee Pruning/i)).toBeDefined();
    expect(screen.getByText(/maintenance/i)).toBeDefined();
  });

  it('should render correct badges for different tip types', () => {
    // 2026-05-22 is warning
    vi.setSystemTime(new Date('2026-05-22'));
    const { rerender } = render(<AgriCalendar />);
    expect(screen.getByText('warning')).toBeInTheDocument();

    // 2026-05-10 is harvesting
    vi.setSystemTime(new Date('2026-05-10'));
    rerender(<AgriCalendar />);
    expect(screen.getByText('harvesting')).toBeInTheDocument();
    
    // 2026-04-15 is planting
    vi.setSystemTime(new Date('2026-04-15'));
    rerender(<AgriCalendar />);
    expect(screen.getByText('planting')).toBeInTheDocument();
  });
});
