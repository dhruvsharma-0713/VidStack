import { createClient } from '@/lib/supabase/server';
import { Channel } from '@/types/database';

export type PublicChannel = Omit<Channel, 'refresh_token'>;

export async function getChannelsForUser(): Promise<PublicChannel[]> {
  try {
    const supabase = await createClient();

    // Select public fields ONLY; explicitly omit refresh_token for security
    const { data: channels, error } = await (supabase.from('channels') as any)
      .select('id, channel_id, title, description, thumbnail_url, is_active, created_by, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error || !channels) {
      console.error('Error fetching channels:', error);
      return [];
    }

    return channels as PublicChannel[];
  } catch (err) {
    console.error('Exception in getChannelsForUser:', err);
    return [];
  }
}
