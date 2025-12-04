export interface Analytics {
  track(event: string, data?: any): void;
}
