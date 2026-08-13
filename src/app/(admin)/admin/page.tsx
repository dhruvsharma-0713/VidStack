import React from 'react';
import Link from 'next/link';
import { Tv, Video, Sparkles, Terminal, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChannelManager } from '@/components/admin/channel-manager';
import { VideoGeneratorTable } from '@/components/admin/video-generator-table';

export default function AdminPage() {
  const metrics = [
    {
      title: 'Total Connected Channels',
      value: '3',
      subtitle: '2 active • 1 setup pending',
      icon: Tv,
      color: 'text-indigo-400',
    },
    {
      title: 'Total Videos Rendered',
      value: '128',
      subtitle: '+14 this week',
      icon: Video,
      color: 'text-emerald-400',
    },
    {
      title: 'Pending Generation Queue',
      value: '4',
      subtitle: '2 rendering • 2 draft',
      icon: Sparkles,
      color: 'text-amber-400',
    },
    {
      title: 'System Audit Status',
      value: 'Optimal',
      subtitle: '0 unhandled exceptions',
      icon: Terminal,
      color: 'text-sky-400',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Overview Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Studio Dashboard Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time status of channel operations, automated rendering pipeline, and logs.</p>
        </div>
        <div>
          <Link href="/admin/videos">
            <Button size="md" variant="primary" className="shadow-lg shadow-indigo-600/20 font-semibold">
              <Sparkles className="w-4 h-4 mr-2" /> Quick Generation <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md hover:border-slate-700/80 transition-all"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold text-slate-400">{metric.title}</span>
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{metric.value}</p>
                <p className="text-[11px] text-slate-500 font-medium">{metric.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Channel & Video Studio Modules */}
      <div className="space-y-8">
        <ChannelManager />
        <VideoGeneratorTable />
      </div>
    </div>
  );
}
