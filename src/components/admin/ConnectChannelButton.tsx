'use client';

import React, { useState, useTransition } from 'react';
import { Plus, RefreshCw, Lock, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/database';
import { initiateYouTubeConnect } from '@/app/(admin)/admin/channels/actions';

interface ConnectChannelButtonProps {
  role: UserRole;
}

export function ConnectChannelButton({ role }: ConnectChannelButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isOwner = role === 'owner';

  const handleConnect = () => {
    if (!isOwner) return;
    setErrorMessage(null);
    startTransition(async () => {
      const res = await initiateYouTubeConnect();
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.url) {
        window.location.href = res.url;
      }
    });
  };

  if (!isOwner) {
    return (
      <div className="relative group inline-block">
        <Button
          size="sm"
          variant="outline"
          disabled
          className="opacity-60 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-400"
        >
          <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Connect YouTube Channel
        </Button>
        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-300 shadow-xl z-50">
          OAuth credential management is restricted to Channel Owner.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <Button
        size="sm"
        variant="primary"
        onClick={handleConnect}
        disabled={isPending}
        className="shadow-md shadow-indigo-600/20 font-semibold"
      >
        {isPending ? (
          <>
            <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Connecting...
          </>
        ) : (
          <>
            <Tv className="w-4 h-4 mr-1.5 text-indigo-300" /> Connect YouTube Channel
          </>
        )}
      </Button>
      {errorMessage && (
        <span className="text-[11px] text-red-400 mt-1 font-medium">{errorMessage}</span>
      )}
    </div>
  );
}
