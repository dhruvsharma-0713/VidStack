import Groq from 'groq-sdk';
import OpenAI from 'openai';

export interface ScriptGeneratorParams {
  topic: string;
  tone: string;
  targetDurationSeconds: number;
  niche: string;
}

export interface GeneratedScriptResult {
  title: string;
  hook: string;
  fullScript: string;
  estimatedDuration: number; // in seconds
}

export async function generateVideoScript(params: ScriptGeneratorParams): Promise<GeneratedScriptResult> {
  const { topic, tone, targetDurationSeconds, niche } = params;

  const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase();
  const groqApiKey = process.env.GROQ_API_KEY || '';
  const openaiApiKey = process.env.OPENAI_API_KEY || '';

  const systemPrompt = `You are an elite viral YouTube scriptwriter for high-retention automated channels in the "${niche}" niche.
Your goal is to write an engaging, high-converting video script tailored to a target duration of ~${targetDurationSeconds} seconds (${Math.round((targetDurationSeconds / 60) * 150)} words pacing).

Structure:
1. 0-5s Hook: Irresistible opening statement or intriguing question.
2. Story Arc / Context: Establish core premise.
3. Core Value Delivery: Key actionable insights or narrative beats.
4. Outro / Call to Action: Subscribe, comment, or next video recommendation.

You MUST respond strictly in valid JSON with the following key names:
{
  "title": "Short punchy YouTube title",
  "hook": "0-5 second hook lines",
  "fullScript": "Complete script narration with timestamp section headers e.g. [0:00 - Hook] ...",
  "estimatedDuration": ${targetDurationSeconds}
}`;

  const userPrompt = `Topic: "${topic}"\nTone: ${tone}\nTarget Duration: ${targetDurationSeconds} seconds\nNiche: ${niche}`;

  try {
    if (provider === 'groq' && groqApiKey && !groqApiKey.includes('your_groq_api_key')) {
      const groq = new Groq({ apiKey: groqApiKey });
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const rawContent = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);

      return {
        title: parsed.title || `The Truth About ${topic}`,
        hook: parsed.hook || `If you think you know ${topic}, think again.`,
        fullScript: parsed.fullScript || rawContent,
        estimatedDuration: Number(parsed.estimatedDuration) || targetDurationSeconds,
      };
    }

    if (provider === 'openai' && openaiApiKey && !openaiApiKey.includes('your_openai_api_key')) {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const completion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'gpt-4o-mini',
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const rawContent = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);

      return {
        title: parsed.title || `The Ultimate Guide to ${topic}`,
        hook: parsed.hook || `What most people get wrong about ${topic} will surprise you.`,
        fullScript: parsed.fullScript || rawContent,
        estimatedDuration: Number(parsed.estimatedDuration) || targetDurationSeconds,
      };
    }
  } catch (error) {
    console.warn('AI API call failed or unconfigured, returning high-retention template fallback:', error);
  }

  // High quality fallback generator if API keys are unconfigured
  const targetWords = Math.round((targetDurationSeconds / 60) * 150);
  const fallbackHook = `Stop scrolling! In the next ${targetDurationSeconds} seconds, you will discover the hidden strategy behind ${topic}.`;
  const fallbackScript = `[0:00 - Hook]
${fallbackHook}

[0:05 - Introduction]
Welcome back to the channel. Today we are breaking down ${topic} in the ${niche} space with a ${tone} approach.

[0:30 - Core Insights]
First, let us examine why ${topic} matters. Most creators overlook the key fundamental lever. When you optimize this single variable, results compound dramatically.

[1:15 - Actionable Strategy]
Here is the step-by-step breakdown:
1. Identify the core friction point in ${topic}.
2. Apply high-retention pacing techniques.
3. Test and refine based on real audience signals.

[${Math.floor(targetDurationSeconds / 60)}:${(targetDurationSeconds % 60).toString().padStart(2, '0')} - Outro & CTA]
If you found this breakdown valuable, smash the subscribe button and turn on notifications for daily ${niche} deep-dives. Drop a comment below with your thoughts!`;

  return {
    title: `How ${topic} Changes Everything in ${niche}`,
    hook: fallbackHook,
    fullScript: fallbackScript,
    estimatedDuration: targetDurationSeconds,
  };
}
