import React from 'react';
import { Terminal, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getLogMetrics } from '@/lib/logs/get-logs';

export async function LogsOverviewCards() {
  const metrics = await getLogMetrics();

  const cards = [
    {
      title: 'Total System Events (24h)',
      value: metrics.totalEvents24h.toString(),
      subtitle: 'Recorded audit logs',
      icon: Terminal,
      color: 'text-indigo-400',
    },
    {
      title: 'Active Generations',
      value: 'Operational',
      subtitle: 'Background worker running',
      icon: Activity,
      color: 'text-sky-400',
    },
    {
      title: 'Error Rate (24h)',
      value: `${metrics.errorRate}%`,
      subtitle: metrics.errorRate === '0.0' ? 'Zero exceptions logged' : 'Requires attention',
      icon: AlertTriangle,
      color: Number(metrics.errorRate) > 5 ? 'text-red-400' : 'text-emerald-400',
    },
    {
      title: 'Last YouTube Upload',
      value: metrics.lastUploadTime ? new Date(metrics.lastUploadTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'None Today',
      subtitle: metrics.lastUploadTime ? new Date(metrics.lastUploadTime).toLocaleDateString() : 'Awaiting publish trigger',
      icon: CheckCircle2,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md hover:border-slate-700/80 transition"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">{card.title}</span>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-extrabold text-slate-100 tracking-tight">{card.value}</p>
              <p className="text-[11px] text-slate-500 font-medium">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
