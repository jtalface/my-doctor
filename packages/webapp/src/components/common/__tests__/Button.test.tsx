/**
 * Example Test: Button Component
 * 
 * This is a starter test to demonstrate testing patterns.
 * Uncomment and run with: pnpm test Button.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../../__tests__/test-utils';
import { Button } from '../Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with text content', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} disabled>Click me</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('shows loading state', () => {
      render(<Button isLoading>Submit</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // Adjust this based on your actual loading indicator
      // expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('applies disabled state', () => {
      render(<Button disabled>Submit</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Variants', () => {
    it('applies primary variant class', () => {
      render(<Button variant="primary">Primary</Button>);
      
      const button = screen.getByRole('button');
      // Adjust based on your actual CSS module class names
      expect(button.className).toContain('primary');
    });

    it('applies outline variant class', () => {
      render(<Button variant="outline">Outline</Button>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('outline');
    });
  });

  describe('Sizes', () => {
    it('applies small size class', () => {
      render(<Button size="sm">Small</Button>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('sm');
    });

    it('applies large size class', () => {
      render(<Button size="lg">Large</Button>);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('lg');
    });
  });

  describe('Accessibility', () => {
    it('has correct button role', () => {
      render(<Button>Accessible</Button>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Custom label">Icon only</Button>);
      
      expect(screen.getByRole('button', { name: 'Custom label' })).toBeInTheDocument();
    });

    it('supports aria-disabled', () => {
      render(<Button disabled aria-disabled="true">Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });
});

