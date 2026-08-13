'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { Tv, RefreshCw, CheckCircle, PauseCircle, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/database';
import { PublicChannel } from '@/lib/channels/get-channels';
import { syncChannelStats, toggleChannelActive, deleteChannel } from '@/app/(admin)/admin/channels/actions';

interface ChannelCardProps {
  channel: PublicChannel;
  role: UserRole;
}

export function ChannelCard({ channel, role }: ChannelCardProps) {
  const [isSyncPending, startSyncTransition] = useTransition();
  const [isTogglePending, startToggleTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const isOwner = role === 'owner';

  const handleSync = () => {
    setMessage(null);
    startSyncTransition(async () => {
      const res = await syncChannelStats(channel.id);
      if (res.error) setMessage(res.error);
    });
  };

  const handleToggleActive = () => {
    if (!isOwner) return;
    setMessage(null);
    startToggleTransition(async () => {
      const res = await toggleChannelActive(channel.id, channel.is_active);
      if (res.error) setMessage(res.error);
    });
  };

  const handleDelete = () => {
    if (!isOwner) return;
    if (!confirm(`Are you sure you want to disconnect channel "${channel.title}"?`)) return;
    setMessage(null);
    startDeleteTransition(async () => {
      const res = await deleteChannel(channel.id);
      if (res.error) setMessage(res.error);
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md hover:border-slate-700/80 transition flex flex-col justify-between space-y-5">
      {/* Top Header & Avatar */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3.5 min-w-0">
            {channel.thumbnail_url ? (
              <img
                src={channel.thumbnail_url}
                alt={channel.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0 border border-slate-700">
                <Tv className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-100 truncate">{channel.title}</h3>
              <p className="text-xs text-slate-500 font-mono truncate">{channel.channel_id}</p>
            </div>
          </div>

          {/* Status Pill */}
          {channel.is_active ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 shrink-0">
              <CheckCircle className="w-3 h-3 mr-1" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
              <PauseCircle className="w-3 h-3 mr-1" /> Paused
            </span>
          )}
        </div>

        {channel.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {channel.description}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        {message && (
          <p className="text-[11px] text-red-400 font-medium">{message}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncPending}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncPending ? 'animate-spin' : ''}`} />
            Sync Metadata
          </Button>

          {isOwner && (
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleToggleActive}
                disabled={isTogglePending}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                {channel.is_active ? 'Pause' : 'Activate'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeletePending}
                className="text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
