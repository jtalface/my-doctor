import React from 'react';
import type { NavigationControlsProps } from './types';
import { BackButton } from './BackButton';

/**
 * NavigationControls - Container for navigation-related controls
 * Currently includes the back button, extensible for future controls
 * (e.g., restart, skip, breadcrumbs)
 */
export const NavigationControls: React.FC<NavigationControlsProps> = ({
  canGoBack,
  onBack,
  historyCount,
  className,
  buttonClassName
}) => {
  return (
    <div className={className}>
      <BackButton
        disabled={!canGoBack}
        onClick={onBack}
        className={buttonClassName}
        historyCount={historyCount}
      />
    </div>
  );
};

export default NavigationControls;

