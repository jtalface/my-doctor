export interface NavigationControlsProps {
  /** Whether back navigation is available */
  canGoBack: boolean;
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Optional: Show the history count */
  historyCount?: number;
  /** Optional CSS class for the container */
  className?: string;
  /** Optional CSS class for the back button */
  buttonClassName?: string;
}

export interface BackButtonProps {
  /** Whether the button is disabled */
  disabled: boolean;
  /** Callback when clicked */
  onClick: () => void;
  /** Optional CSS class */
  className?: string;
  /** Optional: Number of steps back available */
  historyCount?: number;
}

