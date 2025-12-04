export interface Translator {
  detect(text: string): Promise<string>;
  translate(text: string, target: string): Promise<string>;
}
