'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminProfile } from '@/lib/auth/get-profile';
import { revalidatePath } from 'next/cache';

export async function createManagerAccountAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const profile = await getAdminProfile();
    if (!profile || profile.role !== 'owner') {
      return { error: 'Access denied. Owner permissions required to provision Manager accounts.' };
    }

    const email = (formData.get('email') as string)?.trim();
    const fullName = (formData.get('fullName') as string)?.trim();
    const password = formData.get('password') as string;

    if (!email || !password || !fullName) {
      return { error: 'Please fill in all fields (Full Name, Email, Password).' };
    }

    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters.' };
    }

    const supabase = await createClient();

    // Create user in Supabase Auth
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
      return { error: error.message || 'Failed to create Manager account.' };
    }

    if (data?.user) {
      // Set role to 'manager'
      await (supabase.from('profiles') as any)
        .update({ role: 'manager', full_name: fullName })
        .eq('id', data.user.id);
    }

    // Log audit event
    await (supabase.from('system_logs') as any).insert({
      level: 'info',
      action: 'MANAGER_ACCOUNT_PROVISIONED',
      metadata: { invitedEmail: email, fullName },
      created_by: profile.id,
    });

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err: any) {
    console.error('Error creating Manager account:', err);
    return { error: err?.message || 'An error occurred while creating Manager account.' };
  }
}
