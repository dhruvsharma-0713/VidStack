import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminProfile } from '@/lib/auth/get-profile';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getAdminProfile();

  if (!profile) {
    redirect('/studio-access');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans overflow-hidden">
      {/* Role-Aware Sidebar */}
      <AdminSidebar profile={profile} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <AdminHeader profile={profile} />

        {/* Scrollable Main Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-950/90">
          {children}
        </main>
      </div>
    </div>
  );
}
