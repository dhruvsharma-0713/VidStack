'use client';

import React from 'react';
import { Video, Sparkles, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VideoGeneratorTable() {
  const videos = [
    { title: 'Top 10 AI Tools in 2026', channel: 'Tech Trends Daily', status: 'rendered', date: '2026-08-12' },
    { title: 'Understanding Market Inflation', channel: 'Finance Fast Facts', status: 'generating', date: '2026-08-12' },
    { title: 'Future of Autonomous Robotics', channel: 'AI Insights Weekly', status: 'draft', date: '2026-08-11' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rendered':
      case 'published':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> {status}
          </span>
        );
      case 'generating':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-950 text-indigo-400 border border-indigo-800">
            <Clock className="w-3 h-3 mr-1 animate-spin" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Video Generation Queue</h2>
          <p className="text-xs text-slate-400">Monitor rendering and publishing status</p>
        </div>
        <Button size="sm" variant="primary">
          <Sparkles className="w-4 h-4 mr-1.5" /> Generate Video
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs text-slate-400 uppercase border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {videos.map((vid, i) => (
              <tr key={i} className="hover:bg-slate-800/40">
                <td className="px-4 py-3.5 font-medium text-slate-200">{vid.title}</td>
                <td className="px-4 py-3.5 text-slate-400">{vid.channel}</td>
                <td className="px-4 py-3.5">{getStatusBadge(vid.status)}</td>
                <td className="px-4 py-3.5 text-slate-400 text-xs">{vid.date}</td>
                <td className="px-4 py-3.5 text-right">
                  <Button size="sm" variant="ghost">View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
