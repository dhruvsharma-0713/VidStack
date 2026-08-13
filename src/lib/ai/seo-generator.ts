import Groq from 'groq-sdk';
import OpenAI from 'openai';

export interface SeoGeneratorParams {
  topic: string;
  script: string;
  channelNiche: string;
}

export interface GeneratedSeoResult {
  titles: string[];
  description: string;
  tags: string[];
}

export async function generateSeoMetadata(params: SeoGeneratorParams): Promise<GeneratedSeoResult> {
  const { topic, script, channelNiche } = params;

  const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase();
  const groqApiKey = process.env.GROQ_API_KEY || '';
  const openaiApiKey = process.env.OPENAI_API_KEY || '';

  const systemPrompt = `You are a world-class YouTube SEO algorithm strategist.
Your task is to generate high-CTR metadata for a video in the "${channelNiche}" niche about "${topic}".

You MUST respond strictly in valid JSON with the following structure:
{
  "titles": [
    "Headline 1 (Curiosity gap)",
    "Headline 2 (Number listicle / How to)",
    "Headline 3 (Action-oriented)",
    "Headline 4 (Question format)",
    "Headline 5 (High urgency)"
  ],
  "description": "Keyword-rich 2-3 paragraph description containing key search terms, timestamps [0:00 - Intro, 0:30 - Core breakdown, 1:30 - Summary], and 3 primary hashtags.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13", "tag14", "tag15"]
}`;

  const userPrompt = `Topic: "${topic}"\nNiche: ${channelNiche}\nScript Excerpt: "${script.slice(0, 500)}..."`;

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
        titles: Array.isArray(parsed.titles) ? parsed.titles : [`How ${topic} Works`],
        description: parsed.description || `Explore ${topic} in this complete breakdown.`,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [topic, channelNiche, 'tutorial', '2026'],
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
        titles: Array.isArray(parsed.titles) ? parsed.titles : [`Mastering ${topic}`],
        description: parsed.description || `Everything you need to know about ${topic}.`,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [topic, channelNiche, 'guide'],
      };
    }
  } catch (error) {
    console.warn('SEO AI API call failed or unconfigured, returning fallback metadata:', error);
  }

  // High quality fallback generator if API keys are unconfigured
  const cleanTopic = topic.toLowerCase().replace(/[^a-z0-9 ]/g, '');
  const topicWords = cleanTopic.split(' ').filter(Boolean);

  return {
    titles: [
      `The Secret Behind ${topic} (Explained)`,
      `How to Master ${topic} in 2026`,
      `5 Rules for ${topic} You Cannot Ignore`,
      `Why Everyone is Talking About ${topic}`,
      `Complete Guide to ${topic} for Beginners`,
    ],
    description: `In this video, we dive deep into ${topic} within the ${channelNiche} domain.\n\nTimestamps:\n0:00 - Introduction & Hook\n0:30 - Core Strategy Breakdown\n1:15 - Step-by-Step Execution\n2:00 - Final Thoughts & Summary\n\n#${topicWords[0] || 'video'} #${channelNiche.replace(/[^a-z0-9]/gi, '')} #VidStack`,
    tags: [
      topic,
      channelNiche,
      ...topicWords,
      '2026',
      'guide',
      'tutorial',
      'insights',
      'explained',
      'automation',
      'youtube seo',
      'vidstack',
      'viral strategy',
      'digital content',
    ].slice(0, 15),
  };
}
