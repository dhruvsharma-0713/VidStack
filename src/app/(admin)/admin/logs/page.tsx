import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminProfile } from '@/lib/auth/get-profile';
import { getSystemLogs } from '@/lib/logs/get-logs';
import { LogsOverviewCards } from '@/components/admin/LogsOverviewCards';
import { LogsTableClient } from '@/components/admin/LogsTableClient';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  const profile = await getAdminProfile();

  if (!profile) {
    redirect('/studio-access');
  }

  const { logs, totalCount } = await getSystemLogs({ limit: 100 });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">System & Audit Logs</h1>
        <p className="text-xs text-slate-400 mt-1">Audit log of system actions, background workers, API usage, and exception stack traces.</p>
      </div>

      {/* Metric Cards */}
      <LogsOverviewCards />

      {/* Interactive Logs Table */}
      <LogsTableClient initialLogs={logs} totalCount={totalCount} />
    </div>
  );
}
