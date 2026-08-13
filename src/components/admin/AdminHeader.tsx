'use client';

import React, { useTransition } from 'react';
import { LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { Profile } from '@/types/database';
import { signOut } from '@/app/auth/actions';

interface AdminHeaderProps {
  profile: Profile | null;
}

export function AdminHeader({ profile }: AdminHeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  const isOwner = profile?.role === 'owner';
  const fullName = profile?.full_name || 'Studio Member';
  const email = profile?.email || '';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
      {/* Left: Environment Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-200">VidStack v1.0</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono text-[11px]">Operational Studio</span>
        </div>
      </div>

      {/* Right: User Profile & Role Badge & Sign Out */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          {/* Role Badge */}
          {isOwner ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              OWNER (FULL ACCESS)
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-300 border border-sky-800/80 shadow-sm">
              <UserCheck className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
              MANAGER
            </span>
          )}

          {/* User Details */}
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200 leading-tight">{fullName}</span>
            <span className="text-[11px] text-slate-400 leading-tight truncate max-w-[180px]">{email}</span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          disabled={isPending}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-red-950/40 hover:border-red-800/60 hover:text-red-400 text-slate-400 transition text-xs font-medium flex items-center space-x-1.5 disabled:opacity-50"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
