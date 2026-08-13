import { createClient } from '@/lib/supabase/server';
import { Profile } from '@/types/database';

export async function getAdminProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Fallback object if profile record creation is pending
      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Studio User',
        role: 'partner',
        equity_share: 10.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return profile as Profile;
  } catch (error: any) {
    if (error?.digest === 'DYNAMIC_SERVER_USAGE' || error?.message?.includes('Dynamic server usage')) {
      throw error;
    }
    console.error('Error fetching admin profile:', error);
    return null;
  }
}
