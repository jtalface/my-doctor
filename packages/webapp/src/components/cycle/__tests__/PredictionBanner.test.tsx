/**
 * PredictionBanner Component Tests
 * 
 * Tests the cycle prediction banner component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../__tests__/test-utils';
import { PredictionBanner } from '../PredictionBanner';
import type { Prediction } from '../../../types/cycle';

describe('PredictionBanner Component', () => {
  describe('Regular Cycle Predictions', () => {
    const regularPrediction: Prediction = {
      type: 'regular',
      nextPeriod: {
        start: '2024-02-15',
        end: '2024-02-20',
      },
      fertileWindow: {
        start: '2024-02-05',
        end: '2024-02-10',
      },
      ovulation: {
        date: '2024-02-08',
      },
      confidence: 'high',
      basedOnCycles: 6,
    };

    it('renders next period prediction', () => {
      render(<PredictionBanner predictions={regularPrediction} />);
      
      // Should show "in X days" or "today"
      expect(screen.getByText(/period|days/i)).toBeInTheDocument();
    });

    it('renders period date range', () => {
      render(<PredictionBanner predictions={regularPrediction} />);
      
      expect(screen.getByText(/feb.*15/i)).toBeInTheDocument();
      expect(screen.getByText(/feb.*20/i)).toBeInTheDocument();
    });

    it('renders fertile window', () => {
      render(<PredictionBanner predictions={regularPrediction} />);
      
      expect(screen.getByText(/fertile window/i)).toBeInTheDocument();
      expect(screen.getByText(/feb.*5/i)).toBeInTheDocument();
      expect(screen.getByText(/feb.*10/i)).toBeInTheDocument();
    });

    it('renders ovulation date', () => {
      render(<PredictionBanner predictions={regularPrediction} />);
      
      expect(screen.getByText(/ovulation/i)).toBeInTheDocument();
      expect(screen.getByText(/feb.*8/i)).toBeInTheDocument();
    });

    it('shows flower icon', () => {
      render(<PredictionBanner predictions={regularPrediction} />);
      
      expect(screen.getByText('🌸')).toBeInTheDocument();
    });
  });

  describe('Irregular Cycle Predictions', () => {
    const irregularPrediction: Prediction = {
      type: 'irregular',
      nextPeriod: {
        startRange: {
          min: '2024-02-10',
          max: '2024-02-18',
        },
        endRange: {
          min: '2024-02-15',
          max: '2024-02-23',
        },
      },
      fertileWindow: {
        start: '2024-02-01',
        end: '2024-02-10',
      },
      ovulation: {
        dateRange: {
          min: '2024-02-04',
          max: '2024-02-08',
        },
      },
      confidence: 'low',
      basedOnCycles: 2,
    };

    it('renders irregular prediction message', () => {
      render(<PredictionBanner predictions={irregularPrediction} />);
      
      // Should show "around X days" for irregular
      expect(screen.getByText(/around|days/i)).toBeInTheDocument();
    });

    it('renders estimated range text', () => {
      render(<PredictionBanner predictions={irregularPrediction} />);
      
      expect(screen.getByText(/estimated|range/i)).toBeInTheDocument();
    });

    it('renders period date range', () => {
      render(<PredictionBanner predictions={irregularPrediction} />);
      
      expect(screen.getByText(/feb.*10/i)).toBeInTheDocument();
      expect(screen.getByText(/feb.*23/i)).toBeInTheDocument();
    });

    it('renders approximate fertile window', () => {
      render(<PredictionBanner predictions={irregularPrediction} />);
      
      expect(screen.getByText(/fertile window/i)).toBeInTheDocument();
    });

    it('renders approximate ovulation range', () => {
      render(<PredictionBanner predictions={irregularPrediction} />);
      
      expect(screen.getByText(/ovulation/i)).toBeInTheDocument();
      expect(screen.getByText(/feb.*4/i)).toBeInTheDocument();
      expect(screen.getByText(/feb.*8/i)).toBeInTheDocument();
    });

    it('applies irregular styling', () => {
      const { container } = render(<PredictionBanner predictions={irregularPrediction} />);
      
      const banner = container.querySelector('.banner');
      expect(banner?.className).toContain('irregular');
    });
  });

  describe('Date Formatting', () => {
    const prediction: Prediction = {
      type: 'regular',
      nextPeriod: {
        start: '2024-01-01',
        end: '2024-01-05',
      },
      fertileWindow: {
        start: '2023-12-22',
        end: '2023-12-27',
      },
      ovulation: {
        date: '2023-12-25',
      },
      confidence: 'high',
      basedOnCycles: 6,
    };

    it('formats dates correctly', () => {
      render(<PredictionBanner predictions={prediction} />);
      
      // Should show abbreviated month and day
      expect(screen.getByText(/jan.*1/i)).toBeInTheDocument();
      expect(screen.getByText(/dec.*25/i)).toBeInTheDocument();
    });
  });

  describe('Translations', () => {
    const prediction: Prediction = {
      type: 'regular',
      nextPeriod: {
        start: '2024-02-15',
        end: '2024-02-20',
      },
      fertileWindow: {
        start: '2024-02-05',
        end: '2024-02-10',
      },
      ovulation: {
        date: '2024-02-08',
      },
      confidence: 'high',
      basedOnCycles: 6,
    };

    it('displays in English by default', () => {
      render(<PredictionBanner predictions={prediction} />);
      
      expect(screen.getByText(/fertile window/i)).toBeInTheDocument();
      expect(screen.getByText(/ovulation/i)).toBeInTheDocument();
    });

    it('displays in Portuguese', () => {
      const mockUser = {
        _id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        isGuest: false,
        preferences: { language: 'pt', notifications: true, dataSharing: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(<PredictionBanner predictions={prediction} />, { mockUser: mockUser as any });
      
      // Portuguese translations
      expect(screen.getByText(/janela fértil/i)).toBeInTheDocument();
      expect(screen.getByText(/ovulação/i)).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    const prediction: Prediction = {
      type: 'regular',
      nextPeriod: {
        start: '2024-02-15',
        end: '2024-02-20',
      },
      fertileWindow: {
        start: '2024-02-05',
        end: '2024-02-10',
      },
      ovulation: {
        date: '2024-02-08',
      },
      confidence: 'high',
      basedOnCycles: 6,
    };

    it('has main prediction section', () => {
      const { container } = render(<PredictionBanner predictions={prediction} />);
      
      expect(container.querySelector('.mainPrediction')).toBeInTheDocument();
    });

    it('has secondary info section', () => {
      const { container } = render(<PredictionBanner predictions={prediction} />);
      
      expect(container.querySelector('.secondaryInfo')).toBeInTheDocument();
    });

    it('has title and subtitle', () => {
      const { container } = render(<PredictionBanner predictions={prediction} />);
      
      expect(container.querySelector('.title')).toBeInTheDocument();
      expect(container.querySelector('.subtitle')).toBeInTheDocument();
    });
  });
});

