import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const isValidUrl = Boolean(
    url && (url.startsWith('http://') || url.startsWith('https://')) && !url.includes('your_supabase_url')
  );

  if (!isValidUrl || !key) {
    const errorMsg =
      '[Supabase Client Error]: Missing or invalid NEXT_PUBLIC_SUPABASE_URL (must be a valid URL starting with http:// or https://) or NEXT_PUBLIC_SUPABASE_ANON_KEY.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return createBrowserClient<Database>(url, key);
}
