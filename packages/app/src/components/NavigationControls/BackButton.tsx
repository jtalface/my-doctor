import React from 'react';
import type { BackButtonProps } from './types';

/**
 * BackButton - A button to navigate to the previous state
 * Shows the number of steps in history when available
 */
export const BackButton: React.FC<BackButtonProps> = ({
  disabled,
  onClick,
  className,
  historyCount
}) => {
  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'No previous state' : 'Go back to previous state'}
    >
      ← Back
      {historyCount !== undefined && historyCount > 0 && (
        <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
          ({historyCount})
        </span>
      )}
    </button>
  );
};

export default BackButton;

