'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export type AuthState = {
  error?: string;
};

export async function loginWithEmail(
  prevStateOrFormData: AuthState | FormData | null,
  formDataParam?: FormData
): Promise<AuthState> {
  let formData: FormData;
  if (prevStateOrFormData instanceof FormData) {
    formData = prevStateOrFormData;
  } else if (formDataParam instanceof FormData) {
    formData = formDataParam;
  } else {
    return { error: 'Invalid form submission.' };
  }

  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email address and password.' };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message || 'Invalid email address or password.' };
    }

    revalidatePath('/', 'layout');
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('Exception during loginWithEmail:', err);
    return { error: err?.message || 'An unexpected error occurred during authentication.' };
  }

  redirect('/admin/dashboard');
}

export async function signUpWithEmail(
  prevStateOrFormData: AuthState | FormData | null,
  formDataParam?: FormData
): Promise<AuthState> {
  let formData: FormData;
  if (prevStateOrFormData instanceof FormData) {
    formData = prevStateOrFormData;
  } else if (formDataParam instanceof FormData) {
    formData = formDataParam;
  } else {
    return { error: 'Invalid form submission.' };
  }

  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const fullName = (formData.get('fullName') as string)?.trim() || 'Studio Owner';
  const role = (formData.get('role') as string) || 'owner';

  if (!email || !password) {
    return { error: 'Please enter both email address and password.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { error: error.message || 'Failed to create account.' };
    }

    if (data?.user) {
      try {
        await (supabase.from('profiles') as any)
          .update({ role, full_name: fullName })
          .eq('id', data.user.id);
      } catch (profileErr) {
        console.error('Profile role assignment warning:', profileErr);
      }
    }

    revalidatePath('/', 'layout');
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('Exception during signUpWithEmail:', err);
    return { error: err?.message || 'An unexpected error occurred during account creation.' };
  }

  redirect('/admin/dashboard');
}

export async function loginWithGoogle() {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${host}`;

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data?.url) {
      redirect(data.url);
    }

    return { error: 'Failed to initiate Google authentication.' };
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('Exception during loginWithGoogle:', err);
    return { error: err?.message || 'Failed to initiate Google authentication.' };
  }
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
  } catch (err: any) {
    console.error('Exception during signOut:', err);
  }

  redirect('/auth/login');
}
