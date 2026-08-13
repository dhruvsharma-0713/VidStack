import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminProfile } from '@/lib/auth/get-profile';
import { createClient } from '@/lib/supabase/server';
import { ManagerInviteClient } from '@/components/admin/ManagerInviteClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const profile = await getAdminProfile();

  if (!profile) {
    redirect('/studio-access');
  }

  // Restrict settings exclusively to Owner
  if (profile.role !== 'owner') {
    redirect('/admin/dashboard?error=unauthorized');
  }

  const supabase = await createClient();
  const { data: profiles } = await (supabase.from('profiles') as any)
    .select('id, email, full_name, role')
    .order('created_at', { ascending: true });

  return <ManagerInviteClient existingProfiles={profiles || []} />;
}
