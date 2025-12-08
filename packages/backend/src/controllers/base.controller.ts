import { ControllerContext, ControllerResult, NodeController } from "../state/types";

/**
 * Base Controller
 * 
 * Provides common functionality for node controllers.
 */
export abstract class BaseController implements NodeController {
  /**
   * Preprocess hook - called before LLM generation
   * Override in subclasses to implement custom logic
   */
  async preprocess(ctx: ControllerContext): Promise<ControllerResult | null> {
    return null;
  }

  /**
   * Postprocess hook - called after LLM generation
   * Override in subclasses to implement custom logic
   */
  async postprocess(
    ctx: ControllerContext & { llmResponse: string }
  ): Promise<ControllerResult | null> {
    return null;
  }

  /**
   * Parse age from various input formats
   */
  protected parseAge(input: string): number | null {
    const text = String(input).toLowerCase().trim();

    // Direct number
    const directMatch = text.match(/^(\d{1,3})$/);
    if (directMatch) {
      const age = parseInt(directMatch[1], 10);
      if (age > 0 && age < 150) return age;
    }

    // "X years old" pattern
    const yearsOldMatch = text.match(/(\d{1,3})\s*(?:years?\s*old|yo|y\/o)/i);
    if (yearsOldMatch) {
      const age = parseInt(yearsOldMatch[1], 10);
      if (age > 0 && age < 150) return age;
    }

    // Birth year (4 digits)
    const birthYearMatch = text.match(/(?:born\s*(?:in\s*)?)?(19\d{2}|20[0-2]\d)/i);
    if (birthYearMatch) {
      const birthYear = parseInt(birthYearMatch[1], 10);
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      if (age > 0 && age < 150) return age;
    }

    // Age mentioned in text
    const ageInTextMatch = text.match(/(?:i am|i'm|age|aged)\s*(\d{1,3})/i);
    if (ageInTextMatch) {
      const age = parseInt(ageInTextMatch[1], 10);
      if (age > 0 && age < 150) return age;
    }

    return null;
  }

  /**
   * Parse sex from various input formats
   */
  protected parseSex(input: string): string | null {
    const text = String(input).toLowerCase().trim();

    if (/\b(male|man|m)\b/i.test(text) && !/\bfemale\b/i.test(text)) {
      return "male";
    }
    if (/\b(female|woman|f)\b/i.test(text)) {
      return "female";
    }
    if (/\b(other|non-?binary|nb)\b/i.test(text)) {
      return "other";
    }
    if (/\b(prefer not|rather not|don't want)\b/i.test(text)) {
      return "prefer_not_to_say";
    }

    return null;
  }

  /**
   * Parse height from various input formats
   */
  protected parseHeight(input: string): number | null {
    const text = String(input).toLowerCase().trim();

    // Meters (e.g., 1.75m, 1.75 m)
    const metersMatch = text.match(/(\d+\.?\d*)\s*(?:m|meters?)\b/i);
    if (metersMatch) {
      const meters = parseFloat(metersMatch[1]);
      if (meters > 0.5 && meters < 2.5) return meters;
    }

    // Centimeters (e.g., 175cm, 175 cm)
    const cmMatch = text.match(/(\d{2,3})\s*(?:cm|centimeters?)\b/i);
    if (cmMatch) {
      const cm = parseInt(cmMatch[1], 10);
      if (cm > 50 && cm < 250) return cm / 100;
    }

    // Feet and inches (e.g., 5'10", 5 ft 10 in)
    const ftInMatch = text.match(/(\d)'?\s*(?:ft|feet|foot)?\s*(\d{1,2})?"?\s*(?:in|inches?)?/i);
    if (ftInMatch) {
      const feet = parseInt(ftInMatch[1], 10);
      const inches = parseInt(ftInMatch[2] || "0", 10);
      const totalInches = feet * 12 + inches;
      return totalInches * 0.0254;
    }

    return null;
  }

  /**
   * Parse weight from various input formats
   */
  protected parseWeight(input: string): number | null {
    const text = String(input).toLowerCase().trim();

    // Kilograms (e.g., 70kg, 70 kg)
    const kgMatch = text.match(/(\d+\.?\d*)\s*(?:kg|kilos?|kilograms?)\b/i);
    if (kgMatch) {
      const kg = parseFloat(kgMatch[1]);
      if (kg > 20 && kg < 500) return kg;
    }

    // Pounds (e.g., 150lbs, 150 lb)
    const lbMatch = text.match(/(\d+\.?\d*)\s*(?:lbs?|pounds?)\b/i);
    if (lbMatch) {
      const lb = parseFloat(lbMatch[1]);
      if (lb > 40 && lb < 1000) return lb * 0.453592;
    }

    // Just a number - assume kg if reasonable
    const numMatch = text.match(/^(\d+\.?\d*)$/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      if (num > 20 && num < 200) return num; // Assume kg
      if (num > 80 && num < 500) return num * 0.453592; // Assume lbs
    }

    return null;
  }

  /**
   * Extract keywords from text
   */
  protected extractKeywords(input: string, keywords: string[]): string[] {
    const text = String(input).toLowerCase();
    return keywords.filter(kw => text.includes(kw.toLowerCase()));
  }

  /**
   * Check for negation patterns
   */
  protected hasNegation(input: string): boolean {
    return /\b(no|none|not|don't|doesn't|never|neither|without)\b/i.test(input);
  }
}

