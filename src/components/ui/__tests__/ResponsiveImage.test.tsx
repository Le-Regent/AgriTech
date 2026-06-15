import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResponsiveImage from '../ResponsiveImage';

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

describe('ResponsiveImage', () => {
  it('should render the image with correct alt text', () => {
    render(<ResponsiveImage src="/test.jpg" alt="Test Image" />);
    const img = screen.getByAltText('Test Image');
    expect(img).toBeDefined();
  });

  it('should return null if no src is provided', () => {
    const { container } = render(<ResponsiveImage src="" alt="No Src" />);
    expect(container.firstChild).toBeNull();
  });

  it('should apply custom className', () => {
    const { container } = render(<ResponsiveImage src="/test.jpg" alt="Test" className="custom-class" />);
    expect(container.firstChild?.parentElement?.innerHTML).toContain('custom-class');
  });

  it('should show the image once loaded', () => {
    render(<ResponsiveImage src="/test.jpg" alt="Test" />);
    const img = screen.getByAltText('Test');
    fireEvent.load(img);
    expect(img.className).toContain('opacity-100');
  });
});
