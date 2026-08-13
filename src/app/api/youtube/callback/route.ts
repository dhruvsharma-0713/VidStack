import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens, fetchChannelMetadata } from '@/lib/youtube/oauth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');

  if (errorParam || !code) {
    return NextResponse.redirect(`${origin}/admin/channels?error=oauth_cancelled`);
  }

  try {
    const supabase = await createClient();

    // 1. Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(`${origin}/studio-access?error=unauthenticated`);
    }

    // 2. Verify Owner permissions
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    const role = (profile as { role?: string } | null)?.role ?? 'manager';

    if (role !== 'owner') {
      return NextResponse.redirect(`${origin}/admin/channels?error=owner_required_for_oauth`);
    }

    // 3. Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(`${origin}/admin/channels?error=invalid_tokens`);
    }

    // 4. Fetch channel metadata from YouTube Data API
    const metadata = await fetchChannelMetadata(tokens.access_token);

    // 5. Upsert channel metadata and refresh_token in public.channels database table
    const { error: dbError } = await (supabase.from('channels') as any)
      .upsert(
        {
          channel_id: metadata.id,
          title: metadata.title,
          description: metadata.description,
          thumbnail_url: metadata.thumbnail_url,
          refresh_token: tokens.refresh_token || null,
          is_active: true,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'channel_id' }
      );

    if (dbError) {
      console.error('Database error upserting channel:', dbError);
      return NextResponse.redirect(`${origin}/admin/channels?error=db_upsert_failed`);
    }

    return NextResponse.redirect(`${origin}/admin/channels?success=channel_connected`);
  } catch (error: any) {
    console.error('YouTube OAuth callback exception:', error);
    return NextResponse.redirect(`${origin}/admin/channels?error=oauth_failed`);
  }
}
