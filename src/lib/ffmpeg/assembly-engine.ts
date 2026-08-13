import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export interface AssemblyPipelineParams {
  videoId: string;
  audioFilePath: string;
  brollFilePaths: string[];
  subtitleFilePath?: string;
  outputFilePath: string;
  aspectRatio?: '16:9' | '9:16';
  onProgress?: (percent: number) => void;
}

export async function assembleVideoPipeline(params: AssemblyPipelineParams): Promise<string> {
  const {
    audioFilePath,
    brollFilePaths,
    subtitleFilePath,
    outputFilePath,
    aspectRatio = '9:16',
    onProgress,
  } = params;

  const width = aspectRatio === '9:16' ? 1080 : 1920;
  const height = aspectRatio === '9:16' ? 1920 : 1080;

  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });

  return new Promise((resolve, reject) => {
    let command = ffmpeg();

    // Input 1: Primary B-roll or background video (or lavfi black canvas if missing)
    const primaryBroll = brollFilePaths.length > 0 ? brollFilePaths[0] : null;

    if (primaryBroll && fs.existsSync(primaryBroll)) {
      command = command.input(primaryBroll).inputOptions(['-stream_loop -1']);
    } else {
      command = command.input(`color=c=0x0f172a:s=${width}x${height}:r=30`).inputOptions(['-f lavfi']);
    }

    // Input 2: Voiceover Audio Track
    command = command.input(audioFilePath);

    // Video Filter Chain: Scale, Crop, and optional Subtitles
    const filterChain: string[] = [
      `scale=${width}:${height}:force_original_aspect_ratio=increase`,
      `crop=${width}:${height}`,
    ];

    if (subtitleFilePath && fs.existsSync(subtitleFilePath)) {
      const normalizedSubPath = subtitleFilePath.replace(/\\/g, '/').replace(/:/g, '\\:');
      filterChain.push(`subtitles='${normalizedSubPath}'`);
    }

    command
      .complexFilter([
        {
          filter: filterChain.join(','),
          inputs: '0:v',
          outputs: 'vout',
        },
      ])
      .outputOptions([
        '-map [vout]',
        '-map 1:a',
        '-c:v libx264',
        '-preset ultrafast',
        '-crf 23',
        '-c:a aac',
        '-b:a 192k',
        '-pix_fmt yuv420p',
        '-shortest',
      ])
      .output(outputFilePath)
      .on('progress', (progress) => {
        if (onProgress && progress.percent) {
          onProgress(Math.min(95, Math.max(20, Math.round(progress.percent))));
        }
      })
      .on('end', () => {
        if (onProgress) onProgress(100);
        resolve(outputFilePath);
      })
      .on('error', (err) => {
        console.error('FFmpeg assembly execution error:', err);
        reject(err);
      });

    command.run();
  });
}
