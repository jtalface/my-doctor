import { llmManager } from './llm/index.js';
import { config } from '../config/index.js';
import { getLanguageInfo, DEFAULT_LANGUAGE, type LanguageCode } from '../config/languages.js';

export interface PromptContext {
  nodeId: string;
  prompt: string;
  input: any;
  sessionType?: 'annual-checkup' | 'symptom-check' | 'medication-review';
  memory?: any;
  reasoning?: any;
  patientProfile?: any;
  language?: string;
}

class PromptEngineService {
  private baseSystemPrompt = `You are a helpful medical education assistant named MyDoctor.

IMPORTANT GUIDELINES:
- You do NOT diagnose conditions or prescribe treatments
- You provide general health education and guidance
- You encourage users to consult healthcare professionals
- You are empathetic, supportive, and use simple language
- You ask clarifying questions when needed
- You flag concerning symptoms appropriately

RESPONSE FORMAT:
- Keep responses VERY brief: 2-3 sentences maximum
- Focus on one key point or piece of advice
- Be warm and encouraging but concise
- Avoid long lists or detailed explanations`;

  /**
   * Gets language-specific instruction for LLM responses
   */
  private getLanguageInstruction(languageCode: string): string {
    const language = getLanguageInfo(languageCode);
    
    const languageInstructions: Record<LanguageCode, string> = {
      en: 'Respond in English.',
      pt: 'Responda em Português (Portuguese). Use linguagem clara e acessível.',
      fr: 'Répondez en Français (French). Utilisez un langage clair et accessible.',
      sw: 'Jibu kwa Kiswahili (Swahili). Tumia lugha wazi na inayoeleweka.',
    };
    
    return languageInstructions[language.code as LanguageCode] || languageInstructions[DEFAULT_LANGUAGE];
  }

  /**
   * Builds a complete system prompt with language instruction
   */
  private buildSystemPrompt(languageCode?: string): string {
    const language = languageCode || DEFAULT_LANGUAGE;
    const languageInstruction = this.getLanguageInstruction(language);
    
    return `${this.baseSystemPrompt}\n\nLANGUAGE INSTRUCTION:\n${languageInstruction}`;
  }

  /** System prompt for final summaries (not per-step chat). Avoids the 2–3 sentence cap from baseSystemPrompt. */
  private buildSummarySystemPrompt(
    languageCode?: string,
    sessionType?: PromptContext['sessionType']
  ): string {
    const languageInstruction = this.getLanguageInstruction(languageCode || DEFAULT_LANGUAGE);
    if (sessionType === 'symptom-check') {
      return `You are a helpful medical education assistant named MyDoctor.

IMPORTANT GUIDELINES:
- You do NOT diagnose conditions or prescribe treatments.
- You may name specific diseases or conditions only as possible explanations in a differential sense, with cautious language (e.g. "could be consistent with", "one possibility among others", "worth discussing with a clinician").
- Incorporate patient context (age, sex, country/region, travel, season, comorbidities) when suggesting what to consider.
- Encourage timely professional evaluation when appropriate.
- Sound warm and personal: address the patient supportively, use natural empathy, and offer gentle reassurance where appropriate without promising outcomes or replacing clinical judgment.
- Be brief: telegraphic style in sections 2–3, short sentences, no repetition, one short disclaimer at the end of section 2 only (not again in section 3).

RESPONSE FORMAT:
- Follow the structure in the user message exactly.
- Use clear section labels in the same language as the response.
- Do not use Markdown heading markers like # or ##.

LANGUAGE INSTRUCTION:
${languageInstruction}`;
    }
    return `You are a helpful medical education assistant named MyDoctor.

IMPORTANT GUIDELINES:
- You do NOT diagnose conditions or prescribe treatments
- You provide general health education and guidance
- You encourage users to consult healthcare professionals
- You are empathetic, supportive, and use simple language

RESPONSE FORMAT:
- Produce a concise, educational summary with the sections requested in the user message.
- Avoid unnecessary length, but complete each section with useful detail.

LANGUAGE INSTRUCTION:
${languageInstruction}`;
  }

  async generate(context: PromptContext): Promise<string> {
    const provider = llmManager.getActiveProvider();
    
    if (!provider.isAvailable) {
      if (config.debugMode) {
        console.log('[PromptEngine] LLM not available, using fallback response');
      }
      return this.getFallbackResponse(context);
    }

    try {
      const userPrompt = this.buildUserPrompt(context);
      const systemPrompt = this.buildSystemPrompt(context.language);
      
      if (config.debugMode) {
        console.log(`[PromptEngine] Generating response in language: ${context.language || DEFAULT_LANGUAGE}`);
      }
      
      const response = await provider.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.7,
        maxTokens: 1024, // Reasoning + concise output (2-3 sentences)
      });

      return response.content;
    } catch (error) {
      console.error('[PromptEngine] Error generating response:', error);
      return this.getFallbackResponse(context);
    }
  }

  private buildUserPrompt(context: PromptContext): string {
    let prompt = `Current Question: ${context.prompt}\n\n`;
    prompt += `User Response: ${JSON.stringify(context.input)}\n\n`;
    
    if (context.reasoning) {
      prompt += `Analysis Notes: ${JSON.stringify(context.reasoning)}\n\n`;
    }
    
    if (context.patientProfile) {
      prompt += `Patient Context: ${JSON.stringify(context.patientProfile)}\n\n`;
    }

    if (context.sessionType === 'symptom-check') {
      prompt += `Write EXACTLY 3 short paragraphs in this order:\n`;
      prompt += `1) Summarize the user input clearly in plain language. If Patient Context includes a non-empty firstName, open by addressing them with that first name only (e.g. "Maria, thanks for sharing..."); if firstName is missing, open warmly without a name. Be briefly empathetic and conversational.\n`;
      prompt += `2) Provide a brief differential (2-4 plausible causes, from less severe to more concerning), and explicitly use patient context (age, sex/gender, race/ethnic context if provided) plus local context (country/region/seasonal risks) when available.\n`;
      prompt += `3) Provide practical next-step recommendations.\n\n`;
      prompt += `At the end of paragraph 2, include a clear disclaimer equivalent to: "However, only a doctor or appropriate tests can confirm this. Please consult a doctor."\n`;
      prompt += `Do not present a diagnosis as certain. Keep wording cautious, clear, and supportive.\n`;
      prompt += `Keep each paragraph concise (2-4 sentences each).`;
    } else {
      prompt += `Please provide a brief, helpful response (2-3 sentences max). `;
      prompt += `Acknowledge their answer with ONE key insight or piece of guidance. Be warm but concise.`;
    }
    
    return prompt;
  }

  private getFallbackResponse(_context: PromptContext): string {
    // Fallback responses based on node type or generic
    const fallbacks: string[] = [
      "Thank you for sharing that information. This helps me understand your health better.",
      "I appreciate you being open about this. Let me note that down and continue.",
      "That's helpful to know. Let's move on to the next question.",
      "Thank you for your response. I'll keep this in mind as we continue.",
    ];
    const index = Math.floor(Math.random() * fallbacks.length);
    return fallbacks[index] || "Thank you for your response.";
  }

  async generateSummary(
    steps: Array<{ nodeId: string; input: any; response: string }>,
    reasoning: any,
    language?: string,
    patientProfile?: any,
    sessionType?: PromptContext['sessionType']
  ): Promise<string> {
    const provider = llmManager.getActiveProvider();
    
    if (!provider.isAvailable) {
      return this.getFallbackSummary(reasoning, language);
    }

    try {
      const conversationBlock = steps.map(s => `- ${s.nodeId}: User said "${s.input}"`).join('\n');
      const analysisBlock = JSON.stringify(reasoning, null, 2);
      const patientBlock = JSON.stringify(patientProfile || {}, null, 2);

      const summaryPrompt =
        sessionType === 'symptom-check'
          ? `You are writing the FINAL summary for a symptom-check conversation (educational information only — not a medical diagnosis).

Conversation History:
${conversationBlock}

Analysis:
${analysisBlock}

Patient Context:
${patientBlock}

Patient Context includes **firstName** when known—use **first name only** for greetings; never invent a name.

Use clear section labels in the same language as your response. HARD LENGTH TARGET: the entire reply should stay compact (~**280 words maximum**; the personal opening in section 1 should not push the rest into long lists). No nested sub-bullets; no duplicate sentences across sections; no preamble before section 1.

1) Summary (warm, personal opening — plain prose, no bullets)
   - **First line must address the patient:** if \`firstName\` is present in Patient Context, start exactly with that name and a comma (e.g. "Josefa, you've shared that..."). If \`firstName\` is absent, start with a warm direct address without a name (e.g. "Thank you for sharing that...").
   - Continue in the same short paragraph: reflect their symptoms and timing in your own words; add **one** brief empathetic sentence (natural wording—e.g. that you're sorry they're going through this).
   - Add **one** sentence of balanced encouragement: many cases like this can turn out to be common and manageable causes—frame as **hopeful possibility**, not a diagnosis (e.g. "sometimes this pattern is simply fatigue or a passing virus").
   - End the paragraph with **one** compressed clause for age/sex and key comorbidities/travel **only if stated** in context.
   - Cap section 1 at about **5 short sentences** total; stay conversational, not clinical or lecture-like.

2) Possible explanations (educational differential — not a diagnosis)
   - **One sentence only**: many illnesses overlap; only a clinician/tests can confirm; add geography/travel/**only if relevant in one short clause**.
   - **Exactly 3 bullets** (not 4 or more). Each bullet = **one line**, **≤18 words**, must name at least one concrete condition or category where reasonable (merge related ideas—e.g. viral respiratory vs UTI vs dehydration vs vector-borne if exposure fits vs meningitis **only** if alarm features). Cautious wording.
   - **One short sentence** to close section 2: seek evaluation if worse; professional confirms cause.

3) Practical next steps
   - **Exactly 4 bullets**, **≤14 words each**: (1) hydration (2) rest (3) OTC fever/pain—no dosing, say label/clinician (4) combine red flags **and** when to seek urgent care in one line.

Be specific to the conversation; cut filler, explanations, and moralizing.`
          : `Based on the following health checkup conversation, provide a brief summary:

Conversation History:
${conversationBlock}

Analysis:
${analysisBlock}

Patient Context:
${patientBlock}

Please provide:
1. A brief summary of the main health topics discussed
2. Any areas that may need attention
3. General wellness recommendations

Keep it concise and educational.`;

      const systemPrompt = this.buildSummarySystemPrompt(language, sessionType);
      
      if (config.debugMode) {
        console.log(`[PromptEngine] Generating summary in language: ${language || DEFAULT_LANGUAGE}`);
      }

      const summaryMaxTokens =
        sessionType === 'symptom-check'
          ? config.llmSymptomCheckSummaryMaxTokens
          : config.llmSummaryMaxTokens;

      const response = await provider.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: summaryPrompt },
      ], {
        temperature: 0.5,
        maxTokens: summaryMaxTokens,
      });

      const structured = this.ensureStructuredSummary(response.content, language);
      return structured || this.getFallbackSummary(reasoning, language);
    } catch (error) {
      console.error('[PromptEngine] Error generating summary:', error);
      return this.getFallbackSummary(reasoning, language);
    }
  }

  async generateMedicationReviewSummary(
    steps: Array<{ nodeId: string; input: any; response: string }>,
    reasoning: any,
    language?: string
  ): Promise<string> {
    const provider = llmManager.getActiveProvider();

    if (!provider.isAvailable) {
      return this.getFallbackSummary(reasoning, language);
    }

    try {
      const relevantSteps = steps.filter((step) => {
        const value = typeof step.input === 'string' ? step.input.trim() : String(step.input ?? '').trim();
        if (!value) return false;
        if (step.nodeId === 'medication_intro') return false;

        const normalizedValue = value.toLowerCase();
        const nonInformativeInputs = new Set(['continue', 'continue to summary']);
        return !nonInformativeInputs.has(normalizedValue);
      });

      console.log('[PromptEngine] Medication review relevant steps:', relevantSteps);

      const medicationReviewPrompt = `You are generating the final summary for a medication review visit.

Medication Review History (questions and patient answers):
${relevantSteps.map(s => `- ${s.nodeId}: User said "${s.input}"`).join('\n')}

Derived analysis context:
${JSON.stringify(reasoning, null, 2)}

Please produce the best possible medication review summary for this patient scenario. Use the data above and include:
1) Current medication profile (what the patient reports taking, including dose/schedule where available)
   - If a medication name appears misspelled, show the likely corrected name and include the reported spelling inline in that same bullet (example: Diazepam (reported as "Diazepan"))
   - If a name is unclear/gibberish, state inline that the name is unclear and ask to verify spelling
   - Do not present uncertain guesses as confirmed facts
2) For each medication name, a brief plain-language explanation of what it is commonly used for and what it does
3) Potential adherence or safety concerns (only if supported by patient responses)
4) Reported side effects and possible practical discussion points for clinician follow-up
5) Focused, actionable medication-management recommendations the patient can discuss with their clinician
6) A short "questions to ask your doctor/pharmacist" section tailored to this case

Be specific to the patient inputs, avoid generic filler, and keep a calm, supportive tone. Prioritize safe wording when medication names are uncertain.

FORMAT REQUIREMENTS (mandatory):
- Use short sections with clear headings
- Use bullets under each section (no long paragraph blocks)
- Keep each bullet concise (1 sentence when possible)
- Leave a blank line between sections
- Write section headings in the same language as the response
- Do NOT use Markdown heading markers like # or ##

Use this exact structure:
Medication Profile:
- ...

What Each Medication Is For:
- ...

Side Effects Reported:
- ...

Adherence & Safety Considerations:
- ...

Recommendations to Discuss with Clinician:
- ...

Questions to Ask Your Doctor/Pharmacist:
- ...`;

      const systemPrompt = this.buildSystemPrompt(language);

      if (config.debugMode) {
        console.log(`[PromptEngine] Generating medication review summary in language: ${language || DEFAULT_LANGUAGE}`);
      }

      const response = await provider.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: medicationReviewPrompt },
      ], {
        temperature: 0.4,
        maxTokens: config.llmSummaryMaxTokens,
      });

      const structured = this.ensureStructuredSummary(response.content, language);
      return structured || this.getFallbackSummary(reasoning, language);
    } catch (error) {
      console.error('[PromptEngine] Error generating medication review summary:', error);
      return this.getFallbackSummary(reasoning, language);
    }
  }

  private getFallbackSummary(reasoning: any, language?: string): string {
    const languageCode = getLanguageInfo(language || DEFAULT_LANGUAGE).code as LanguageCode;
    const copy: Record<LanguageCode, {
      thankYou: string;
      connectionIssue: string;
      redFlagsTitle: string;
      recommendationsTitle: string;
    }> = {
      en: {
        thankYou: 'Thank you for completing your health checkup.',
        connectionIssue: 'We could not establish a connection with the Virtual Doctor (AI) due to a connection failure. Please check your internet and try again.',
        redFlagsTitle: '### Areas to Discuss with Your Doctor',
        recommendationsTitle: '### Recommendations',
      },
      pt: {
        thankYou: 'Obrigado por concluir a sua consulta de saúde.',
        connectionIssue: 'Não foi possível estabelecer a ligação com o Médico Virtual (IA) devido a uma falha de conexão. Verifique a sua internet e tente novamente.',
        redFlagsTitle: '### Pontos a Discutir com o Seu Médico',
        recommendationsTitle: '### Recomendações',
      },
      fr: {
        thankYou: 'Merci d’avoir terminé votre bilan de santé.',
        connectionIssue: 'Impossible d’établir la connexion avec le Médecin Virtuel (IA) en raison d’un échec de connexion. Vérifiez votre internet et réessayez.',
        redFlagsTitle: '### Points à Discuter avec Votre Médecin',
        recommendationsTitle: '### Recommandations',
      },
      sw: {
        thankYou: 'Asante kwa kukamilisha ukaguzi wako wa afya.',
        connectionIssue: 'Hatukuweza kuanzisha muunganisho na Daktari wa Mtandaoni (AI) kutokana na hitilafu ya muunganisho. Tafadhali angalia internet yako kisha ujaribu tena.',
        redFlagsTitle: '### Mambo ya Kujadili na Daktari Wako',
        recommendationsTitle: '### Mapendekezo',
      },
    };
    const text = copy[languageCode] || copy.en;

    let summary = `${text.thankYou}\n\n`;
    summary += `${text.connectionIssue}\n\n`;
    
    if (reasoning?.redFlags?.length > 0) {
      summary += `${text.redFlagsTitle}\n`;
      summary += reasoning.redFlags.map((f: string) => `- ${f}`).join('\n');
      summary += "\n\n";
    }
    
    if (reasoning?.recommendations?.length > 0) {
      summary += `${text.recommendationsTitle}\n`;
      summary += reasoning.recommendations.map((r: string) => `- ${r}`).join('\n');
      summary += "\n\n";
    }
    
    return summary;
  }

  private ensureStructuredSummary(content: string, language?: string): string {
    const text = (content || '').trim();
    if (!text) {
      return '';
    }

    const languageCode = getLanguageInfo(language || DEFAULT_LANGUAGE).code as LanguageCode;
    const summaryTitle: Record<LanguageCode, string> = {
      en: 'Summary',
      pt: 'Resumo',
      fr: 'Résumé',
      sw: 'Muhtasari',
    };
    const headingTranslations: Record<string, Record<LanguageCode, string>> = {
      'Medication Profile': { en: 'Medication Profile', pt: 'Perfil de Medicação', fr: 'Profil des Médicaments', sw: 'Wasifu wa Dawa' },
      'What Each Medication Is For': { en: 'What Each Medication Is For', pt: 'Para Que Serve Cada Medicação', fr: 'À Quoi Sert Chaque Médicament', sw: 'Kila Dawa Inatumika Kwa Nini' },
      'Side Effects Reported': { en: 'Side Effects Reported', pt: 'Efeitos Colaterais Relatados', fr: 'Effets Secondaires Rapportés', sw: 'Madhara ya Dawa Yaliyoripotiwa' },
      'Adherence & Safety Considerations': { en: 'Adherence & Safety Considerations', pt: 'Considerações de Adesão e Segurança', fr: 'Considérations d’Adhérence et de Sécurité', sw: 'Mazingatio ya Ufuasi na Usalama' },
      'Recommendations to Discuss with Clinician': { en: 'Recommendations to Discuss with Clinician', pt: 'Recomendações para Discutir com o Clínico', fr: 'Recommandations à Discuter avec le Clinicien', sw: 'Mapendekezo ya Kujadili na Mtaalamu' },
      'Questions to Ask Your Doctor/Pharmacist': { en: 'Questions to Ask Your Doctor/Pharmacist', pt: 'Perguntas para Fazer ao Médico/Farmacêutico', fr: 'Questions à Poser au Médecin/Pharmacien', sw: 'Maswali ya Kumuuliza Daktari/Famasia' },
      'Summary': { en: 'Summary', pt: 'Resumo', fr: 'Résumé', sw: 'Muhtasari' },
    };

    const translateHeading = (heading: string): string => {
      const normalized = heading.replace(/^#+\s*/, '').replace(/:\s*$/, '').trim();
      return headingTranslations[normalized]?.[languageCode] || normalized;
    };

    const reportedAsTranslations: Record<LanguageCode, string> = {
      en: 'reported as',
      pt: 'reportado como',
      fr: 'rapporté comme',
      sw: 'iliripotiwa kama',
    };

    const normalizeMedicationInlinePhrases = (line: string): string => {
      const target = reportedAsTranslations[languageCode] || reportedAsTranslations.en;
      return line.replace(/\(\s*reported as\s+["“]/gi, `(${target} "`);
    };

    if (text.includes('\n')) {
      return text
        .split('\n')
        .map((line) => {
          const normalizedLine = normalizeMedicationInlinePhrases(line);
          const trimmed = normalizedLine.trim();
          if (!trimmed) return normalizedLine;
          if (/^\s*#+\s*/.test(normalizedLine)) {
            return `${translateHeading(normalizedLine)}:`;
          }

          const normalized = trimmed.replace(/:\s*$/, '');
          if (headingTranslations[normalized]) {
            return `${translateHeading(normalized)}:`;
          }

          return normalizedLine;
        })
        .join('\n');
    }

    // Fallback: split into short bullets to avoid dense single paragraph output.
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length <= 1) {
      return `${summaryTitle[languageCode] || 'Summary'}:\n- ${text}`;
    }

    return `${summaryTitle[languageCode] || 'Summary'}:\n${sentences.map((s) => `- ${s}`).join('\n')}`;
  }
}

export const promptEngineService = new PromptEngineService();
