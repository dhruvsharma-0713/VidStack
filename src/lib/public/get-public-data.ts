import { createClient } from '@/lib/supabase/server';

export interface PublishedVideoWithChannel {
  id: string;
  title: string;
  script: string | null;
  seo_tags: string[] | null;
  status: string;
  video_url: string | null;
  youtube_video_id: string | null;
  created_at: string;
  channel?: {
    title: string;
    thumbnail_url: string | null;
  } | null;
}

export async function getPublicStats() {
  try {
    const supabase = await createClient();

    const [videosRes, channelsRes] = await Promise.all([
      (supabase.from('videos') as any).select('id', { count: 'exact', head: true }).eq('status', 'published'),
      (supabase.from('channels') as any).select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    return {
      publishedVideosCount: videosRes.count ?? 0,
      activeChannelsCount: channelsRes.count ?? 0,
    };
  } catch (err) {
    console.error('Error fetching public stats:', err);
    return {
      publishedVideosCount: 0,
      activeChannelsCount: 0,
    };
  }
}

export async function getPublishedVideos(): Promise<PublishedVideoWithChannel[]> {
  try {
    const supabase = await createClient();

    const { data: videos, error } = await (supabase.from('videos') as any)
      .select('id, title, script, seo_tags, status, video_url, youtube_video_id, created_at, channels(title, thumbnail_url)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(12);

    if (error || !videos) {
      return [];
    }

    return videos.map((v: any) => ({
      id: v.id,
      title: v.title,
      script: v.script,
      seo_tags: v.seo_tags,
      status: v.status,
      video_url: v.video_url,
      youtube_video_id: v.youtube_video_id,
      created_at: v.created_at,
      channel: Array.isArray(v.channels) ? v.channels[0] : v.channels,
    }));
  } catch (err) {
    console.error('Error fetching published videos:', err);
    return [];
  }
}
