'use client';

import React, { useState, useTransition } from 'react';
import { Tv, Plus, CheckCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initiateYouTubeConnect, syncChannelStats } from '@/app/(admin)/admin/channels/actions';

export function ChannelManager() {
  const [isConnectPending, startConnectTransition] = useTransition();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConnectChannel = () => {
    setMessage(null);
    startConnectTransition(async () => {
      const res = await initiateYouTubeConnect();
      if (res.error) {
        setMessage({ type: 'error', text: res.error });
      } else if (res.url) {
        window.location.href = res.url;
      }
    });
  };

  const handleSync = async (id: string) => {
    setMessage(null);
    setSyncingId(id);
    const res = await syncChannelStats(id);
    setSyncingId(null);
    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Channel statistics synced successfully.' });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">YouTube Channels</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage OAuth credentials, sync metrics, and channel status.</p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={handleConnectChannel}
          disabled={isConnectPending}
          className="shadow-md shadow-indigo-600/20 font-semibold"
        >
          {isConnectPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Connecting...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1.5" /> Connect YouTube Channel
            </>
          )}
        </Button>
      </div>

      {message && (
        <div
          className={`p-3.5 mb-5 rounded-xl border text-xs flex items-center space-x-2 ${
            message.type === 'error'
              ? 'bg-red-950/80 border-red-800/80 text-red-300'
              : 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-3">
        {[
          { dbId: 'chan-1', title: 'Tech Trends Daily', id: 'UC_tech_01', active: true, subs: '45.2K' },
          { dbId: 'chan-2', title: 'Finance Fast Facts', id: 'UC_fin_02', active: true, subs: '12.8K' },
          { dbId: 'chan-3', title: 'AI Insights Weekly', id: 'UC_ai_03', active: false, subs: '8.4K' },
        ].map((channel) => (
          <div key={channel.dbId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl gap-4 hover:border-slate-700/80 transition">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 border border-slate-700">
                <Tv className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">{channel.title}</p>
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5 font-mono">
                  <span>{channel.id}</span>
                  <span>•</span>
                  <span className="text-slate-500">{channel.subs} subscribers</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 self-end sm:self-center">
              {channel.active ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                  <CheckCircle className="w-3 h-3 mr-1" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/50">
                  <AlertCircle className="w-3 h-3 mr-1" /> Inactive
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSync(channel.dbId)}
                disabled={syncingId === channel.dbId}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${syncingId === channel.dbId ? 'animate-spin' : ''}`} />
                Sync
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
