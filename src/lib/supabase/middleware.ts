import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database, UserRole } from '@/types/database';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Validate environment variables before creating client
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_supabase_url')) {
    console.warn('[Middleware Warning]: Supabase environment keys missing');
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Fetch current user auth state with try...catch protection
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // 1. Auth routes check (/auth/login)
    if (pathname.startsWith('/auth/login') || pathname === '/auth') {
      if (user) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    // 2. Admin Studio routes check (/admin/*)
    if (pathname.startsWith('/admin')) {
      // Unauthenticated users redirect to login
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/login';
        url.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(url);
      }

      // Owner-Restricted Routes check (/admin/settings/*, /admin/api-keys/*)
      const isOwnerRoute =
        pathname.startsWith('/admin/settings') ||
        pathname.startsWith('/admin/api-keys');

      if (isOwnerRoute) {
        const { data: profile, error } = await (supabase.from('profiles') as any)
          .select('role')
          .eq('id', user.id)
          .single();

        const typedProfile = profile as { role: UserRole } | null;
        const userRole = (!error && typedProfile) ? typedProfile.role : 'partner';

        if (userRole !== 'owner') {
          const url = request.nextUrl.clone();
          url.pathname = '/admin/dashboard';
          url.searchParams.set('error', 'unauthorized');
          return NextResponse.redirect(url);
        }
      }
    }

    return supabaseResponse;
  } catch (err) {
    console.error('[Middleware Warning]: Session token refresh or auth check failed:', err);
    return supabaseResponse;
  }
}
