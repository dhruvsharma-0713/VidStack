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

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message || 'Invalid login credentials.' };
  }

  revalidatePath('/', 'layout');
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

  if (data.user) {
    // Ensure profile role is assigned as 'owner' or selected role
    await (supabase.from('profiles') as any)
      .update({ role, full_name: fullName })
      .eq('id', data.user.id);
  }

  revalidatePath('/', 'layout');
  redirect('/admin/dashboard');
}

export async function loginWithGoogle() {
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
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth/login');
}
