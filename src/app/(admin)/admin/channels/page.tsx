import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminProfile } from '@/lib/auth/get-profile';
import { getChannelsForUser } from '@/lib/channels/get-channels';
import { ConnectChannelButton } from '@/components/admin/ConnectChannelButton';
import { ChannelCard } from '@/components/admin/ChannelCard';
import { Tv, AlertCircle, CheckCircle2, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ChannelsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ChannelsPage({ searchParams }: ChannelsPageProps) {
  const profile = await getAdminProfile();

  if (!profile) {
    redirect('/auth/login');
  }

  const channels = await getChannelsForUser();
  const resolvedParams = await searchParams;

  const successParam = resolvedParams.success as string | undefined;
  const errorParam = resolvedParams.error as string | undefined;

  const getErrorMessage = (code?: string) => {
    if (!code) return null;
    switch (code) {
      case 'owner_required_for_oauth':
        return 'OAuth credential management is restricted to Channel Owner.';
      case 'oauth_cancelled':
        return 'YouTube OAuth authorization process was cancelled.';
      case 'oauth_failed':
        return 'Failed to complete YouTube OAuth connection. Please try again.';
      case 'db_upsert_failed':
        return 'Failed to store channel credentials in database.';
      default:
        return code.replace(/_/g, ' ');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Multi-Channel Operations</h1>
          <p className="text-xs text-slate-400 mt-1">Manage connected YouTube channels, OAuth access, and metadata sync.</p>
        </div>
        <ConnectChannelButton role={profile.role} />
      </div>

      {/* Notification Alerts */}
      {successParam === 'channel_connected' && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800/80 rounded-2xl flex items-center space-x-3 text-emerald-300 text-xs shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">YouTube channel connected successfully! OAuth credentials saved.</span>
        </div>
      )}

      {errorParam && (
        <div className="p-4 bg-red-950/80 border border-red-800/80 rounded-2xl flex items-center space-x-3 text-red-300 text-xs shadow-md">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="font-semibold capitalize-first">{getErrorMessage(errorParam)}</span>
        </div>
      )}

      {/* Channels Grid or Empty State */}
      {channels.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-2xl mx-auto shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mx-auto">
            <Tv className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-200">No YouTube Channels Connected</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Connect your first YouTube channel using Google OAuth to enable automated video generation, script rendering, and direct publishing.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <ConnectChannelButton role={profile.role} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} role={profile.role} />
          ))}
        </div>
      )}
    </div>
  );
}
