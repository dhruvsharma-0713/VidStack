'use client';

import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJobStatus } from '@/hooks/use-job-status';

interface JobProgressCardProps {
  jobId: string;
  onRetry?: () => void;
}

export function JobProgressCard({ jobId, onRetry }: JobProgressCardProps) {
  const { progress, currentStep, status, error, isLoading } = useJobStatus(jobId);

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center space-x-3 text-slate-400 text-xs">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
        <span>Connecting to render pipeline status...</span>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500';
      case 'failed':
        return 'bg-red-600';
      case 'processing':
        return 'bg-indigo-600';
      default:
        return 'bg-slate-600';
    }
  };

  const getBadgeIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
            {getBadgeIcon()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-100">Render Job Status</h3>
              <span className="text-[10px] text-slate-500 font-mono">#{jobId.slice(0, 8)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentStep}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xl font-extrabold text-slate-100">{progress}%</span>
        </div>
      </div>

      {/* Dynamic Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-500 ease-out ${getStatusColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Failure Banner & Retry Button */}
      {status === 'failed' && (
        <div className="p-3.5 bg-red-950/80 border border-red-800/80 rounded-xl flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-medium">{error || 'Render pipeline failed.'}</span>
          </div>
          {onRetry && (
            <Button size="sm" variant="danger" onClick={onRetry} className="text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry Render
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
