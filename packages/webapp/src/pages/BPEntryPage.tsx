/**
 * BP Entry Page
 * 
 * Smart entry point that redirects based on onboarding status
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBPData } from '../hooks/useBPData';

export function BPEntryPage() {
  const navigate = useNavigate();
  const { hasOnboarded, isLoading } = useBPData();

  useEffect(() => {
    if (!isLoading) {
      if (hasOnboarded) {
        navigate('/bp/dashboard', { replace: true });
      } else {
        navigate('/bp/onboarding', { replace: true });
      }
    }
  }, [hasOnboarded, isLoading, navigate]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Loading...
    </div>
  );
}

