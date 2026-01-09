/**
 * Glucose Entry Page
 * 
 * Smart router that sends users to onboarding or dashboard based on their setup status
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlucoseData } from '../hooks/useGlucoseData';

export function GlucoseEntryPage() {
  const navigate = useNavigate();
  const { hasOnboarded, isLoading } = useGlucoseData();

  useEffect(() => {
    if (!isLoading) {
      if (hasOnboarded) {
        navigate('/glucose/dashboard', { replace: true });
      } else {
        navigate('/glucose/onboarding', { replace: true });
      }
    }
  }, [hasOnboarded, isLoading, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontSize: '1.5rem'
    }}>
      Loading...
    </div>
  );
}

