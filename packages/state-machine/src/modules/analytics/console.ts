import { Analytics } from "./types";

export class AnalyticsConsole implements Analytics {
  track(event: string, data?: any): void {
    console.log("[analytics]", event, data || {});
  }
}
