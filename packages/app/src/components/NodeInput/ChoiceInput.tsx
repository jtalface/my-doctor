import React from 'react';
import type { ChoiceInputProps } from './types';

/**
 * Renders a group of buttons for each available choice.
 * Used when the node's inputType is "choice".
 */
export const ChoiceInput: React.FC<ChoiceInputProps> = ({
  choices,
  onSelect,
  className,
  buttonClassName
}) => {
  return (
    <div className={className}>
      {choices.map((choice) => (
        <button
          key={choice}
          className={buttonClassName}
          onClick={() => onSelect(choice)}
        >
          {choice}
        </button>
      ))}
    </div>
  );
};

export default ChoiceInput;

