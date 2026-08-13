import fs from 'fs';
import path from 'path';

export function generateAssSubtitles(scriptText: string, durationSeconds: number, outputPath: string): string {
  // Strip section headers like [0:00 - Hook]
  const cleanScript = scriptText.replace(/\[\d+:\d+\s*-\s*[^\]]+\]/g, '').trim();
  const sentences = cleanScript.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 0);

  const totalWords = cleanScript.split(/\s+/).filter(Boolean).length || 1;
  const secondsPerWord = durationSeconds / totalWords;

  let currentTime = 0;
  const events: string[] = [];

  const formatAssTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    const cs = Math.floor((sec % 1) * 100);
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  };

  sentences.forEach((sentence) => {
    const wordCount = sentence.split(/\s+/).filter(Boolean).length;
    const duration = Math.max(1.2, wordCount * secondsPerWord);
    const startTime = currentTime;
    const endTime = Math.min(durationSeconds, startTime + duration);

    const startStr = formatAssTime(startTime);
    const endStr = formatAssTime(endTime);

    // Escape ASS special formatting characters
    const safeText = sentence.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');

    events.push(`Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${safeText}`);
    currentTime = endTime;
  });

  const assContent = `[Script Info]
Title: VidStack Automated Shorts Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,22,&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,1,2,10,10,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join('\n')}
`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, assContent, 'utf-8');

  return outputPath;
}
