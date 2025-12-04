import { NLP } from "./types";

export class DummyNLP implements NLP {
  async complete(prompt: string): Promise<string> {
    if(/routine checkup/i.test(prompt)){
      return "Let's do a general check-in. I will ask about your health history and habits.";
    }
    if(/chest pain|shortness of breath|suicid/i.test(prompt)){
      return "Those symptoms can sometimes be serious. I’ll remind you that for urgent or severe symptoms, in-person or emergency care is important.";
    }
    return "Okay, I’ve noted that. I’ll ask a few more questions to understand your situation better.";
  }
}
