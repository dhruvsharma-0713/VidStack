import React from 'react';
import { Video, Tv, Users } from 'lucide-react';

export function Counters() {
  const stats = [
    { label: 'Active Channels', value: '12+', icon: Tv },
    { label: 'Videos Rendered', value: '1,450+', icon: Video },
    { label: 'Partners & Creators', value: '25+', icon: Users },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex items-center space-x-4">
            <div className="p-3 bg-indigo-950/60 text-indigo-400 rounded-lg">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
              <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
