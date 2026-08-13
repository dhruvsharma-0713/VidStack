import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const isValidUrl = Boolean(
    url && (url.startsWith('http://') || url.startsWith('https://')) && !url.includes('your_supabase_url')
  );

  if (!isValidUrl || !key) {
    const errorMsg =
      '[Supabase Server Error]: Missing or invalid NEXT_PUBLIC_SUPABASE_URL (must be a valid URL starting with http:// or https://) or NEXT_PUBLIC_SUPABASE_ANON_KEY.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}
