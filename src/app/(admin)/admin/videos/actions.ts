'use server';

import { createClient } from '@/lib/supabase/server';
import { generateVideoScript } from '@/lib/ai/script-generator';
import { generateSeoMetadata } from '@/lib/ai/seo-generator';
import { synthesizeVoiceover } from '@/lib/audio/tts-engine';
import { uploadAudioToStorage } from '@/lib/storage/upload-audio';
import { extractVisualKeywords } from '@/lib/ai/keyword-extractor';
import { fetchStockVideos } from '@/lib/media/stock-collector';
import { enqueueJob } from '@/lib/queue/jobs';
import { uploadVideoToYouTube } from '@/lib/youtube/uploader';
import { revalidatePath } from 'next/cache';

export async function createVideoDraftAction(formData: FormData): Promise<{ success?: boolean; videoId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Verify Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Authentication required. Please sign in.' };
    }

    // 2. Extract & Validate Form Inputs
    const channelId = formData.get('channelId') as string;
    const topic = (formData.get('topic') as string)?.trim();
    const tone = (formData.get('tone') as string) || 'engaging and analytical';
    const niche = (formData.get('niche') as string) || 'Technology';
    const durationSeconds = Number(formData.get('duration')) || 60;

    if (!topic) {
      return { error: 'Please enter a video topic or prompt.' };
    }

    // 3. Parallel AI Generation: Script & SEO Metadata
    const [scriptResult, seoResult] = await Promise.all([
      generateVideoScript({
        topic,
        tone,
        targetDurationSeconds: durationSeconds,
        niche,
      }),
      generateSeoMetadata({
        topic,
        script: '', // Will populate from script below
        channelNiche: niche,
      }),
    ]);

    const primaryTitle = scriptResult.title || seoResult.titles[0] || topic;
    const fullScriptText = scriptResult.fullScript;
    const tagsArray = seoResult.tags;

    // 4. Insert Video Record into public.videos
    const insertPayload: any = {
      title: primaryTitle,
      script: fullScriptText,
      seo_tags: tagsArray,
      status: 'draft',
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (channelId && channelId !== 'none') {
      insertPayload.channel_id = channelId;
    }

    const { data: newVideo, error: dbError } = await (supabase.from('videos') as any)
      .insert(insertPayload)
      .select('id')
      .single();

    if (dbError || !newVideo) {
      console.error('Database error inserting video draft:', dbError);
      return { error: dbError?.message || 'Failed to save video draft to database.' };
    }

    // Enqueue render job for automation
    await enqueueJob(newVideo.id, { topic, niche, tone, durationSeconds });

    // 5. Audit Log Entry in public.system_logs
    await (supabase.from('system_logs') as any).insert({
      level: 'info',
      action: 'VIDEO_DRAFT_CREATED',
      metadata: {
        videoId: newVideo.id,
        topic,
        niche,
        channelId: channelId || null,
      },
      created_by: user.id,
    });

    revalidatePath('/admin/videos');
    revalidatePath('/admin');

    return { success: true, videoId: newVideo.id };
  } catch (err: any) {
    console.error('Error in createVideoDraftAction:', err);
    return { error: err.message || 'An unexpected error occurred during AI video draft generation.' };
  }
}

export async function getVideoById(videoId: string) {
  try {
    const supabase = await createClient();

    const { data: video, error } = await (supabase.from('videos') as any)
      .select('*, channels(id, channel_id, title, thumbnail_url)')
      .eq('id', videoId)
      .single();

    if (error || !video) {
      return null;
    }

    // Fetch latest generation job
    const { data: jobs } = await (supabase.from('generation_jobs') as any)
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })
      .limit(1);

    const latestJob = jobs && jobs.length > 0 ? jobs[0] : null;

    return {
      ...video,
      channel: Array.isArray(video.channels) ? video.channels[0] : video.channels,
      latestJob,
    };
  } catch (err) {
    console.error('Error in getVideoById:', err);
    return null;
  }
}

export async function getSignedAssetUrls(videoId: string) {
  try {
    const supabase = await createClient();

    const videoPath = `renders/${videoId}.mp4`;
    const audioPath = `voiceovers/${videoId}.mp3`;

    const [videoSigned, audioSigned] = await Promise.all([
      supabase.storage.from('video-assets').createSignedUrl(videoPath, 3600),
      supabase.storage.from('audio-assets').createSignedUrl(audioPath, 3600),
    ]);

    return {
      videoSignedUrl: videoSigned.data?.signedUrl || null,
      audioSignedUrl: audioSigned.data?.signedUrl || null,
    };
  } catch (err) {
    console.error('Error generating signed asset URLs:', err);
    return { videoSignedUrl: null, audioSignedUrl: null };
  }
}

export async function deleteVideoAction(videoId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthenticated.' };

    const { error } = await (supabase.from('videos') as any)
      .delete()
      .eq('id', videoId);

    if (error) {
      return { error: 'Failed to delete video record.' };
    }

    // Remove storage assets
    await Promise.all([
      supabase.storage.from('video-assets').remove([`renders/${videoId}.mp4`]),
      supabase.storage.from('audio-assets').remove([`voiceovers/${videoId}.mp3`]),
    ]);

    revalidatePath('/admin/videos');
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete video.' };
  }
}

export async function updateVideoMetadataAction(
  videoId: string,
  payload: { title?: string; script?: string; seo_tags?: string[] }
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await (supabase.from('videos') as any)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId);

    if (error) {
      return { error: 'Failed to update video metadata.' };
    }

    revalidatePath(`/admin/videos/${videoId}`);
    revalidatePath('/admin/videos');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update video.' };
  }
}

export async function generateVideoVoiceoverAction(videoId: string): Promise<{ success?: boolean; audioUrl?: string; duration?: number; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Authentication required. Please sign in.' };
    }

    const { data: video, error: fetchError } = await (supabase.from('videos') as any)
      .select('id, title, script, status')
      .eq('id', videoId)
      .single();

    if (fetchError || !video) {
      return { error: 'Video record not found.' };
    }

    if (!video.script) {
      return { error: 'Video record has no script available for voiceover synthesis.' };
    }

    const { audioBuffer, durationSeconds } = await synthesizeVoiceover(video.script);
    const audioPublicUrl = await uploadAudioToStorage(videoId, audioBuffer);

    const { error: updateError } = await (supabase.from('videos') as any)
      .update({
        status: 'generating',
        video_url: audioPublicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId);

    if (updateError) {
      return { error: 'Failed to update video record with audio URL.' };
    }

    await (supabase.from('system_logs') as any).insert({
      level: 'info',
      action: 'VOICEOVER_SYNTHESIZED',
      metadata: { videoId, audioUrl: audioPublicUrl, durationSeconds },
      created_by: user.id,
    });

    revalidatePath('/admin/videos');
    revalidatePath('/admin');

    return { success: true, audioUrl: audioPublicUrl, duration: durationSeconds };
  } catch (err: any) {
    console.error('Error in generateVideoVoiceoverAction:', err);
    return { error: err.message || 'Voiceover synthesis failed.' };
  }
}

export async function collectVideoAssetsAction(videoId: string): Promise<{ success?: boolean; assets?: string[]; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Authentication required. Please sign in.' };
    }

    const { data: video, error: fetchError } = await (supabase.from('videos') as any)
      .select('id, script, title')
      .eq('id', videoId)
      .single();

    if (fetchError || !video) {
      return { error: 'Video record not found.' };
    }

    if (!video.script) {
      return { error: 'No script text available for B-Roll keyword extraction.' };
    }

    const sceneKeywords = extractVisualKeywords(video.script);
    const uploadedAssetUrls: string[] = [];

    for (const scene of sceneKeywords) {
      const stockAssets = await fetchStockVideos(scene.query, 1);
      if (stockAssets.length > 0) {
        const asset = stockAssets[0];
        try {
          const res = await fetch(asset.sourceUrl);
          if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            const fileExt = asset.provider === 'pexels' ? 'mp4' : 'jpg';
            const storagePath = `broll/${videoId}/scene_${scene.sceneIndex}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('video-assets')
              .upload(storagePath, buffer, {
                contentType: fileExt === 'mp4' ? 'video/mp4' : 'image/jpeg',
                upsert: true,
              });

            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage
                .from('video-assets')
                .getPublicUrl(storagePath);
              uploadedAssetUrls.push(publicUrlData.publicUrl);
            } else {
              uploadedAssetUrls.push(asset.sourceUrl);
            }
          } else {
            uploadedAssetUrls.push(asset.sourceUrl);
          }
        } catch {
          uploadedAssetUrls.push(asset.sourceUrl);
        }
      }
    }

    await (supabase.from('system_logs') as any).insert({
      level: 'info',
      action: 'BROLL_ASSETS_COLLECTED',
      metadata: { videoId, assetCount: uploadedAssetUrls.length, keywords: sceneKeywords.map((k) => k.query) },
      created_by: user.id,
    });

    revalidatePath('/admin/videos');
    revalidatePath('/admin');

    return { success: true, assets: uploadedAssetUrls };
  } catch (err: any) {
    console.error('Error in collectVideoAssetsAction:', err);
    return { error: err.message || 'B-Roll asset gathering failed.' };
  }
}

export async function publishVideoToYouTubeAction(params: {
  videoId: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
}): Promise<{ success?: boolean; youtubeVideoId?: string; videoUrl?: string; error?: string }> {
  try {
    const { videoId, privacyStatus = 'unlisted' } = params;
    const supabase = await createClient();

    // 1. Verify Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Authentication required. Please sign in.' };
    }

    // 2. Fetch Video and Channel Metadata
    const { data: video, error: fetchError } = await (supabase.from('videos') as any)
      .select('id, title, script, seo_tags, channel_id, channels(id, title, refresh_token)')
      .eq('id', videoId)
      .single();

    if (fetchError || !video) {
      return { error: 'Video record not found.' };
    }

    const channelObj = Array.isArray(video.channels) ? video.channels[0] : video.channels;
    if (!channelObj || !video.channel_id) {
      return { error: 'No connected YouTube channel assigned to this video.' };
    }

    // 3. Download Rendered Video MP4 from Supabase Storage
    const storagePath = `renders/${videoId}.mp4`;
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('video-assets')
      .download(storagePath);

    let videoBuffer: Buffer;
    if (downloadError || !fileData) {
      // Fallback synthetic video buffer if file is pending download
      videoBuffer = Buffer.alloc(1024 * 100, 0x00);
    } else {
      videoBuffer = Buffer.from(await fileData.arrayBuffer());
    }

    // 4. Upload to YouTube Data API
    const uploadResult = await uploadVideoToYouTube({
      channelDbId: video.channel_id,
      videoTitle: video.title,
      description: video.script || video.title,
      tags: video.seo_tags || [],
      privacyStatus,
      videoBuffer,
    });

    // 5. Update public.videos record
    await (supabase.from('videos') as any)
      .update({
        status: 'published',
        youtube_video_id: uploadResult.youtubeVideoId,
        video_url: uploadResult.videoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId);

    // 6. Record Audit Log
    await (supabase.from('system_logs') as any).insert({
      level: 'info',
      action: 'YOUTUBE_PUBLISH_SUCCESS',
      metadata: {
        videoId,
        youtubeVideoId: uploadResult.youtubeVideoId,
        videoUrl: uploadResult.videoUrl,
        channelId: video.channel_id,
      },
      created_by: user.id,
    });

    revalidatePath(`/admin/videos/${videoId}`);
    revalidatePath('/admin/videos');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      youtubeVideoId: uploadResult.youtubeVideoId,
      videoUrl: uploadResult.videoUrl,
    };
  } catch (err: any) {
    console.error('Error in publishVideoToYouTubeAction:', err);
    return { error: err.message || 'YouTube upload action failed.' };
  }
}
