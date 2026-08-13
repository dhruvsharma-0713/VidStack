'use client';

import React, { useState, useTransition } from 'react';
import { Tv, Send, CheckCircle2, AlertCircle, Loader2, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { publishVideoToYouTubeAction } from '@/app/(admin)/admin/videos/actions';

interface PublishVideoModalProps {
  videoId: string;
  videoTitle: string;
  channelTitle?: string;
  channelAvatar?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PublishVideoModal({
  videoId,
  videoTitle,
  channelTitle = 'Default Network Channel',
  channelAvatar,
  isOpen,
  onClose,
}: PublishVideoModalProps) {
  const [privacyStatus, setPrivacyStatus] = useState<'public' | 'unlisted' | 'private'>('unlisted');
  const [isPending, startTransition] = useTransition();
  const [publishResult, setPublishResult] = useState<{ videoUrl?: string; error?: string } | null>(null);

  if (!isOpen) return null;

  const handlePublish = () => {
    setPublishResult(null);
    startTransition(async () => {
      const res = await publishVideoToYouTubeAction({
        videoId,
        privacyStatus,
      });
      if (res.error) {
        setPublishResult({ error: res.error });
      } else {
        setPublishResult({ videoUrl: res.videoUrl });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-red-950/80 border border-red-800/80 rounded-xl text-red-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Publish Video to YouTube</h3>
              <p className="text-xs text-slate-400">Automated Data API v3 Upload</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {publishResult?.videoUrl ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-100">Successfully Uploaded to YouTube!</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Your video has been published and is processing on YouTube.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-400 truncate">
              {publishResult.videoUrl}
            </div>

            <div className="pt-2 flex justify-center space-x-3">
              <a
                href={publishResult.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" /> View on YouTube
              </a>
              <Button size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          /* Publish Configuration View */
          <div className="space-y-5 text-xs">
            {publishResult?.error && (
              <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-red-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{publishResult.error}</span>
              </div>
            )}

            {/* Target Channel Banner */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700 shrink-0">
                {channelAvatar ? (
                  <img src={channelAvatar} alt={channelTitle} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Tv className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Target Channel</span>
                <p className="text-sm font-bold text-slate-200 truncate">{channelTitle}</p>
              </div>
            </div>

            {/* Title Preview */}
            <div className="space-y-1">
              <label className="block text-slate-400 font-semibold">Video Title</label>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-medium truncate">
                {videoTitle}
              </div>
            </div>

            {/* Privacy Selector */}
            <div className="space-y-2">
              <label className="block text-slate-400 font-semibold">Privacy Status</label>
              <div className="grid grid-cols-3 gap-3">
                {(['unlisted', 'public', 'private'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setPrivacyStatus(status)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition ${
                      privacyStatus === status
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex justify-end space-x-3 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handlePublish} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading to YouTube...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1.5" /> Publish to YouTube Now
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
