import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminProfile } from '@/lib/auth/get-profile';
import { getChannelsForUser } from '@/lib/channels/get-channels';
import { createClient } from '@/lib/supabase/server';
import { VideoStudioClient } from '@/components/admin/VideoStudioClient';

export const dynamic = 'force-dynamic';

export default async function VideosPage() {
  const profile = await getAdminProfile();

  if (!profile) {
    redirect('/auth/login');
  }

  const channels = await getChannelsForUser();

  const supabase = await createClient();
  const { data: videos, error } = await (supabase.from('videos') as any)
    .select('*, channels(title, thumbnail_url)')
    .order('created_at', { ascending: false });

  const formattedVideos = (videos || []).map((v: any) => ({
    ...v,
    channel: Array.isArray(v.channels) ? v.channels[0] : v.channels,
  }));

  return (
    <VideoStudioClient
      videos={formattedVideos}
      channels={channels}
      userRole={profile.role}
    />
  );
}
