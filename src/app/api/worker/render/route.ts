import { NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { claimNextJob, updateJobProgress, completeJob, failJob } from '@/lib/queue/jobs';
import { generateAssSubtitles } from '@/lib/ffmpeg/subtitles';
import { assembleVideoPipeline } from '@/lib/ffmpeg/assembly-engine';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const workerId = `worker-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const tmpDir = path.join(os.tmpdir(), `vidstack_${Date.now()}`);

  try {
    // 1. Claim oldest queued job
    const job = await claimNextJob(workerId);

    if (!job) {
      return NextResponse.json({ message: 'No queued render jobs available.' }, { status: 200 });
    }

    const videoId = job.video_id;
    fs.mkdirSync(tmpDir, { recursive: true });

    const supabase = await createClient();

    // 2. Fetch Video Details
    await updateJobProgress(job.id, 10, 'Fetching video script & payload metadata');
    const { data: video, error: videoErr } = await (supabase.from('videos') as any)
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoErr || !video) {
      await failJob(job.id, 'Associated video record not found.');
      return NextResponse.json({ error: 'Video record not found.' }, { status: 400 });
    }

    // 3. Prepare Local File Paths
    const audioLocalPath = path.join(tmpDir, 'voiceover.mp3');
    const subtitleLocalPath = path.join(tmpDir, 'subtitles.ass');
    const outputLocalPath = path.join(tmpDir, 'rendered_output.mp4');
    const brollLocalPath = path.join(tmpDir, 'broll_1.mp4');

    // 4. Download / Generate Voiceover Audio
    await updateJobProgress(job.id, 25, 'Downloading voiceover audio asset');
    if (video.video_url && video.video_url.startsWith('http')) {
      const audioRes = await fetch(video.video_url);
      if (audioRes.ok) {
        fs.writeFileSync(audioLocalPath, Buffer.from(await audioRes.arrayBuffer()));
      }
    }

    if (!fs.existsSync(audioLocalPath)) {
      // Create fallback audio track if missing
      const dummyAudioHeader = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0a]);
      fs.writeFileSync(audioLocalPath, dummyAudioHeader);
    }

    // 5. Generate Subtitles
    await updateJobProgress(job.id, 40, 'Generating ASS subtitle timestamps');
    generateAssSubtitles(video.script || video.title, 15, subtitleLocalPath);

    // 6. Execute FFmpeg Video Assembly Pipeline
    await updateJobProgress(job.id, 55, 'FFmpeg assembling video stream & burning subtitles');
    const brollList: string[] = fs.existsSync(brollLocalPath) ? [brollLocalPath] : [];

    await assembleVideoPipeline({
      videoId,
      audioFilePath: audioLocalPath,
      brollFilePaths: brollList,
      subtitleFilePath: subtitleLocalPath,
      outputFilePath: outputLocalPath,
      aspectRatio: '9:16',
      onProgress: (percent) => {
        updateJobProgress(job.id, Math.min(90, Math.max(55, percent)), 'Encoding vertical video stream');
      },
    });

    // 7. Upload Rendered Video to Supabase Storage bucket 'video-assets'
    await updateJobProgress(job.id, 92, 'Uploading rendered video to Storage CDN');
    const renderedBuffer = fs.readFileSync(outputLocalPath);
    const storagePath = `renders/${videoId}.mp4`;

    const { error: uploadErr } = await supabase.storage
      .from('video-assets')
      .upload(storagePath, renderedBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadErr) {
      await failJob(job.id, `Failed to upload rendered video: ${uploadErr.message}`);
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('video-assets')
      .getPublicUrl(storagePath);

    const publicVideoUrl = publicUrlData.publicUrl;

    // 8. Mark Job Complete
    await completeJob(job.id, publicVideoUrl);

    // Clean up temporary workspace directory
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}

    return NextResponse.json({
      success: true,
      jobId: job.id,
      videoId,
      outputUrl: publicVideoUrl,
    });
  } catch (error: any) {
    console.error('Render worker exception:', error);
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
    return NextResponse.json({ error: error.message || 'Render worker internal error' }, { status: 500 });
  }
}
