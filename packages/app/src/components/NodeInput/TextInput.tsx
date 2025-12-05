import React, { useState } from 'react';
import type { TextInputProps } from './types';

/**
 * Renders a text input field with a submit button.
 * Used when the node's inputType is "text".
 */
export const TextInput: React.FC<TextInputProps> = ({
  placeholder = 'Type your response...',
  onSubmit,
  className,
  inputClassName,
  buttonClassName
}) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className={className}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClassName}
      />
      <button 
        onClick={handleSubmit}
        className={buttonClassName}
        disabled={!value.trim()}
      >
        Send
      </button>
    </div>
  );
};

export default TextInput;

