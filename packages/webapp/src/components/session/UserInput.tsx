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
  structuredFields?: Array<{
    id: string;
    label: string;
    placeholder?: string;
  }>;
  structuredMedication?: {
    nameLabel: string;
    namePlaceholder: string;
    mgLabel: string;
    mgPlaceholder: string;
    dosageLabel: string;
    dosageOptions: string[];
    addRowLabel: string;
  };
  structuredSideEffects?: {
    sideEffectsLabel: string;
    sideEffectsPlaceholder: string;
    sideEffectsOptions: string[];
    sideEffectsNoneLabel: string;
    additionalInfoLabel: string;
    additionalInfoPlaceholder: string;
  };
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
  structuredFields = [],
  structuredMedication,
  structuredSideEffects,
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
  const [structuredValues, setStructuredValues] = useState<Record<string, string>>({});
  const [medicationRows, setMedicationRows] = useState<Array<{
    name: string;
    mg: string;
    dosage: string;
  }>>([{ name: '', mg: '', dosage: '' }]);
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([]);
  const [additionalSideEffectInfo, setAdditionalSideEffectInfo] = useState('');
  const [pendingSideEffect, setPendingSideEffect] = useState('');
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
        const nonePattern = /^(none|nenhum|nenhuma|aucun|hakuna|no significant history|sem historial relevante|prefer not to say|prefiro não responder|prefiro nao responder)/i;
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

  const handleStructuredChange = (fieldId: string, newValue: string) => {
    setStructuredValues((prev) => ({
      ...prev,
      [fieldId]: newValue,
    }));
  };

  const handleStructuredSubmit = () => {
    const hasAnyValue = structuredFields.some((field) => (structuredValues[field.id] || '').trim().length > 0);
    if (!hasAnyValue) return;

    const payload = structuredFields
      .map((field) => `${field.label}: ${(structuredValues[field.id] || '').trim() || 'none'}`)
      .join('\n');

    onSubmit(payload);
    setStructuredValues({});
  };

  const handleMedicationRowChange = (
    index: number,
    field: 'name' | 'mg' | 'dosage',
    newValue: string
  ) => {
    setMedicationRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: newValue } : row
      )
    );
  };

  const handleAddMedicationRow = () => {
    setMedicationRows((prev) => [...prev, { name: '', mg: '', dosage: '' }]);
  };

  const handleMedicationSubmit = () => {
    const normalizedRows = medicationRows
      .map((row) => ({
        name: row.name.trim(),
        mg: row.mg.trim(),
        dosage: row.dosage.trim(),
      }))
      .filter((row) => row.name.length > 0);

    if (normalizedRows.length === 0) return;

    const payload = normalizedRows
      .map(
        (row, idx) =>
          `${idx + 1}. ${row.name} | ${row.mg || '—'} mg | ${row.dosage || '—'}`
      )
      .join('\n');

    onSubmit(payload);
    setMedicationRows([{ name: '', mg: '', dosage: '' }]);
  };

  const handleSideEffectsAdd = (value: string) => {
    if (!value) return;
    setSelectedSideEffects((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setPendingSideEffect('');
  };

  const handleSideEffectRemove = (value: string) => {
    setSelectedSideEffects((prev) => prev.filter((item) => item !== value));
  };

  const handleSideEffectsSubmit = () => {
    const note = additionalSideEffectInfo.trim();

    const payload = [
      `Side effects: ${selectedSideEffects.length > 0 ? selectedSideEffects.join(', ') : structuredSideEffects?.sideEffectsNoneLabel || 'none'}`,
      `Additional notes: ${note || 'none'}`,
    ].join('\n');

    onSubmit(payload);
    setSelectedSideEffects([]);
    setAdditionalSideEffectInfo('');
    setPendingSideEffect('');
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

      {inputType === 'structured' && structuredFields.length > 0 && (
        <div className={styles.structuredContainer}>
          {structuredFields.map((field) => (
            <label key={field.id} className={styles.structuredField}>
              <span className={styles.structuredLabel}>{field.label}</span>
              <textarea
                className={styles.textArea}
                placeholder={field.placeholder}
                value={structuredValues[field.id] || ''}
                onChange={(e) => handleStructuredChange(field.id, e.target.value)}
                disabled={disabled || isLoading}
                rows={3}
                maxLength={500}
              />
            </label>
          ))}
          <div className={styles.continueContainer}>
            <Button
              onClick={handleStructuredSubmit}
              disabled={disabled || isLoading || !structuredFields.some((field) => (structuredValues[field.id] || '').trim().length > 0)}
              isLoading={isLoading}
              size="lg"
            >
              {continueLabel}
            </Button>
          </div>
        </div>
      )}

      {inputType === 'structured' && structuredMedication && (
        <div className={styles.structuredContainer}>
          <div className={styles.medicationHeaderRow} aria-hidden="true">
            <span className={styles.medicationHeaderCell}>{structuredMedication.nameLabel}</span>
            <span className={styles.medicationHeaderCell}>{structuredMedication.mgLabel}</span>
            <span className={styles.medicationHeaderCell}>{structuredMedication.dosageLabel}</span>
          </div>
          {medicationRows.map((row, index) => (
            <div key={index} className={styles.medicationRow}>
              <input
                className={styles.medicationInput}
                placeholder={structuredMedication.namePlaceholder}
                value={row.name}
                onChange={(e) => handleMedicationRowChange(index, 'name', e.target.value)}
                disabled={disabled || isLoading}
                aria-label={structuredMedication.nameLabel}
              />
              <input
                className={styles.medicationInput}
                placeholder={structuredMedication.mgPlaceholder}
                value={row.mg}
                onChange={(e) => handleMedicationRowChange(index, 'mg', e.target.value)}
                disabled={disabled || isLoading}
                aria-label={structuredMedication.mgLabel}
              />
              <select
                className={styles.medicationSelect}
                value={row.dosage}
                onChange={(e) => handleMedicationRowChange(index, 'dosage', e.target.value)}
                disabled={disabled || isLoading}
                aria-label={structuredMedication.dosageLabel}
              >
                <option value="">{structuredMedication.dosageLabel}</option>
                {structuredMedication.dosageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className={styles.medicationActions}>
            <Button onClick={handleAddMedicationRow} disabled={disabled || isLoading} variant="ghost" size="sm">
              {structuredMedication.addRowLabel}
            </Button>
            <Button
              onClick={handleMedicationSubmit}
              disabled={disabled || isLoading || !medicationRows.some((row) => row.name.trim().length > 0)}
              isLoading={isLoading}
              size="lg"
            >
              {continueLabel}
            </Button>
          </div>
        </div>
      )}

      {inputType === 'structured' && structuredSideEffects && (
        <div className={styles.structuredContainer}>
          <label className={styles.structuredField}>
            <span className={styles.structuredLabel}>{structuredSideEffects.sideEffectsLabel}</span>
            <div className={styles.sideEffectsPickerRow}>
              <select
                className={styles.medicationSelect}
                value={pendingSideEffect}
                onChange={(e) => handleSideEffectsAdd(e.target.value)}
                disabled={disabled || isLoading}
              >
                <option value="">{structuredSideEffects.sideEffectsPlaceholder}</option>
                {structuredSideEffects.sideEffectsOptions
                  .filter((option) => !selectedSideEffects.includes(option))
                  .map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
              </select>
            </div>
            {selectedSideEffects.length > 0 && (
              <div className={styles.sideEffectsChips}>
                {selectedSideEffects.map((effect) => (
                  <button
                    key={effect}
                    type="button"
                    className={styles.sideEffectChip}
                    onClick={() => handleSideEffectRemove(effect)}
                    disabled={disabled || isLoading}
                  >
                    {effect} <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            )}
          </label>

          <label className={styles.structuredField}>
            <span className={styles.structuredLabel}>{structuredSideEffects.additionalInfoLabel}</span>
            <textarea
              className={styles.textArea}
              placeholder={structuredSideEffects.additionalInfoPlaceholder}
              value={additionalSideEffectInfo}
              onChange={(e) => setAdditionalSideEffectInfo(e.target.value)}
              disabled={disabled || isLoading}
              rows={3}
              maxLength={500}
            />
          </label>

          <div className={styles.continueContainer}>
            <Button
              onClick={handleSideEffectsSubmit}
              disabled={disabled || isLoading}
              isLoading={isLoading}
              size="lg"
            >
              {continueLabel}
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

