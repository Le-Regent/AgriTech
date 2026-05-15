import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ProgressBar from '../ProgressBar';
import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';

vi.mock('nprogress', () => ({
  default: {
    configure: vi.fn(),
    start: vi.fn(),
    done: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('ProgressBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call NProgress methods on mount and route change', () => {
    (usePathname as any).mockReturnValue('/');
    (useSearchParams as any).mockReturnValue(new URLSearchParams());
    
    vi.useFakeTimers();
    render(<ProgressBar />);
    
    expect(NProgress.configure).toHaveBeenCalled();
    expect(NProgress.start).toHaveBeenCalled();
    
    vi.advanceTimersByTime(100);
    expect(NProgress.done).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should handle unmount cleanup', () => {
    (usePathname as any).mockReturnValue('/');
    const { unmount } = render(<ProgressBar />);
    unmount();
    expect(NProgress.done).toHaveBeenCalled();
  });
});
