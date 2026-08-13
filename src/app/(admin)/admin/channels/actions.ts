'use server';

import { createClient } from '@/lib/supabase/server';
import { getYouTubeAuthUrl, refreshAccessToken, fetchChannelMetadata } from '@/lib/youtube/oauth';
import { revalidatePath } from 'next/cache';

export async function initiateYouTubeConnect(): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Authentication required. Please sign in.' };
    }

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    const role = (profile as { role?: string } | null)?.role ?? 'manager';

    if (role !== 'owner') {
      return { error: 'Only Owners can connect or manage YouTube channels.' };
    }

    const authUrl = getYouTubeAuthUrl();
    return { url: authUrl };
  } catch (err: any) {
    return { error: err.message || 'Failed to initiate YouTube connection.' };
  }
}

export async function syncChannelStats(channelDbId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Fetch channel record from DB
    const { data: channel, error: fetchError } = await (supabase.from('channels') as any)
      .select('*')
      .eq('id', channelDbId)
      .single();

    if (fetchError || !channel) {
      return { error: 'Channel record not found.' };
    }

    const channelRecord = channel as {
      id: string;
      channel_id: string;
      refresh_token: string | null;
    };

    if (!channelRecord.refresh_token) {
      return { error: 'No OAuth refresh token stored for this channel.' };
    }

    // 2. Refresh OAuth access token
    const tokenData = await refreshAccessToken(channelRecord.refresh_token);

    // 3. Fetch latest channel metadata
    const metadata = await fetchChannelMetadata(tokenData.access_token);

    // 4. Update channel in DB
    const { error: updateError } = await (supabase.from('channels') as any)
      .update({
        title: metadata.title,
        description: metadata.description,
        thumbnail_url: metadata.thumbnail_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', channelDbId);

    if (updateError) {
      return { error: 'Failed to update channel in database.' };
    }

    revalidatePath('/admin/channels');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to sync channel statistics.' };
  }
}

export async function toggleChannelActive(channelDbId: string, currentStatus: boolean): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthenticated.' };
    }

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if ((profile as { role?: string } | null)?.role !== 'owner') {
      return { error: 'Only Channel Owners can modify active channel status.' };
    }

    const { error } = await (supabase.from('channels') as any)
      .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
      .eq('id', channelDbId);

    if (error) {
      return { error: 'Failed to update status.' };
    }

    revalidatePath('/admin/channels');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to toggle channel status.' };
  }
}

export async function deleteChannel(channelDbId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthenticated.' };
    }

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if ((profile as { role?: string } | null)?.role !== 'owner') {
      return { error: 'Only Channel Owners can disconnect or delete channels.' };
    }

    const { error } = await (supabase.from('channels') as any)
      .delete()
      .eq('id', channelDbId);

    if (error) {
      return { error: 'Failed to delete channel record.' };
    }

    revalidatePath('/admin/channels');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to disconnect channel.' };
  }
}
