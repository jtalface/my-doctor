/**
 * Card Component Tests
 * 
 * Tests the Card, CardHeader, CardContent, and CardFooter components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../__tests__/test-utils';
import { Card, CardHeader, CardContent, CardFooter } from '../Card';

describe('Card Component', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      );
      
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders with default variant', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('card');
      expect(card.className).toContain('default');
    });

    it('renders with default padding', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('padding-md');
    });
  });

  describe('Variants', () => {
    it('applies default variant', () => {
      const { container } = render(<Card variant="default">Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('default');
    });

    it('applies elevated variant', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('elevated');
    });

    it('applies outline variant', () => {
      const { container } = render(<Card variant="outline">Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('outline');
    });

    it('applies interactive variant', () => {
      const { container } = render(<Card variant="interactive">Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('interactive');
    });
  });

  describe('Padding', () => {
    it('applies no padding', () => {
      const { container } = render(<Card padding="none">Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('padding-none');
    });

    it('applies small padding', () => {
      const { container } = render(<Card padding="sm">Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('padding-sm');
    });

    it('applies medium padding', () => {
      const { container } = render(<Card padding="md">Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('padding-md');
    });

    it('applies large padding', () => {
      const { container } = render(<Card padding="lg">Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('padding-lg');
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      
      expect(card.className).toContain('custom-class');
    });

    it('forwards HTML attributes', () => {
      render(<Card data-testid="custom-card">Content</Card>);
      
      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });

    it('supports ref forwarding', () => {
      const ref = { current: null as HTMLDivElement | null };
      
      render(<Card ref={ref}>Content</Card>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});

describe('CardHeader Component', () => {
  describe('Rendering', () => {
    it('renders title', () => {
      render(<CardHeader title="Test Title" />);
      
      expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      render(<CardHeader title="Title" subtitle="Subtitle text" />);
      
      expect(screen.getByText('Subtitle text')).toBeInTheDocument();
    });

    it('does not render subtitle when not provided', () => {
      render(<CardHeader title="Title" />);
      
      expect(screen.queryByText(/subtitle/i)).not.toBeInTheDocument();
    });

    it('renders action element when provided', () => {
      render(
        <CardHeader 
          title="Title" 
          action={<button>Action</button>} 
        />
      );
      
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('does not render action when not provided', () => {
      render(<CardHeader title="Title" />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Composition', () => {
    it('renders with full props', () => {
      render(
        <CardHeader 
          title="Card Title"
          subtitle="Card Subtitle"
          action={<button>Edit</button>}
        />
      );
      
      expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
      expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });
  });
});

describe('CardContent Component', () => {
  it('renders children', () => {
    render(
      <CardContent>
        <p>Content paragraph</p>
      </CardContent>
    );
    
    expect(screen.getByText('Content paragraph')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(
      <CardContent className="custom-content">Content</CardContent>
    );
    
    expect(container.firstChild).toHaveClass('custom-content');
  });
});

describe('CardFooter Component', () => {
  it('renders children', () => {
    render(
      <CardFooter>
        <button>Save</button>
        <button>Cancel</button>
      </CardFooter>
    );
    
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(
      <CardFooter className="custom-footer">Footer</CardFooter>
    );
    
    expect(container.firstChild).toHaveClass('custom-footer');
  });
});

describe('Card Composition', () => {
  it('renders complete card with all subcomponents', () => {
    render(
      <Card variant="elevated" padding="lg">
        <CardHeader 
          title="User Profile"
          subtitle="Manage your information"
          action={<button>Edit</button>}
        />
        <CardContent>
          <p>Profile content here</p>
        </CardContent>
        <CardFooter>
          <button>Save</button>
          <button>Cancel</button>
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByRole('heading', { name: 'User Profile' })).toBeInTheDocument();
    expect(screen.getByText('Manage your information')).toBeInTheDocument();
    expect(screen.getByText('Profile content here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});

