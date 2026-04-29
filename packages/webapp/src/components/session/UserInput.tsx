import { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@components/common';
import styles from './UserInput.module.css';

export interface UserInputProps {
  inputType: 'choice' | 'text' | 'structured' | 'none';
  choices?: string[];
  choiceLabels?: string[];
  allowMultipleChoice?: boolean;
  continueLabel?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function UserInput({
  inputType,
  choices = [],
  choiceLabels = [],
  allowMultipleChoice = false,
  continueLabel = 'Continue',
  placeholder = 'Type your response here...',
  value: controlledValue,
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  className,
}: UserInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const value = controlledValue ?? internalValue;
  
  const handleChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      if (!controlledValue) {
        setInternalValue('');
      }
    }
  };

  const handleChoiceSelect = (choice: string) => {
    if (allowMultipleChoice) {
      setSelectedChoices((prev) => {
        const hasChoice = prev.includes(choice);
        const next = hasChoice ? prev.filter((c) => c !== choice) : [...prev, choice];

        // Keep "none" style options mutually exclusive with any specific condition.
        const nonePattern = /^(none|nenhum|nenhuma|aucun|hakuna)/i;
        const selectedIsNone = nonePattern.test(choice);
        if (selectedIsNone) {
          return hasChoice ? [] : [choice];
        }

        return next.filter((c) => !nonePattern.test(c));
      });
      return;
    }

    onSubmit(choice);
  };

  const handleMultiChoiceSubmit = () => {
    if (selectedChoices.length === 0) return;
    onSubmit(selectedChoices.join(', '));
    setSelectedChoices([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && inputType === 'text') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section 
      className={clsx(styles.userInput, className)}
      role="region"
      aria-label="Your response"
    >
      {inputType === 'choice' && choices.length > 0 && (
        <>
          <div
            className={styles.choiceContainer}
            role={allowMultipleChoice ? 'group' : 'radiogroup'}
            aria-label={allowMultipleChoice ? 'Select one or more options' : 'Select an option'}
          >
            {choices.map((choice, index) => (
              <button
                key={index}
                className={clsx(styles.choiceButton, allowMultipleChoice && selectedChoices.includes(choice) && styles.choiceButtonSelected)}
                onClick={() => handleChoiceSelect(choice)}
                disabled={disabled || isLoading}
                aria-pressed={allowMultipleChoice ? selectedChoices.includes(choice) : undefined}
              >
                {choiceLabels[index] || choice}
              </button>
            ))}
          </div>

          {allowMultipleChoice && (
            <div className={styles.continueContainer}>
              <Button
                onClick={handleMultiChoiceSubmit}
                disabled={disabled || isLoading || selectedChoices.length === 0}
                isLoading={isLoading}
                size="lg"
              >
                {continueLabel}
              </Button>
            </div>
          )}
        </>
      )}

      {inputType === 'text' && (
        <div className={styles.textContainer}>
          <textarea
            className={styles.textArea}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            rows={4}
            maxLength={500}
            aria-describedby="char-count"
          />
          <div className={styles.textFooter}>
            <span id="char-count" className={styles.charCount}>
              {value.length}/500
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              isLoading={isLoading}
              size="md"
            >
              Submit
            </Button>
          </div>
        </div>
      )}

      {inputType === 'none' && (
        <div className={styles.continueContainer}>
          <Button
            onClick={() => onSubmit('continue')}
            disabled={disabled}
            isLoading={isLoading}
            size="lg"
            fullWidth
          >
            Continue
          </Button>
        </div>
      )}
    </section>
  );
}

