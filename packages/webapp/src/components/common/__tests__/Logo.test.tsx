/**
 * Logo Component Tests
 * 
 * Tests the Logo component with different sizes and variants
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../__tests__/test-utils';
import { Logo } from '../Logo';

describe('Logo Component', () => {
  describe('Rendering', () => {
    it('renders logo image', () => {
      render(<Logo />);
      
      const logo = screen.getByAltText('Zambe');
      expect(logo).toBeInTheDocument();
      expect(logo.tagName).toBe('IMG');
    });

    it('has correct alt text for accessibility', () => {
      render(<Logo />);
      
      expect(screen.getByAltText('Zambe')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('renders small size (42px)', () => {
      render(<Logo size="sm" />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.style.width).toBe('42px');
      expect(logo.style.height).toBe('42px');
    });

    it('renders medium size (64px) as default', () => {
      render(<Logo />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.style.width).toBe('64px');
      expect(logo.style.height).toBe('64px');
    });

    it('renders large size (96px)', () => {
      render(<Logo size="lg" />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.style.width).toBe('96px');
      expect(logo.style.height).toBe('96px');
    });

    it('renders extra large size (128px)', () => {
      render(<Logo size="xl" />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.style.width).toBe('128px');
      expect(logo.style.height).toBe('128px');
    });
  });

  describe('Variants', () => {
    it('renders mark variant as default', () => {
      render(<Logo />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.src).toContain('zambe-mark');
    });

    it('renders icon variant', () => {
      render(<Logo variant="icon" />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.src).toContain('zambe-icon');
    });

    it('renders mark variant', () => {
      render(<Logo variant="mark" />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.src).toContain('zambe-mark');
    });

    it('renders full variant', () => {
      render(<Logo variant="full" />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.src).toContain('zambe-primary');
    });
  });

  describe('Full Variant Dimensions', () => {
    it('has height style for full variant', () => {
      render(<Logo variant="full" size="md" />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.style.height).toBe('64px');
      expect(logo.style.width).toBe('auto');
    });

    it('scales full variant correctly', () => {
      render(<Logo variant="full" size="lg" />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.style.height).toBe('96px');
    });
  });

  describe('Image Source Selection', () => {
    it('selects appropriate image resolution for small icon', () => {
      render(<Logo variant="icon" size="sm" />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.src).toContain('96x96');
    });

    it('selects higher resolution for larger sizes', () => {
      render(<Logo variant="icon" size="lg" />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.src).toContain('256x256');
    });

    it('selects highest resolution for extra large', () => {
      render(<Logo variant="icon" size="xl" />);
      
      const logo = screen.getByAltText('Zambe') as HTMLImageElement;
      expect(logo.src).toContain('512x512');
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      render(<Logo className="custom-logo" />);
      
      const logo = screen.getByAltText('Zambe');
      expect(logo.className).toContain('custom-logo');
    });

    it('applies size class', () => {
      render(<Logo size="lg" />);
      
      const logo = screen.getByAltText('Zambe');
      expect(logo.className).toContain('lg');
    });
  });
});

