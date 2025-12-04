import { Translator } from "./types";

export class TranslatorStub implements Translator {
  async detect(text: string): Promise<string> {
    // Very naive detection:
    if(/\b(hola|gracias|cómo|buenos días)\b/i.test(text)) return "es";
    return "en";
  }
  async translate(text: string, target: string): Promise<string> {
    // Stub: does not truly translate; in a real system plug in a translation API.
    return text;
  }
}
