export interface SceneKeyword {
  sceneIndex: number;
  phrase: string;
  query: string;
}

export function extractVisualKeywords(scriptText: string): SceneKeyword[] {
  // Strip section timestamp headers like [0:00 - Hook]
  const cleanScript = scriptText.replace(/\[\d+:\d+\s*-\s*[^\]]+\]/g, '').trim();

  // Split script by line breaks or punctuation into distinct scene thoughts
  const rawPhrases = cleanScript
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'in', 'on', 'at', 'to', 'for', 'from', 'with', 'about', 'against',
    'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our',
    'their', 'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why',
    'today', 'welcome', 'video', 'channel', 'subscribe', 'like', 'comment', 'next',
  ]);

  return rawPhrases.slice(0, 8).map((phrase, idx) => {
    // Extract key nouns and verbs to form search terms
    const words = phrase
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    // Combine 2-3 strongest descriptive terms into a B-roll search query
    const query = words.slice(0, 3).join(' ') || 'technology innovation';

    return {
      sceneIndex: idx + 1,
      phrase,
      query,
    };
  });
}
