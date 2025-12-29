import { llmManager } from './llm/index.js';
import { config } from '../config/index.js';

export interface PromptContext {
  nodeId: string;
  prompt: string;
  input: any;
  memory?: any;
  reasoning?: any;
  patientProfile?: any;
}

class PromptEngineService {
  private systemPrompt = `You are a helpful medical education assistant named MyDoctor.

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
      
      const response = await provider.chat([
        { role: 'system', content: this.systemPrompt },
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

    prompt += `Please provide a brief, helpful response (2-3 sentences max). `;
    prompt += `Acknowledge their answer with ONE key insight or piece of guidance. Be warm but concise.`;
    
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
    reasoning: any
  ): Promise<string> {
    const provider = llmManager.getActiveProvider();
    
    if (!provider.isAvailable) {
      return this.getFallbackSummary(reasoning);
    }

    try {
      const summaryPrompt = `Based on the following health checkup conversation, provide a brief summary:

Conversation History:
${steps.map(s => `- ${s.nodeId}: User said "${s.input}"`).join('\n')}

Analysis:
${JSON.stringify(reasoning, null, 2)}

Please provide:
1. A brief summary of the main health topics discussed
2. Any areas that may need attention
3. General wellness recommendations

Keep it concise and educational.`;

      const response = await provider.chat([
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: summaryPrompt },
      ], {
        temperature: 0.5,
        maxTokens: 3072, // Increased for gpt-5-nano reasoning + summary output
      });

      return response.content;
    } catch (error) {
      console.error('[PromptEngine] Error generating summary:', error);
      return this.getFallbackSummary(reasoning);
    }
  }

  private getFallbackSummary(reasoning: any): string {
    let summary = "## Health Checkup Summary\n\n";
    summary += "Thank you for completing your health checkup.\n\n";
    
    if (reasoning?.redFlags?.length > 0) {
      summary += "### Areas to Discuss with Your Doctor\n";
      summary += reasoning.redFlags.map((f: string) => `- ${f}`).join('\n');
      summary += "\n\n";
    }
    
    if (reasoning?.recommendations?.length > 0) {
      summary += "### Recommendations\n";
      summary += reasoning.recommendations.map((r: string) => `- ${r}`).join('\n');
      summary += "\n\n";
    }
    
    summary += "Remember: This is educational information only. ";
    summary += "Please consult with a healthcare professional for medical advice.";
    
    return summary;
  }
}

export const promptEngineService = new PromptEngineService();
