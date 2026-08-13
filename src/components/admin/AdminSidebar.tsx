'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Tv, Video, Terminal, Settings, ShieldAlert } from 'lucide-react';
import { Profile } from '@/types/database';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  profile: Profile | null;
}

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname();
  const isOwner = profile?.role === 'owner';

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      ownerOnly: false,
    },
    {
      label: 'Multi-Channels',
      href: '/admin/channels',
      icon: Tv,
      ownerOnly: false,
    },
    {
      label: 'Video Factory',
      href: '/admin/videos',
      icon: Video,
      ownerOnly: false,
    },
    {
      label: 'System Logs',
      href: '/admin/logs',
      icon: Terminal,
      ownerOnly: false,
    },
    {
      label: 'API Credentials & Security',
      href: '/admin/settings',
      icon: Settings,
      ownerOnly: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => !item.ownerOnly || isOwner);

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 font-bold text-lg text-slate-100 tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Video className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="leading-none text-slate-100 font-extrabold">VidStack</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Studio Admin</span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin' || pathname === '/admin/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-400' : 'text-slate-500')} />
                <span className="truncate">{item.label}</span>
                {item.ownerOnly && (
                  <ShieldAlert className="w-3 h-3 text-amber-400 ml-auto shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Role Footer Info */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="px-3 py-2 bg-slate-950/60 border border-slate-800/60 rounded-xl flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Access Status</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
              isOwner
                ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                : 'bg-sky-950 text-sky-400 border border-sky-800/60'
            )}
          >
            {isOwner ? 'Owner' : 'Manager'}
          </span>
        </div>
      </div>
    </aside>
  );
}
