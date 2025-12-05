import React from 'react';
import type { NodeInputProps } from './types';
import { ChoiceInput } from './ChoiceInput';
import { TextInput } from './TextInput';

/**
 * NodeInput - Orchestrator component that renders the appropriate input
 * based on the current node's inputType and available choices.
 * 
 * - "choice" with choices[] → renders ChoiceInput (buttons for each choice)
 * - "text" → renders TextInput (text field with submit)
 * - "none" → renders nothing (auto-continue state)
 */
export const NodeInput: React.FC<NodeInputProps> = ({
  node,
  onInput,
  className,
  styles = {}
}) => {
  const { buttonClassName, inputClassName } = styles;

  // Guard: no node available
  if (!node) {
    return null;
  }

  const { inputType, choices } = node;

  // Handle "choice" input type
  if (inputType === 'choice' && choices && choices.length > 0) {
    return (
      <ChoiceInput
        choices={choices}
        onSelect={onInput}
        className={className}
        buttonClassName={buttonClassName}
      />
    );
  }

  // Handle "text" input type
  if (inputType === 'text') {
    return (
      <TextInput
        onSubmit={onInput}
        className={className}
        inputClassName={inputClassName}
        buttonClassName={buttonClassName}
      />
    );
  }

  // Handle "none" input type - no input needed, state auto-transitions
  // If no transitions, this is an end state - disable the button
  if (inputType === 'none') {
    const isEndState = !node.transitions || node.transitions.length === 0;
    
    if (isEndState) {
      return (
        <div className={className}>
          <button 
            className={buttonClassName}
            disabled
            title="Session ended"
          >
            Session Complete
          </button>
        </div>
      );
    }
    
    return (
      <div className={className}>
        <button 
          className={buttonClassName}
          onClick={() => onInput('continue')}
        >
          Continue
        </button>
      </div>
    );
  }

  // Fallback: unknown input type, provide generic text input
  return (
    <TextInput
      onSubmit={onInput}
      className={className}
      placeholder="Enter your response..."
      inputClassName={inputClassName}
      buttonClassName={buttonClassName}
    />
  );
};

export default NodeInput;

