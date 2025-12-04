export interface NLP {
  complete(prompt: string): Promise<string>;
  embed?(text: string): Promise<number[]>;
}
