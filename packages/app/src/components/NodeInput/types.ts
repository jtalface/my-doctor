import type { NodeDef } from "@mydoctor/state-machine";

export interface NodeInputStyles {
  /** CSS class for individual buttons */
  buttonClassName?: string;
  /** CSS class for the input field */
  inputClassName?: string;
}

export interface NodeInputProps {
  /** The current node definition */
  node: NodeDef | null;
  /** Callback when user provides input */
  onInput: (value: string) => void;
  /** Optional CSS class name for container */
  className?: string;
  /** CSS class names for styled elements */
  styles?: NodeInputStyles;
}

export interface ChoiceInputProps {
  /** Array of choice options to render as buttons */
  choices: string[];
  /** Callback when a choice is selected */
  onSelect: (choice: string) => void;
  /** Optional CSS class for the container */
  className?: string;
  /** Optional CSS class for individual buttons */
  buttonClassName?: string;
}

export interface TextInputProps {
  /** Placeholder text for the input field */
  placeholder?: string;
  /** Callback when text is submitted */
  onSubmit: (value: string) => void;
  /** Optional CSS class for the container */
  className?: string;
  /** Optional CSS class for the input field */
  inputClassName?: string;
  /** Optional CSS class for the submit button */
  buttonClassName?: string;
}

